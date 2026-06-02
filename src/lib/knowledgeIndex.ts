import { archetypeGuideNotes, libraryLearningPaths } from '../data/libraryContent.ts';
import type { LibraryPath } from '../data/libraryContent.ts';
import type { PhilosopherCard, ReadingCard, SchoolCard } from '../data/knowledge';
import type { Archetype } from './types';

export type KnowledgeCategoryId = 'archetypes' | 'philosophers' | 'schools' | 'readings';

export type KnowledgeItemKind = 'archetype' | 'philosopher' | 'school' | 'reading';

export interface KnowledgeCategoryTab {
  id: KnowledgeCategoryId;
  label: string;
  description: string;
}

export interface KnowledgeRelatedItem {
  id: string;
  kind: KnowledgeItemKind;
  title: string;
  eyebrow: string;
  description: string;
}

export interface KnowledgeIndexItem {
  id: string;
  kind: KnowledgeItemKind;
  title: string;
  eyebrow: string;
  description: string;
  detail: string;
  guideQuestion: string;
  bridgeNote: string;
  tags: string[];
  relatedArchetypeIds: string[];
  relatedItems: KnowledgeRelatedItem[];
  image?: string;
}

export interface KnowledgeIndex {
  archetypes: KnowledgeIndexItem[];
  philosophers: KnowledgeIndexItem[];
  schools: KnowledgeIndexItem[];
  readings: KnowledgeIndexItem[];
  paths: LibraryPath[];
}

export interface KnowledgeIndexInput {
  archetypes: Archetype[];
  philosopherCards: Record<string, PhilosopherCard>;
  schoolCards: Record<string, SchoolCard>;
  readingCards: Record<string, ReadingCard>;
}

export const knowledgeCategoryTabs: KnowledgeCategoryTab[] = [
  { id: 'archetypes', label: '原型', description: '15 种哲学画像' },
  { id: 'philosophers', label: '哲学家', description: '相邻思想资源' },
  { id: 'schools', label: '流派', description: '概念谱系入口' },
  { id: 'readings', label: '阅读', description: '继续读什么' },
];

const kindToCategory: Record<KnowledgeItemKind, KnowledgeCategoryId> = {
  archetype: 'archetypes',
  philosopher: 'philosophers',
  school: 'schools',
  reading: 'readings',
};

export function buildKnowledgeIndex({
  archetypes,
  philosopherCards,
  schoolCards,
  readingCards,
}: KnowledgeIndexInput): KnowledgeIndex {
  const philosopherRelations = buildRelatedArchetypeMap(archetypes, (archetype) => archetype.encyclopedia.philosopherIds);
  const schoolRelations = buildRelatedArchetypeMap(archetypes, (archetype) => archetype.encyclopedia.schoolIds);
  const readingRelations = buildRelatedArchetypeMap(archetypes, (archetype) => archetype.encyclopedia.readingIds);

  const baseIndex = {
    archetypes: archetypes.map<KnowledgeIndexItem>((archetype) => {
      const guide = archetypeGuideNotes[archetype.id];
      return {
        id: archetype.id,
        kind: 'archetype',
        title: archetype.title,
        eyebrow: archetype.englishTitle,
        description: archetype.summary,
        detail: [
          guide?.bridgeNote,
          ...archetype.encyclopedia.deepDive,
          `练习：${archetype.encyclopedia.practicePrompt}`,
        ]
          .filter(Boolean)
          .join('\n'),
        guideQuestion: guide?.guideQuestion ?? `这个原型最想保护的生活直觉是什么？`,
        bridgeNote: guide?.bridgeNote ?? '从原型画像进入，再查看相邻哲学家、流派和阅读入口。',
        image: archetype.image,
        tags: archetype.spectrumLabels,
        relatedArchetypeIds: [archetype.id],
        relatedItems: [],
      };
    }),
    philosophers: Object.values(philosopherCards).map<KnowledgeIndexItem>((card) => ({
      id: card.id,
      kind: 'philosopher',
      title: card.name,
      eyebrow: card.era,
      description: card.summary,
      detail: card.whyItMatters,
      guideQuestion: `如果从${card.name}进入，你会重新看见哪一种判断习惯？`,
      bridgeNote: '哲学家不是答案，而是帮助你把一种直觉读得更细的思想邻座。',
      tags: ['哲学家'],
      relatedArchetypeIds: philosopherRelations[card.id] ?? [],
      relatedItems: [],
    })),
    schools: Object.values(schoolCards).map<KnowledgeIndexItem>((card) => ({
      id: card.id,
      kind: 'school',
      title: card.name,
      eyebrow: '思想流派',
      description: card.summary,
      detail: card.resultHint,
      guideQuestion: `${card.name}优先保护什么，又容易遮住什么？`,
      bridgeNote: '流派标签用于定位问题，不用于把人固定成某一种主义。',
      tags: ['流派'],
      relatedArchetypeIds: schoolRelations[card.id] ?? [],
      relatedItems: [],
    })),
    readings: Object.values(readingCards).map<KnowledgeIndexItem>((card) => ({
      id: card.id,
      kind: 'reading',
      title: card.title,
      eyebrow: card.author,
      description: card.whyRead,
      detail: '把它当成一条入口即可：先读与你结果相关的章节或主题，再回头看完整脉络。',
      guideQuestion: `读${card.title}时，可以先问它回应了哪一种生活难题？`,
      bridgeNote: '阅读推荐只给入口，不要求一次读完整个思想史。',
      tags: ['阅读推荐'],
      relatedArchetypeIds: readingRelations[card.id] ?? [],
      relatedItems: [],
    })),
    paths: libraryLearningPaths,
  };

  const allItems = flattenKnowledgeItems(baseIndex);
  const itemLookup = buildItemLookup(allItems);
  const archetypeLookup = new Map(archetypes.map((archetype) => [archetype.id, archetype]));

  const attachLinks = (item: KnowledgeIndexItem): KnowledgeIndexItem => ({
    ...item,
    relatedItems: buildRelatedItems(item, itemLookup, archetypeLookup),
  });

  return {
    archetypes: baseIndex.archetypes.map(attachLinks),
    philosophers: baseIndex.philosophers.map(attachLinks),
    schools: baseIndex.schools.map(attachLinks),
    readings: baseIndex.readings.map(attachLinks),
    paths: baseIndex.paths,
  };
}

export function getKnowledgeCategoryForKind(kind: KnowledgeItemKind): KnowledgeCategoryId {
  return kindToCategory[kind];
}

function flattenKnowledgeItems(index: Omit<KnowledgeIndex, 'paths'>) {
  return [...index.archetypes, ...index.philosophers, ...index.schools, ...index.readings];
}

function buildItemLookup(items: KnowledgeIndexItem[]) {
  return new Map(items.map((item) => [`${item.kind}:${item.id}`, item]));
}

function buildRelatedItems(
  item: KnowledgeIndexItem,
  itemLookup: Map<string, KnowledgeIndexItem>,
  archetypeLookup: Map<string, Archetype>,
): KnowledgeRelatedItem[] {
  const keys: string[] = [];

  if (item.kind === 'archetype') {
    const archetype = archetypeLookup.get(item.id);
    if (archetype) {
      keys.push(
        ...archetype.encyclopedia.philosopherIds.map((id) => `philosopher:${id}`),
        ...archetype.encyclopedia.schoolIds.map((id) => `school:${id}`),
        ...archetype.encyclopedia.readingIds.map((id) => `reading:${id}`),
      );
    }
  } else {
    keys.push(...item.relatedArchetypeIds.map((id) => `archetype:${id}`));

    for (const archetypeId of item.relatedArchetypeIds) {
      const archetype = archetypeLookup.get(archetypeId);
      if (!archetype) continue;
      keys.push(
        ...archetype.encyclopedia.philosopherIds.map((id) => `philosopher:${id}`),
        ...archetype.encyclopedia.schoolIds.map((id) => `school:${id}`),
        ...archetype.encyclopedia.readingIds.map((id) => `reading:${id}`),
      );
    }
  }

  return unique(keys)
    .filter((key) => key !== `${item.kind}:${item.id}`)
    .map((key) => itemLookup.get(key))
    .filter((related): related is KnowledgeIndexItem => Boolean(related))
    .slice(0, item.kind === 'archetype' ? 9 : 8)
    .map(({ id, kind, title, eyebrow, description }) => ({ id, kind, title, eyebrow, description }));
}

function buildRelatedArchetypeMap(archetypes: Archetype[], selectIds: (archetype: Archetype) => string[]) {
  const map: Record<string, string[]> = {};

  for (const archetype of archetypes) {
    for (const id of selectIds(archetype)) {
      map[id] = [...(map[id] ?? []), archetype.id];
    }
  }

  return map;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

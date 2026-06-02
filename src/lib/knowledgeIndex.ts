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

export interface KnowledgeDetailSection {
  title: string;
  body: string;
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
  detailSections: KnowledgeDetailSection[];
  portraitItems: KnowledgeDetailSection[];
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
        detailSections: buildArchetypeDetailSections(archetype, guide, philosopherCards, schoolCards, readingCards),
        portraitItems: buildPortraitItems(archetype),
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
      detailSections: buildPhilosopherDetailSections(card, philosopherRelations[card.id] ?? [], archetypes),
      portraitItems: [],
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
      detailSections: buildSchoolDetailSections(card, schoolRelations[card.id] ?? [], archetypes),
      portraitItems: [],
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
      detailSections: buildReadingDetailSections(card, readingRelations[card.id] ?? [], archetypes),
      portraitItems: [],
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

function buildPortraitItems(archetype: Archetype): KnowledgeDetailSection[] {
  const { portrait } = archetype.encyclopedia;
  return [
    { title: '真正想保护', body: portrait.coreDrive },
    { title: '判断方式', body: portrait.decisionStyle },
    { title: '行动风格', body: portrait.actionStyle },
    { title: '关系模式', body: portrait.relationshipPattern },
    { title: '压力下', body: portrait.underPressure },
    { title: '容易被误读为', body: portrait.misreadAs },
    { title: '成长提醒', body: portrait.growthEdge },
  ];
}

function buildArchetypeDetailSections(
  archetype: Archetype,
  guide: (typeof archetypeGuideNotes)[string] | undefined,
  philosopherCards: Record<string, PhilosopherCard>,
  schoolCards: Record<string, SchoolCard>,
  readingCards: Record<string, ReadingCard>,
): KnowledgeDetailSection[] {
  const philosopherNames = archetype.encyclopedia.philosopherIds.map((id) => philosopherCards[id]?.name).filter(Boolean).join('、');
  const schoolNames = archetype.encyclopedia.schoolIds.map((id) => schoolCards[id]?.name).filter(Boolean).join('、');
  const readingNames = archetype.encyclopedia.readingIds.map((id) => readingCards[id]?.title).filter(Boolean).join('、');
  const [firstDive, secondDive] = archetype.encyclopedia.deepDive;

  return [
    {
      title: '核心问题',
      body: `${guide?.guideQuestion ?? '这个原型最想保护的生活直觉是什么？'} ${archetype.encyclopedia.portrait.coreDrive} ${firstDive}`,
    },
    {
      title: '哲学谱系',
      body: `${archetype.academicNote} 它在本站中靠近 ${archetype.spectrumLabels.join('、')}，可以继续从 ${schoolNames} 这些流派语言里细读。`,
    },
    {
      title: '生活场景',
      body: `${archetype.insight} 在日常处境里，这通常表现为：${archetype.encyclopedia.portrait.actionStyle}${archetype.encyclopedia.portrait.relationshipPattern}`,
    },
    {
      title: '常见误读',
      body: `${archetype.encyclopedia.portrait.misreadAs} 进一步说，${archetype.blindSpot} 压力大时尤其要留意：${archetype.encyclopedia.portrait.underPressure}`,
    },
    {
      title: '成长练习',
      body: `${archetype.encyclopedia.portrait.growthEdge} 可以从一个小练习开始：${archetype.encyclopedia.practicePrompt}`,
    },
    {
      title: '继续阅读',
      body: `${guide?.bridgeNote ?? '从原型画像进入，再查看相邻哲学家、流派和阅读入口。'} 推荐先看 ${philosopherNames}，再沿着 ${readingNames} 进入文本；${secondDive}`,
    },
  ];
}

function buildPhilosopherDetailSections(
  card: PhilosopherCard,
  relatedArchetypeIds: string[],
  archetypes: Archetype[],
): KnowledgeDetailSection[] {
  const relatedNames = formatRelatedArchetypeNames(relatedArchetypeIds, archetypes);
  return [
    {
      title: '核心问题',
      body: `${card.summary} 读 ${card.name} 时，可以先问：他把人的判断、自由或共同生活放在什么边界里理解。`,
    },
    {
      title: '与你的关系',
      body: `${card.whyItMatters} 在本站原型里，他尤其会照亮 ${relatedNames} 这些相邻路径，而不是给出唯一答案。`,
    },
    {
      title: '阅读提醒',
      body: `不要急着把 ${card.name} 当作标签贴在自己身上。先抓住他处理问题的方式，再回头比较你的五领域画像里哪一处最需要这种提醒。`,
    },
  ];
}

function buildSchoolDetailSections(
  card: SchoolCard,
  relatedArchetypeIds: string[],
  archetypes: Archetype[],
): KnowledgeDetailSection[] {
  const relatedNames = formatRelatedArchetypeNames(relatedArchetypeIds, archetypes);
  return [
    {
      title: '它关心什么',
      body: `${card.summary} ${card.resultHint} 它首先是一种提问方式，帮助你判断什么该被放在讨论中心，也帮助你把测试里的直觉翻译成更可讨论的哲学语言。`,
    },
    {
      title: '容易误解什么',
      body: `不要把${card.name}读成固定立场或身份标签。它能打开一种问题视角，也可能因为过度强调自己的核心关切而遮住其他生活重量；真正有用的读法，是把它当成一盏灯，而不是一张身份证。`,
    },
    {
      title: '相关原型',
      body: `在本站中，${card.name}常和 ${relatedNames} 相邻。读这些原型时，可以观察同一流派怎样在不同生活问题里呈现出不同气质。`,
    },
  ];
}

function buildReadingDetailSections(
  card: ReadingCard,
  relatedArchetypeIds: string[],
  archetypes: Archetype[],
): KnowledgeDetailSection[] {
  const relatedNames = formatRelatedArchetypeNames(relatedArchetypeIds, archetypes);
  return [
    {
      title: '先读什么',
      body: `${card.whyRead} 第一次进入时，可以先读与你结果相关的章节、导论或核心段落，不必立刻追求完整通读；先抓住作者怎样提出问题，再看它怎样组织理由。`,
    },
    {
      title: '适合谁',
      body: `这本书适合靠近 ${relatedNames} 的读者：它能把测试里的直觉推进到更稳定的概念、论证或生活问题，也能帮你分辨自己是在坚持立场，还是在学习一种更细的判断方式。`,
    },
    {
      title: '读的时候问什么',
      body: `读 ${card.title} 时，先问作者为什么这样安排问题，再问它会支持你的哪种倾向、修正你的哪种盲点。读完后回到五领域画像，看看哪一项最被改变。`,
    },
  ];
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

function formatRelatedArchetypeNames(ids: string[], archetypes: Archetype[]) {
  const names = ids
    .map((id) => archetypes.find((archetype) => archetype.id === id)?.shortName)
    .filter(Boolean)
    .slice(0, 4);
  return names.length > 0 ? names.join('、') : '若干相邻原型';
}

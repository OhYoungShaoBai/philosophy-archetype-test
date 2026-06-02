import type { PhilosopherCard, ReadingCard, SchoolCard } from '../data/knowledge';
import type { Archetype } from './types';

export type KnowledgeCategoryId = 'archetypes' | 'philosophers' | 'schools' | 'readings';

export type KnowledgeItemKind = 'archetype' | 'philosopher' | 'school' | 'reading';

export interface KnowledgeCategoryTab {
  id: KnowledgeCategoryId;
  label: string;
  description: string;
}

export interface KnowledgeIndexItem {
  id: string;
  kind: KnowledgeItemKind;
  title: string;
  eyebrow: string;
  description: string;
  detail: string;
  tags: string[];
  relatedArchetypeIds: string[];
  image?: string;
}

export interface KnowledgeIndex {
  archetypes: KnowledgeIndexItem[];
  philosophers: KnowledgeIndexItem[];
  schools: KnowledgeIndexItem[];
  readings: KnowledgeIndexItem[];
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

export function buildKnowledgeIndex({
  archetypes,
  philosopherCards,
  schoolCards,
  readingCards,
}: KnowledgeIndexInput): KnowledgeIndex {
  const philosopherRelations = buildRelatedArchetypeMap(archetypes, (archetype) => archetype.encyclopedia.philosopherIds);
  const schoolRelations = buildRelatedArchetypeMap(archetypes, (archetype) => archetype.encyclopedia.schoolIds);
  const readingRelations = buildRelatedArchetypeMap(archetypes, (archetype) => archetype.encyclopedia.readingIds);

  return {
    archetypes: archetypes.map((archetype) => ({
      id: archetype.id,
      kind: 'archetype',
      title: archetype.title,
      eyebrow: archetype.englishTitle,
      description: archetype.summary,
      detail: [...archetype.encyclopedia.deepDive, archetype.encyclopedia.practicePrompt].join('\n'),
      image: archetype.image,
      tags: archetype.spectrumLabels,
      relatedArchetypeIds: [archetype.id],
    })),
    philosophers: Object.values(philosopherCards).map((card) => ({
      id: card.id,
      kind: 'philosopher',
      title: card.name,
      eyebrow: card.era,
      description: card.summary,
      detail: card.whyItMatters,
      tags: ['哲学家'],
      relatedArchetypeIds: philosopherRelations[card.id] ?? [],
    })),
    schools: Object.values(schoolCards).map((card) => ({
      id: card.id,
      kind: 'school',
      title: card.name,
      eyebrow: '思想流派',
      description: card.summary,
      detail: card.resultHint,
      tags: ['流派'],
      relatedArchetypeIds: schoolRelations[card.id] ?? [],
    })),
    readings: Object.values(readingCards).map((card) => ({
      id: card.id,
      kind: 'reading',
      title: card.title,
      eyebrow: card.author,
      description: card.whyRead,
      detail: '把它当成一条入口即可：先读与你结果相关的章节或主题，再回头看完整脉络。',
      tags: ['阅读推荐'],
      relatedArchetypeIds: readingRelations[card.id] ?? [],
    })),
  };
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

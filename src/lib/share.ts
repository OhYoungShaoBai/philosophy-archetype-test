import {
  axisDimensionKeys,
  dimensionDefinitions,
  traditionDimensionKeys,
  traditionKeysByDimension,
} from './scoring.ts';
import type { TestResult, TraditionKey } from './types.ts';

export interface ShareOptions {
  personalNote?: string;
}

export interface ShareAxisScore {
  kind: 'axis';
  dimension: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
}

export interface ShareTraditionScore {
  kind: 'tradition';
  dimension: string;
  label: string;
  entries: {
    label: string;
    value: number;
  }[];
}

export type ShareDomainScore = ShareAxisScore | ShareTraditionScore;

export interface ShareCardData {
  title: string;
  englishTitle: string;
  headline: string;
  image: string;
  spectrumLabels: string[];
  matchLabel: string;
  summary: string;
  domainScores: ShareDomainScore[];
  profileHighlights: string[];
  personalNote?: string;
  invitation: string;
  disclaimer: string;
}

const disclaimer = '这不是科学人格诊断，而是一张哲学自我理解的临时地图。';
const invitation = '也可以来做一次哲学自我理解测试：https://philosophy-archetype-test.vercel.app/';
const friendInvitation = '看看你的朋友会走向哪一种思想原型，也许你们会在同一张哲学地图上相邻。';
const cardInvitation = '邀请朋友一起测：比较彼此更靠近哪一种思想原型。';

export function buildShareText(result: TestResult, options: ShareOptions = {}) {
  const { archetype } = result.primary;
  const note = normalizePersonalNote(options.personalNote);
  const domainLine = buildDomainScores(result)
    .map((item) => {
      if (item.kind === 'axis') {
        return `${item.label} ${item.value}`;
      }
      const top = item.entries[0];
      return `${item.label}：${top.label} ${top.value}`;
    })
    .join(' · ');
  const highlights = result.profileHighlights
    .slice(0, 3)
    .map((item) => item.label)
    .join('；');

  return [
    `我的哲学思想倾向：${archetype.title} / ${archetype.englishTitle}`,
    `贴近程度：${result.primary.matchStrength.label}（${result.primary.matchStrength.description}）`,
    `思想谱系：${archetype.spectrumLabels.join(' · ')}`,
    `五领域画像：${domainLine}`,
    `画像摘记：${highlights}`,
    note ? `我的备注：${note}` : '',
    archetype.summary,
    `相近思想家：${archetype.philosophers.join('、')}`,
    friendInvitation,
    invitation,
    disclaimer,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildShareCardData(result: TestResult, options: ShareOptions = {}): ShareCardData {
  const { archetype } = result.primary;
  return {
    title: archetype.title,
    englishTitle: archetype.englishTitle,
    headline: result.resultMode === 'profile-led' ? '混合画像' : '思想原型',
    image: archetype.image,
    spectrumLabels: archetype.spectrumLabels,
    matchLabel: result.primary.matchStrength.label,
    summary: archetype.summary,
    domainScores: buildDomainScores(result),
    profileHighlights: result.profileHighlights.slice(0, 3).map((item) => item.label),
    personalNote: normalizePersonalNote(options.personalNote),
    invitation: cardInvitation,
    disclaimer,
  };
}

function buildDomainScores(result: TestResult): ShareDomainScore[] {
  const axisScores = axisDimensionKeys.map<ShareAxisScore>((dimension) => {
    const definition = dimensionDefinitions[dimension];
    if (definition.mode !== 'axis') {
      throw new Error('Axis dimension definition mismatch.');
    }
    return {
      kind: 'axis',
      dimension,
      label: definition.name,
      leftLabel: definition.leftLabel,
      rightLabel: definition.rightLabel,
      value: result.axisScores[dimension],
    };
  });

  const traditionScores = traditionDimensionKeys.map<ShareTraditionScore>((dimension) => {
    const definition = dimensionDefinitions[dimension];
    if (definition.mode !== 'tradition') {
      throw new Error('Tradition dimension definition mismatch.');
    }
    const labels = new Map(definition.traditions.map((tradition) => [tradition.key, tradition.label]));
    return {
      kind: 'tradition',
      dimension,
      label: definition.name,
      entries: traditionKeysByDimension[dimension]
        .map((key) => ({
          label: labels.get(key as TraditionKey) ?? key,
          value: result.traditionScores[dimension][key] ?? 0,
        }))
        .sort((a, b) => b.value - a.value),
    };
  });

  return [axisScores[0], ...traditionScores, axisScores[1]];
}

function normalizePersonalNote(note?: string) {
  const trimmed = note?.trim();
  if (!trimmed) return undefined;
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
}

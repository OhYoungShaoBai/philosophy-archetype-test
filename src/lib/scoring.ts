import type { Answers, Archetype, DimensionKey, DimensionVector, Question, ScoredArchetype, TestResult } from './types';

export const dimensionKeys: DimensionKey[] = ['truth', 'meaning', 'ethics', 'society'];

const emptyVector = (): DimensionVector => ({
  truth: 0,
  meaning: 0,
  ethics: 0,
  society: 0,
});

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function normalizeVector(vector: DimensionVector): DimensionVector {
  return Object.fromEntries(
    dimensionKeys.map((key) => [key, Math.round(clamp(((vector[key] + 2) / 4) * 100, 0, 100))]),
  ) as DimensionVector;
}

function normalizeRawScores(raw: DimensionVector, ranges: DimensionVector): DimensionVector {
  return Object.fromEntries(
    dimensionKeys.map((key) => {
      const range = ranges[key] || 1;
      return [key, Math.round(clamp(((raw[key] / range) + 1) * 50, 0, 100))];
    }),
  ) as DimensionVector;
}

function getDimensionRanges(questions: Question[]): DimensionVector {
  const ranges = emptyVector();
  for (const question of questions) {
    for (const key of dimensionKeys) {
      const strongestOption = Math.max(...question.options.map((option) => Math.abs(option.weights[key] ?? 0)));
      ranges[key] += strongestOption;
    }
  }
  return ranges;
}

function distance(a: DimensionVector, b: DimensionVector) {
  const sum = dimensionKeys.reduce((total, key) => total + (a[key] - b[key]) ** 2, 0);
  return Math.sqrt(sum);
}

export function calculateResult(questions: Question[], archetypes: Archetype[], answers: Answers): TestResult {
  if (questions.length === 0) {
    throw new Error('题库为空，无法生成结果。');
  }
  if (archetypes.length === 0) {
    throw new Error('结果原型为空，无法生成结果。');
  }

  const raw = emptyVector();
  for (const question of questions) {
    const answerId = answers[question.id];
    const selected = question.options.find((option) => option.id === answerId);
    if (!selected) {
      throw new Error('还有题目未完成，暂时不能生成结果。');
    }
    for (const key of dimensionKeys) {
      raw[key] += selected.weights[key] ?? 0;
    }
  }

  const vector = normalizeRawScores(raw, getDimensionRanges(questions));
  const ranked = archetypes
    .map<ScoredArchetype>((archetype) => ({
      archetype,
      distance: distance(vector, archetype.vector),
    }))
    .sort((a, b) => a.distance - b.distance);

  return {
    vector,
    primary: ranked[0],
    related: ranked.slice(1, 3),
  };
}

export function getAnsweredCount(questions: Question[], answers: Answers) {
  return questions.filter((question) => Boolean(answers[question.id])).length;
}

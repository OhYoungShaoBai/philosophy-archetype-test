import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateResult, normalizeVector } from './scoring.ts';
import { archetypes } from '../data/results.ts';
import type { Answers, DimensionVector, Question } from './types.ts';

const dimensions = ['truth', 'meaning', 'ethics', 'society'] as const;

function option(id: string, weights: Partial<DimensionVector>) {
  return { id, label: id, description: id, weights };
}

test('normalizes dimension vectors to a 0-100 scale', () => {
  assert.deepEqual(normalizeVector({ truth: -2, meaning: 0, ethics: 1, society: 2 }), {
    truth: 0,
    meaning: 50,
    ethics: 75,
    society: 100,
  });
});

test('matches a fixed answer pattern to the nearest archetype', () => {
  const questions: Question[] = dimensions.map((dimension) => ({
    id: `q-${dimension}`,
    area: 'test',
    prompt: dimension,
    context: dimension,
    options: [
      option('toward-positive', { [dimension]: 2 }),
      option('toward-negative', { [dimension]: -2 }),
    ],
  }));
  const answers: Answers = {
    'q-truth': 'toward-positive',
    'q-meaning': 'toward-positive',
    'q-ethics': 'toward-positive',
    'q-society': 'toward-negative',
  };

  const result = calculateResult(questions, archetypes, answers);

  assert.equal(result.primary.archetype.id, 'architect-reason');
  assert.ok(result.related.length > 0);
});

test('rejects incomplete answers instead of producing a result', () => {
  const questions: Question[] = [
    {
      id: 'q-truth',
      area: 'test',
      prompt: 'truth',
      context: 'truth',
      options: [option('a', { truth: 1 })],
    },
  ];

  assert.throws(() => calculateResult(questions, archetypes, {}), /未完成/);
});

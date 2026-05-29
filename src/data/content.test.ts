import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { questions } from './questions.ts';
import { archetypes } from './results.ts';

const dimensions = new Set(['truth', 'meaning', 'ethics', 'society']);
const illustrationDir = join(process.cwd(), 'public', 'illustrations');

test('ships exactly 20 scenario questions with four weighted options each', () => {
  assert.equal(questions.length, 20);
  for (const question of questions) {
    assert.equal(question.options.length, 4, question.id);
    for (const option of question.options) {
      assert.ok(Object.keys(option.weights).length > 0, `${question.id}/${option.id}`);
      for (const [dimension, value] of Object.entries(option.weights)) {
        assert.ok(dimensions.has(dimension), `${question.id}/${option.id}/${dimension}`);
        assert.equal(typeof value, 'number');
        assert.ok(value >= -3 && value <= 3, `${question.id}/${option.id}/${dimension}`);
      }
    }
  }
});

test('defines eight complete result archetypes', () => {
  assert.equal(archetypes.length, 8);
  for (const archetype of archetypes) {
    assert.ok(archetype.title);
    assert.ok(archetype.englishTitle);
    assert.ok(archetype.summary);
    assert.equal(archetype.philosophers.length, 3);
    assert.ok(archetype.schools.length >= 2);
    for (const dimension of dimensions) {
      assert.equal(typeof archetype.vector[dimension as keyof typeof archetype.vector], 'number');
    }
  }
});

test('keeps only final referenced illustrations in the public result set', () => {
  for (const archetype of archetypes) {
    assert.ok(existsSync(join(process.cwd(), 'public', archetype.image)), archetype.image);
  }

  const draftFiles = readdirSync(illustrationDir).filter((file) => file.startsWith('prototype-'));
  assert.deepEqual(draftFiles, []);
});

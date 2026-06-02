import test from 'node:test';
import assert from 'node:assert/strict';
import { archetypes } from '../data/results.ts';
import { philosopherCards, readingCards, schoolCards } from '../data/knowledge.ts';
import { buildKnowledgeIndex, knowledgeCategoryTabs } from './knowledgeIndex.ts';

test('builds a lightweight library index from existing v0.3 knowledge data', () => {
  const index = buildKnowledgeIndex({ archetypes, philosopherCards, schoolCards, readingCards });

  assert.deepEqual(
    knowledgeCategoryTabs.map((tab) => tab.id),
    ['archetypes', 'philosophers', 'schools', 'readings'],
  );
  assert.equal(index.archetypes.length, archetypes.length);
  assert.equal(index.philosophers.length, Object.keys(philosopherCards).length);
  assert.equal(index.schools.length, Object.keys(schoolCards).length);
  assert.equal(index.readings.length, Object.keys(readingCards).length);

  const sample = index.archetypes[0];
  assert.equal(sample.kind, 'archetype');
  assert.ok(sample.image?.startsWith('/illustrations/archetypes/'));
  assert.ok(sample.tags.length >= 3);
  assert.ok(sample.description.length >= 16);
});

test('library index links knowledge cards back to valid archetypes without external links', () => {
  const index = buildKnowledgeIndex({ archetypes, philosopherCards, schoolCards, readingCards });
  const archetypeIds = new Set(archetypes.map((archetype) => archetype.id));
  const knowledgeItems = [...index.philosophers, ...index.schools, ...index.readings];

  for (const item of knowledgeItems) {
    assert.ok(item.relatedArchetypeIds.length >= 1, `${item.kind}/${item.id} should reference an archetype`);
    for (const archetypeId of item.relatedArchetypeIds) {
      assert.ok(archetypeIds.has(archetypeId), `${item.kind}/${item.id} references missing archetype ${archetypeId}`);
    }
    assert.ok(!item.description.includes('http'), `${item.kind}/${item.id} description has external link`);
    assert.ok(!item.detail.includes('http'), `${item.kind}/${item.id} detail has external link`);
  }
});

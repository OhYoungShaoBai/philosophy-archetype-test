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

test('library index builds cross-category links for every knowledge item', () => {
  const index = buildKnowledgeIndex({ archetypes, philosopherCards, schoolCards, readingCards });
  const allItems = [...index.archetypes, ...index.philosophers, ...index.schools, ...index.readings];
  const validKeys = new Set(allItems.map((item) => `${item.kind}:${item.id}`));

  for (const item of allItems) {
    assert.ok(item.guideQuestion.length >= 12, `${item.kind}/${item.id} should have a guide question`);
    assert.ok(item.relatedItems.length >= 2, `${item.kind}/${item.id} should expose cross-category links`);
    assert.ok(
      item.relatedItems.some((link) => link.kind !== item.kind),
      `${item.kind}/${item.id} should link outside its own category`,
    );

    for (const link of item.relatedItems) {
      assert.ok(validKeys.has(`${link.kind}:${link.id}`), `${item.kind}/${item.id} links missing item ${link.kind}/${link.id}`);
      assert.notEqual(`${link.kind}:${link.id}`, `${item.kind}:${item.id}`, `${item.kind}/${item.id} links to itself`);
      assert.ok(!link.description.includes('http'), `${item.kind}/${item.id} related link has external link`);
    }
  }
});

test('library index exposes three guided reading paths with valid targets', () => {
  const index = buildKnowledgeIndex({ archetypes, philosopherCards, schoolCards, readingCards });
  const allItems = [...index.archetypes, ...index.philosophers, ...index.schools, ...index.readings];
  const validKeys = new Set(allItems.map((item) => `${item.kind}:${item.id}`));

  assert.deepEqual(
    index.paths.map((path) => path.id),
    ['my-archetype', 'five-domains', 'school-map'],
  );

  for (const path of index.paths) {
    assert.ok(path.title.length >= 4, path.id);
    assert.ok(path.description.length >= 24, path.id);
    assert.ok(path.steps.length >= 3, path.id);
    assert.ok(!path.description.includes('http'), `${path.id} has external link`);

    for (const step of path.steps) {
      assert.ok(step.description.length >= 20, `${path.id}/${step.title}`);
      assert.ok(validKeys.has(`${step.targetKind}:${step.targetId}`), `${path.id} step links missing ${step.targetKind}/${step.targetId}`);
      assert.ok(!step.description.includes('http'), `${path.id}/${step.title} has external link`);
    }
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { archetypes } from '../data/results.ts';
import { questions } from '../data/questions.ts';
import { calculateResult, getExperimentStepKey } from './scoring.ts';
import { buildShareCardData, buildShareText } from './share.ts';
import type { Answers, Question } from './types.ts';

test('builds share text with domain scores and without archetype match percentages', () => {
  const result = calculateResult(questions, archetypes, buildCompleteAnswers(questions));
  const text = buildShareText(result, { personalNote: '我想把这个结果当成一次自我观察。' });

  assert.ok(text.includes(result.primary.archetype.title));
  assert.ok(text.includes('五领域画像'));
  assert.ok(text.includes('也可以来做一次哲学自我理解测试'));
  assert.ok(text.includes('看看你的朋友会走向哪一种思想原型'));
  assert.ok(text.includes('我想把这个结果当成一次自我观察。'));
  assert.ok(!text.includes(`${result.primary.matchScore}`));
  assert.ok(!text.includes('匹配度'));
  assert.ok(!/%/.test(text));
});

test('builds a compact portrait share card payload', () => {
  const result = calculateResult(questions, archetypes, buildCompleteAnswers(questions));
  const card = buildShareCardData(result, { personalNote: '保留一点怀疑，也保留一点行动。' });

  assert.equal(card.title, result.primary.archetype.title);
  assert.equal(card.image, result.primary.archetype.image);
  assert.equal(card.domainScores.length, 5);
  assert.ok(card.profileHighlights.length <= 3);
  assert.ok(card.personalNote?.includes('保留一点怀疑'));
  assert.ok(card.disclaimer.includes('不是科学人格诊断'));
  assert.ok(card.invitation.includes('邀请朋友'));
  assert.ok(card.domainScores.some((item) => item.kind === 'axis' && typeof item.value === 'number'));
  assert.ok(card.domainScores.some((item) => item.kind === 'tradition' && item.entries.length >= 2));
  assert.equal(Object.hasOwn(card, 'matchScore'), false);
});

function buildCompleteAnswers(items: Question[]): Answers {
  const answers: Answers = {};

  for (const question of items) {
    if (question.kind === 'experiment') {
      for (const step of question.steps) {
        answers[getExperimentStepKey(step)] = step.options[0].id;
      }
    } else if (question.scoring.mode === 'axis') {
      answers[question.id] = 3;
    } else {
      answers[question.id] = question.options.map((option) => option.id);
    }
  }

  return answers;
}

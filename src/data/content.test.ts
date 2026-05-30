import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { questions } from './questions.ts';
import { archetypes } from './results.ts';
import { axisDimensionKeys, dimensionDefinitions, dimensionKeys, traditionDimensionKeys } from '../lib/scoring.ts';
import type { CalibrationQuestion, ThoughtExperimentQuestion, TraditionKey } from '../lib/types.ts';

const illustrationDir = join(process.cwd(), 'public', 'illustrations');

const experiments = questions.filter((question): question is ThoughtExperimentQuestion => question.kind === 'experiment');
const calibrationQuestions = questions.filter((question): question is CalibrationQuestion => question.kind === 'calibration');

const expectedExperimentTitles = [
  '匿名爆料的社团风波',
  '旧工厂改成社区中心',
  'AI 复原逝者声音',
  '洪水后的资源分配',
];

const globalExperimentSceneKeywords = ['社团', '爆料', '旧工厂', '社区中心', 'AI', '逝者', '洪水', '物资'];

const forbiddenVisibleTerms = [
  '认识论',
  '本体论',
  '伦理学',
  '政治/社会哲学',
  '人生/意义哲学',
  '经验校验',
  '理性建构',
  '自我生成',
  '目的秩序',
  '自然主义',
  '观念论',
  '义务论',
  '目的论',
  '自由主义',
  '意识视域',
  '生成关系',
  '实质平等',
  '德性方向',
];

test('ships four cross-domain thought experiments with calibration checks', () => {
  assert.equal(experiments.length, 4);
  assert.equal(calibrationQuestions.length, 10);
  assert.equal(questions.length, 14);
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length);
  assert.deepEqual(experiments.map((experiment) => experiment.title), expectedExperimentTitles);

  for (const dimension of dimensionKeys) {
    assert.equal(
      calibrationQuestions.filter((question) => question.dimension === dimension).length,
      2,
      `${dimension} calibration count`,
    );
  }
});

test('defines five costed cross-domain steps in each thought experiment', () => {
  const stepIds = new Set<string>();
  const stepCountsByDimension = Object.fromEntries(dimensionKeys.map((dimension) => [dimension, 0]));

  for (const experiment of experiments) {
    assert.ok(experiment.title.length >= 4, experiment.id);
    assert.ok(experiment.setup.length >= 40, experiment.id);
    assert.equal(experiment.steps.length, 5, experiment.id);
    assert.deepEqual(
      new Set(experiment.steps.map((step) => step.dimension)),
      new Set(dimensionKeys),
      `${experiment.id} dimension coverage`,
    );

    for (const step of experiment.steps) {
      assert.ok(!stepIds.has(step.id), step.id);
      stepIds.add(step.id);
      stepCountsByDimension[step.dimension] += 1;
      assert.ok(step.prompt.length >= 20, step.id);
      assert.ok(step.options.length >= 2, step.id);

      const definition = dimensionDefinitions[step.dimension];
      for (const option of step.options) {
        assert.ok(option.label.length >= 2, `${step.id}/${option.id}`);
        assert.ok(option.benefit.length >= 10, `${step.id}/${option.id}/benefit`);
        assert.ok(option.cost.length >= 10, `${step.id}/${option.id}/cost`);
        assert.equal(option.scoring.mode, definition.mode, `${step.id}/${option.id}`);
      }
    }
  }

  assert.equal(stepIds.size, 20);
  assert.deepEqual(stepCountsByDimension, {
    epistemology: 4,
    ontology: 4,
    ethics: 4,
    politics: 4,
    meaning: 4,
  });
});

test('covers axis endpoints and balances multi-tradition experiment options', () => {
  for (const dimension of axisDimensionKeys) {
    const calibrationPairs = calibrationQuestions.filter(
      (question) => question.dimension === dimension && question.scoring.mode === 'axis',
    );

    assert.equal(calibrationPairs.length, 2, dimension);
    for (const question of calibrationPairs) {
      assert.equal(question.scoring.leftPole, 'left', question.id);
      assert.equal(question.scoring.rightPole, 'right', question.id);
    }

    const steps = experiments.flatMap((experiment) => experiment.steps).filter((step) => step.dimension === dimension);
    assert.equal(steps.length, 4, dimension);
    for (const step of steps) {
      const poles = step.options.filter((option) => option.scoring.mode === 'axis').map((option) => option.scoring.pole);
      assert.ok(poles.includes('left'), `${step.id} left option`);
      assert.ok(poles.includes('right'), `${step.id} right option`);
    }
  }

  for (const dimension of traditionDimensionKeys) {
    const definition = dimensionDefinitions[dimension];
    assert.equal(definition.mode, 'tradition');
    const expected = new Set(definition.traditions.map((tradition) => tradition.key));
    const experimentCounts = new Map<TraditionKey, number>();

    for (const question of calibrationQuestions.filter((item) => item.dimension === dimension)) {
      assert.equal(question.scoring.mode, 'tradition-ranking', question.id);
      assert.equal(question.options.length, 4, question.id);
      assert.deepEqual(new Set(question.options.map((option) => option.tradition)), expected, question.id);
    }

    for (const step of experiments.flatMap((experiment) => experiment.steps).filter((item) => item.dimension === dimension)) {
      for (const option of step.options) {
        assert.equal(option.scoring.mode, 'tradition', `${step.id}/${option.id}`);
        experimentCounts.set(option.scoring.tradition, (experimentCounts.get(option.scoring.tradition) ?? 0) + 1);
      }
    }

    for (const tradition of expected) {
      assert.equal(experimentCounts.get(tradition), 4, `${dimension}/${tradition} experiment balance`);
    }
  }
});

test('keeps calibration questions low-cue, sortable where needed, and separate from experiment scenes', () => {
  for (const question of calibrationQuestions) {
    assert.ok(question.prompt.length >= 16, question.id);
    const visibleText =
      question.scoring.mode === 'axis'
        ? [question.prompt, question.context ?? '', question.leftLabel, question.rightLabel].join(' ')
        : [
            question.prompt,
            question.context ?? '',
            ...question.options.flatMap((option) => [option.label, option.description]),
          ].join(' ');

    if (question.scoring.mode === 'axis') {
      assert.ok(question.leftLabel.length >= 6, question.id);
      assert.ok(question.rightLabel.length >= 6, question.id);
      assert.notEqual(question.leftLabel, question.rightLabel, question.id);
    } else {
      assert.equal(question.options.length, 4, question.id);
      for (const option of question.options) {
        assert.ok(option.label.length >= 4, `${question.id}/${option.id}`);
        assert.ok(option.description.length >= 8, `${question.id}/${option.id}`);
      }
    }

    for (const cue of forbiddenVisibleTerms) {
      assert.ok(!visibleText.includes(cue), `${question.id} leaks ${cue}`);
    }
    for (const keyword of globalExperimentSceneKeywords) {
      assert.ok(!visibleText.includes(keyword), `${question.id} repeats experiment scene keyword ${keyword}`);
    }
  }
});

test('keeps experiment wording accessible before revealing costs', () => {
  for (const experiment of experiments) {
    const visibleText = [
      experiment.title,
      experiment.setup,
      ...experiment.steps.flatMap((step) => [
        step.prompt,
        ...step.options.flatMap((option) => [option.label, option.benefit, option.cost]),
      ]),
    ].join(' ');

    for (const term of forbiddenVisibleTerms) {
      assert.ok(!visibleText.includes(term), `${experiment.id} uses difficult term ${term}`);
    }

    for (const option of experiment.steps.flatMap((step) => step.options)) {
      assert.ok(!option.benefit.includes('代价'), `${option.id} benefit leaks cost language`);
      assert.ok(option.cost.includes('但') || option.cost.includes('可能') || option.cost.includes('会'), `${option.id} cost lacks tradeoff`);
    }
  }
});

test('defines complete hand-written archetypes for the five-domain model', () => {
  assert.ok(archetypes.length >= 14);
  assert.ok(archetypes.length <= 16);
  assert.equal(new Set(archetypes.map((archetype) => archetype.id)).size, archetypes.length);

  for (const archetype of archetypes) {
    assert.ok(archetype.title);
    assert.ok(archetype.englishTitle);
    assert.ok(archetype.summary);
    assert.ok(archetype.academicNote);
    assert.ok(archetype.pathNote);
    assert.ok(archetype.spectrumLabels.length >= 3);
    assert.equal(archetype.philosophers.length, 3);
    assert.ok(archetype.schools.length >= 2);
    assert.ok(existsSync(join(process.cwd(), 'public', archetype.image)), archetype.image);

    for (const dimension of axisDimensionKeys) {
      assert.ok(archetype.axisSignature[dimension], `${archetype.id}/${dimension}`);
    }
    for (const dimension of traditionDimensionKeys) {
      assert.ok(archetype.traditionSignature[dimension].length >= 1, `${archetype.id}/${dimension}`);
    }
  }
});

test('keeps only final referenced illustrations in the public result set', () => {
  const draftFiles = readdirSync(illustrationDir).filter((file) => file.startsWith('prototype-'));
  assert.deepEqual(draftFiles, []);
});

test('presents match strength without raw match percentages in the result UI source', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'main.tsx'), 'utf8');
  assert.ok(source.includes('贴近程度：'));
  assert.ok(source.includes('相邻叙事'));
  assert.ok(source.includes('这不是考试分数'));
  assert.ok(!/匹配度\s*\{/.test(source));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProfileHighlights,
  calculateResult,
  classifyMatchStrength,
  getExperimentStepKey,
  scoreAxisCalibrationAnswer,
  scoreAxisChoice,
  scoreRankingCalibrationAnswer,
  shuffleQuestions,
} from './scoring.ts';
import { questions } from '../data/questions.ts';
import { archetypes } from '../data/results.ts';
import type {
  Answers,
  Archetype,
  AxisDimensionKey,
  AxisSignature,
  CalibrationQuestion,
  Question,
  ThoughtExperimentQuestion,
  TraditionDimensionKey,
  TraditionKey,
  TraditionSignature,
} from './types.ts';

const traditionKeysByDimensionForTests: Record<TraditionDimensionKey, TraditionKey[]> = {
  ontology: ['nature', 'idea', 'essence', 'process'],
  ethics: ['consequence', 'principle', 'virtue', 'care'],
  politics: ['liberty', 'republic', 'community', 'equality'],
};

test('scores axis calibration as a five-point orientation', () => {
  assert.equal(scoreAxisCalibrationAnswer(1, { mode: 'axis', leftPole: 'left', rightPole: 'right' }), 0);
  assert.equal(scoreAxisCalibrationAnswer(3, { mode: 'axis', leftPole: 'left', rightPole: 'right' }), 50);
  assert.equal(scoreAxisCalibrationAnswer(5, { mode: 'axis', leftPole: 'left', rightPole: 'right' }), 100);
});

test('scores ranking calibration with descending priority weights', () => {
  assert.deepEqual(scoreRankingCalibrationAnswer(['nature', 'idea', 'essence', 'process']), {
    nature: 4,
    idea: 3,
    essence: 2,
    process: 1,
  });
});

test('classifies match strength without treating distance scores as exam grades', () => {
  assert.deepEqual(classifyMatchStrength(82, 76), {
    level: 'clear',
    label: '清晰接近',
    description: '这个原型很能解释你的选择路径。',
  });
  assert.equal(classifyMatchStrength(82, 78).level, 'leaning');
  assert.equal(classifyMatchStrength(58, 20).level, 'light');
  assert.equal(classifyMatchStrength(49, 20).level, 'mixed');
  assert.equal(classifyMatchStrength(70, 68).level, 'mixed');
});

test('builds readable five-domain profile highlights', () => {
  const highlights = buildProfileHighlights(
    { epistemology: 30, meaning: 55 },
    {
      ontology: { nature: 52, process: 44, idea: 3, essence: 1 },
      ethics: { care: 62, principle: 20, consequence: 12, virtue: 6 },
      politics: { community: 35, republic: 31, equality: 22, liberty: 12 },
    },
  );

  assert.equal(highlights.length, 5);
  assert.deepEqual(highlights.map((item) => item.dimension), ['epistemology', 'meaning', 'ontology', 'ethics', 'politics']);
  assert.equal(highlights[0].label, '认识方式：更靠近可复查的证据');
  assert.equal(highlights[0].strength, 'leaning');
  assert.equal(highlights[1].label, '人生方向：在自我生成与稳定秩序之间校准');
  assert.equal(highlights[1].strength, 'balanced');
  assert.equal(highlights[2].label, '真实理解：自然/物质 × 过程/关系');
  assert.equal(highlights[2].strength, 'mixed');
  assert.equal(highlights[3].label, '责任判断：主要靠近关怀');
  assert.equal(highlights[3].strength, 'focused');
});

test('scores axis experiment choices as endpoint commitments', () => {
  assert.equal(scoreAxisChoice('left'), 0);
  assert.equal(scoreAxisChoice('right'), 100);
});

test('combines step-level thought experiment dimensions and calibration at 80/20 weight', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'mixed-exp',
      kind: 'experiment',
      title: 'Mixed room',
      setup: 'A long enough setup for a mixed-domain thought experiment.',
      steps: [
        axisStep('e-step-1', 'epistemology'),
        axisStep('e-step-2', 'epistemology'),
        axisStep('e-step-3', 'epistemology'),
        axisStep('e-step-4', 'epistemology'),
        traditionStep('o-step-1', 'ontology'),
        traditionStep('o-step-2', 'ontology'),
        traditionStep('o-step-3', 'ontology'),
        traditionStep('o-step-4', 'ontology'),
      ],
    },
    {
      id: 'ep-calibration',
      kind: 'calibration',
      dimension: 'epistemology',
      prompt: 'choose a habit',
      leftLabel: 'track records first',
      rightLabel: 'build concepts first',
      scoring: { mode: 'axis', leftPole: 'left', rightPole: 'right' },
    },
    {
      id: 'on-calibration-a',
      kind: 'calibration',
      dimension: 'ontology',
      prompt: 'first pair',
      options: rankingOptions('ontology-a'),
      scoring: { mode: 'tradition-ranking' },
    },
    {
      id: 'on-calibration-b',
      kind: 'calibration',
      dimension: 'ontology',
      prompt: 'second pair',
      options: rankingOptions('ontology-b'),
      scoring: { mode: 'tradition-ranking' },
    },
  ];

  const result = calculateResult(sampleQuestions, archetypes, {
    'e-step-1': 'right',
    'e-step-2': 'right',
    'e-step-3': 'right',
    'e-step-4': 'left',
    'ep-calibration': 5,
    'o-step-1': 'nature',
    'o-step-2': 'nature',
    'o-step-3': 'process',
    'o-step-4': 'process',
    'on-calibration-a': ['nature', 'process', 'idea', 'essence'],
    'on-calibration-b': ['process', 'nature', 'idea', 'essence'],
  });

  assert.equal(result.axisScores.epistemology, 80);
  assert.equal(result.axisScores.meaning, 50);
  assert.deepEqual(result.traditionScores.ontology, { nature: 47, idea: 4, essence: 2, process: 47 });
  assert.ok(result.primary.matchStrength);
  assert.equal(result.profileHighlights.length, 5);
  assert.equal(result.resultMode === 'archetype-led' || result.resultMode === 'profile-led', true);
});

test('rejects incomplete scored answers', () => {
  const experiment = questions.find((question): question is ThoughtExperimentQuestion => question.kind === 'experiment')!;
  const calibration = questions.find((question): question is CalibrationQuestion => question.kind === 'calibration')!;
  const rankingCalibration = questions.find(
    (question): question is CalibrationQuestion => question.kind === 'calibration' && question.scoring.mode === 'tradition-ranking',
  )!;

  assert.throws(() => calculateResult([experiment], archetypes, {}), /未完成/);
  assert.throws(() => calculateResult([calibration], archetypes, {}), /未完成/);
  assert.throws(() => calculateResult([rankingCalibration], archetypes, { [rankingCalibration.id]: ['nature'] }), /未完成/);
});

test('matches each hand-written archetype from an anchored answer path', () => {
  for (const archetype of archetypes) {
    const answers = buildAnchoredAnswers(archetype);
    const result = calculateResult(questions, archetypes, answers);
    assert.equal(result.primary.archetype.id, archetype.id, archetype.id);
  }
});

test('keeps representative philosophical judgment paths distinct', () => {
  const samples: Array<{
    name: string;
    expected: string;
    profile: { axisSignature: AxisSignature; traditionSignature: TraditionSignature };
    forbidden?: string[];
  }> = [
    {
      name: 'rule-utilitarian pragmatist',
      expected: 'consequence-mender',
      forbidden: ['rational-configurer', 'idea-builder'],
      profile: {
        axisSignature: { epistemology: 'left', meaning: 'left' },
        traditionSignature: { ontology: ['process'], ethics: ['consequence'], politics: ['republic'] },
      },
    },
    {
      name: 'kantian public principle',
      expected: 'rational-configurer',
      profile: {
        axisSignature: { epistemology: 'right', meaning: 'right' },
        traditionSignature: { ontology: ['idea'], ethics: ['principle'], politics: ['republic'] },
      },
    },
    {
      name: 'care ethics in public coordination',
      expected: 'care-coordinator',
      profile: {
        axisSignature: { epistemology: 'left', meaning: 'right' },
        traditionSignature: { ontology: ['process'], ethics: ['care'], politics: ['republic'] },
      },
    },
    {
      name: 'community inheritance',
      expected: 'community-inheritor',
      profile: {
        axisSignature: { epistemology: 'left', meaning: 'right' },
        traditionSignature: { ontology: ['process'], ethics: ['virtue'], politics: ['community'] },
      },
    },
    {
      name: 'equality critique',
      expected: 'equality-revaluator',
      profile: {
        axisSignature: { epistemology: 'left', meaning: 'left' },
        traditionSignature: { ontology: ['process'], ethics: ['care'], politics: ['equality'] },
      },
    },
    {
      name: 'existential absurd clarity',
      expected: 'absurd-clear-sighted',
      profile: {
        axisSignature: { epistemology: 'left', meaning: 'left' },
        traditionSignature: { ontology: ['idea'], ethics: ['principle'], politics: ['liberty'] },
      },
    },
  ];

  for (const sample of samples) {
    const result = calculateResult(questions, archetypes, buildIdealizedAnswers(sample.profile));
    assert.equal(result.primary.archetype.id, sample.expected, sample.name);
    for (const forbidden of sample.forbidden ?? []) {
      assert.notEqual(result.primary.archetype.id, forbidden, `${sample.name} should not collapse into ${forbidden}`);
    }
  }
});

test('idealized internal profiles reach all archetypes without extreme concentration', () => {
  const counts = new Map<string, number>();
  const profiles = enumerateIdealizedProfiles();

  for (const profile of profiles) {
    const result = calculateResult(questions, archetypes, buildIdealizedAnswers(profile));
    counts.set(result.primary.archetype.id, (counts.get(result.primary.archetype.id) ?? 0) + 1);
  }

  for (const archetype of archetypes) {
    assert.ok((counts.get(archetype.id) ?? 0) > 0, `${archetype.id} unreachable in internal simulation`);
  }

  const maxCount = Math.max(...counts.values());
  assert.ok(maxCount <= Math.ceil(profiles.length * 0.2), `one archetype captures too many simulated profiles: ${maxCount}/${profiles.length}`);
});

test('records thought experiment path summaries with step dimensions', () => {
  const experiment = questions.find((question): question is ThoughtExperimentQuestion => question.kind === 'experiment')!;
  const answers: Answers = {};
  for (const step of experiment.steps) {
    answers[getExperimentStepKey(step)] = step.options[0].id;
  }

  const result = calculateResult([experiment], archetypes, answers);
  assert.equal(result.experimentPath.length, 5);
  assert.equal(result.experimentPath[0].experimentTitle, experiment.title);
  assert.ok(result.experimentPath[0].dimension);
  assert.ok(result.experimentPath[0].focusLabel);
  assert.ok(result.experimentPath[0].choiceLabel);
  assert.ok(result.experimentPath[0].benefit);
  assert.ok(result.experimentPath[0].cost);
});

test('shuffles questions predictably without mutating the original list', () => {
  const sampleQuestions: Question[] = [
    {
      id: 'a',
      kind: 'calibration',
      dimension: 'epistemology',
      prompt: 'a',
      leftLabel: 'left',
      rightLabel: 'right',
      scoring: { mode: 'axis', leftPole: 'left', rightPole: 'right' },
    },
    {
      id: 'b',
      kind: 'calibration',
      dimension: 'epistemology',
      prompt: 'b',
      leftLabel: 'left',
      rightLabel: 'right',
      scoring: { mode: 'axis', leftPole: 'left', rightPole: 'right' },
    },
    {
      id: 'c',
      kind: 'calibration',
      dimension: 'meaning',
      prompt: 'c',
      leftLabel: 'left',
      rightLabel: 'right',
      scoring: { mode: 'axis', leftPole: 'left', rightPole: 'right' },
    },
    {
      id: 'd',
      kind: 'calibration',
      dimension: 'meaning',
      prompt: 'd',
      leftLabel: 'left',
      rightLabel: 'right',
      scoring: { mode: 'axis', leftPole: 'left', rightPole: 'right' },
    },
  ];
  const randomValues = [0.7, 0.2, 0.9];
  const shuffled = shuffleQuestions(sampleQuestions, () => randomValues.shift() ?? 0.5);

  assert.deepEqual(shuffled.map((question) => question.id), ['d', 'b', 'a', 'c']);
  assert.deepEqual(sampleQuestions.map((question) => question.id), ['a', 'b', 'c', 'd']);
});

function axisStep(id: string, dimension: AxisDimensionKey) {
  return {
    id,
    dimension,
    prompt: 'choose',
    options: [
      { id: 'left', label: 'left', benefit: 'checkable ground first', cost: 'but the larger shape may form slowly', scoring: { mode: 'axis', pole: 'left' as const } },
      { id: 'right', label: 'right', benefit: 'make the whole account coherent', cost: 'but it may drift away from rough details', scoring: { mode: 'axis', pole: 'right' as const } },
    ],
  };
}

function traditionStep(id: string, dimension: TraditionDimensionKey) {
  return {
    id,
    dimension,
    prompt: 'choose',
    options: [
      { id: 'nature', label: 'nature', benefit: 'keep the material facts visible', cost: 'but memory and meaning may feel lighter', scoring: { mode: 'tradition', tradition: 'nature' as const } },
      { id: 'process', label: 'process', benefit: 'keep the living process visible', cost: 'but the boundary becomes harder to draw', scoring: { mode: 'tradition', tradition: 'process' as const } },
    ],
  };
}

function buildAnchoredAnswers(archetype: Archetype): Answers {
  return buildIdealizedAnswers({
    axisSignature: archetype.axisSignature,
    traditionSignature: archetype.traditionSignature,
  });
}

function buildIdealizedAnswers(profile: { axisSignature: AxisSignature; traditionSignature: TraditionSignature }): Answers {
  const answers: Answers = {};

  for (const question of questions) {
    if (question.kind === 'calibration') {
      if (question.scoring.mode === 'axis') {
        const target = profile.axisSignature[question.dimension as AxisDimensionKey];
        answers[question.id] = target === question.scoring.leftPole ? 1 : 5;
      } else {
        const target = profile.traditionSignature[question.dimension as TraditionDimensionKey];
        answers[question.id] = [
          ...question.options.filter((option) => target.includes(option.tradition)).map((option) => option.id),
          ...question.options.filter((option) => !target.includes(option.tradition)).map((option) => option.id),
        ];
      }
    }

    if (question.kind === 'experiment') {
      for (const step of question.steps) {
        const selected =
          step.options.find((option) => {
            if (option.scoring.mode === 'axis') {
              return option.scoring.pole === profile.axisSignature[step.dimension as AxisDimensionKey];
            }
            return profile.traditionSignature[step.dimension as TraditionDimensionKey].includes(option.scoring.tradition);
          }) ?? step.options[0];

        answers[getExperimentStepKey(step)] = selected.id;
      }
    }
  }

  return answers;
}

function enumerateIdealizedProfiles() {
  const profiles: { axisSignature: AxisSignature; traditionSignature: TraditionSignature }[] = [];
  const poles: AxisSignature[] = [
    { epistemology: 'left', meaning: 'left' },
    { epistemology: 'left', meaning: 'right' },
    { epistemology: 'right', meaning: 'left' },
    { epistemology: 'right', meaning: 'right' },
  ];

  for (const axisSignature of poles) {
    for (const ontology of traditionKeysByDimensionForTests.ontology) {
      for (const ethics of traditionKeysByDimensionForTests.ethics) {
        for (const politics of traditionKeysByDimensionForTests.politics) {
          profiles.push({
            axisSignature,
            traditionSignature: {
              ontology: [ontology],
              ethics: [ethics],
              politics: [politics],
            },
          });
        }
      }
    }
  }

  return profiles;
}

function rankingOptions(prefix: string) {
  return [
    { id: 'nature', label: `${prefix} nature`, description: 'material ground', tradition: 'nature' as const },
    { id: 'idea', label: `${prefix} idea`, description: 'felt meaning', tradition: 'idea' as const },
    { id: 'essence', label: `${prefix} essence`, description: 'stable form', tradition: 'essence' as const },
    { id: 'process', label: `${prefix} process`, description: 'living process', tradition: 'process' as const },
  ];
}

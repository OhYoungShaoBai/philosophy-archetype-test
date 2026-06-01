import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { questions } from './questions.ts';
import { archetypes } from './results.ts';
import { philosopherCards, readingCards, schoolCards } from './knowledge.ts';
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
  assert.equal(archetypes.length, 15);
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

test('uses unique v0.3 archetype-specific illustrations', () => {
  const imagePaths = archetypes.map((archetype) => archetype.image);
  const imageFiles = readdirSync(illustrationDir).filter((file) => file.endsWith('.png'));
  const archetypeImageFiles = readdirSync(join(illustrationDir, 'archetypes')).filter((file) => file.endsWith('.png'));

  assert.equal(new Set(imagePaths).size, archetypes.length);
  assert.equal(archetypeImageFiles.length, 15);
  for (const archetype of archetypes) {
    assert.ok(archetype.image.startsWith('/illustrations/archetypes/'), archetype.id);
    assert.ok(existsSync(join(process.cwd(), 'public', archetype.image)), archetype.image);
  }
  for (const file of imageFiles) {
    assert.ok(!imagePaths.includes(`/illustrations/${file}`), file);
  }
});

test('defines internal encyclopedia content for every archetype', () => {
  for (const archetype of archetypes) {
    assert.ok(archetype.encyclopedia, `${archetype.id} missing encyclopedia`);
    assert.ok(archetype.encyclopedia.deepDive.length >= 2, `${archetype.id} deep dive`);
    assert.ok(archetype.encyclopedia.deepDive.every((paragraph) => paragraph.length >= 36), `${archetype.id} deep dive length`);
    assert.ok(archetype.encyclopedia.practicePrompt.length >= 16, `${archetype.id} practice prompt`);
    assert.ok(archetype.encyclopedia.portrait, `${archetype.id} missing portrait`);
    assert.ok(archetype.encyclopedia.philosopherIds.length >= 3, `${archetype.id} philosophers`);
    assert.ok(archetype.encyclopedia.schoolIds.length >= 2, `${archetype.id} schools`);
    assert.ok(archetype.encyclopedia.readingIds.length >= 3, `${archetype.id} readings`);

    const portrait = archetype.encyclopedia.portrait;
    const portraitEntries = [
      portrait.coreDrive,
      portrait.decisionStyle,
      portrait.actionStyle,
      portrait.relationshipPattern,
      portrait.underPressure,
      portrait.misreadAs,
      portrait.growthEdge,
    ];
    assert.ok(portraitEntries.every((entry) => entry.length >= 20), `${archetype.id} portrait depth`);
    assert.ok(portraitEntries.every((entry) => !entry.includes('http')), `${archetype.id} portrait external link`);
    const portraitText = portraitEntries.join(' ');
    for (const philosopher of Object.values(philosopherCards)) {
      assert.ok(!portraitText.includes(philosopher.name), `${archetype.id} portrait leans on philosopher ${philosopher.name}`);
    }

    for (const philosopherId of archetype.encyclopedia.philosopherIds) {
      assert.ok(philosopherCards[philosopherId], `${archetype.id} references missing philosopher ${philosopherId}`);
    }
    for (const schoolId of archetype.encyclopedia.schoolIds) {
      assert.ok(schoolCards[schoolId], `${archetype.id} references missing school ${schoolId}`);
    }
    for (const readingId of archetype.encyclopedia.readingIds) {
      assert.ok(readingCards[readingId], `${archetype.id} references missing reading ${readingId}`);
    }
  }
});

test('question wording separates philosophical reasons instead of rewarding generic good answers', () => {
  const experimentOptions = experiments.flatMap((experiment) => experiment.steps.flatMap((step) => step.options));
  const rankingOptions = calibrationQuestions.flatMap((question) => (question.scoring.mode === 'tradition-ranking' ? question.options : []));
  const allOptionText = [...experimentOptions, ...rankingOptions]
    .map((option) => ('benefit' in option ? [option.label, option.benefit, option.cost] : [option.label, option.description]).join(' '))
    .join('\n');

  assert.ok(/长期|可预期|减少伤害|改善/.test(allOptionText), 'consequence wording should include long-run repair language');
  assert.ok(/不能|底线|边界|权利/.test(allOptionText), 'principle wording should include non-exchangeable boundary language');
  assert.ok(/共同修正|公开参与|不被任意|共同讨论/.test(allOptionText), 'republic wording should include public participation language');
  assert.ok(/命名|解释框架|被赋予|如何理解/.test(allOptionText), 'idea wording should focus on interpretation, not mere popularity');

  const ambiguousIdeaPhrases = ['心里认', '心里还怎样记着', '听众是否还认', '大家心里认'];
  for (const phrase of ambiguousIdeaPhrases) {
    assert.ok(!allOptionText.includes(phrase), `ambiguous idea wording remains: ${phrase}`);
  }
});

test('diversifies ontology questions beyond same-object continuity puzzles', () => {
  const ontologySteps = experiments.flatMap((experiment) => experiment.steps).filter((step) => step.dimension === 'ontology');
  const ontologyCalibrations = calibrationQuestions.filter((question) => question.dimension === 'ontology');
  const ontologyText = [
    ...ontologySteps.flatMap((step) => [
      step.prompt,
      ...step.options.flatMap((option) => [option.label, option.benefit, option.cost]),
    ]),
    ...ontologyCalibrations.flatMap((question) =>
      question.scoring.mode === 'tradition-ranking'
        ? [question.prompt, question.context ?? '', ...question.options.flatMap((option) => [option.label, option.description])]
        : [question.prompt, question.context ?? '', question.leftLabel, question.rightLabel],
    ),
  ].join(' ');
  const directContinuityMatches = ontologyText.match(/还是不是|还算不算|是否还是|原来的|同一/g) ?? [];

  assert.ok(directContinuityMatches.length <= 4, `too many direct continuity cues: ${directContinuityMatches.join(', ')}`);
  assert.match(ontologyText, /材料|旧物|声音文件|零件/, 'ontology should include material composition questions');
  assert.match(ontologyText, /功能|作用|用途|承担/, 'ontology should include function or role questions');
  assert.match(ontologyText, /解释|命名|象征|讲述/, 'ontology should include interpretation and naming questions');
  assert.match(ontologyText, /关系|使用|一起生活|运转|实践/, 'ontology should include relational or practical continuity questions');
  assert.match(ontologyText, /授权|意愿|本人|发声/, 'ontology should include personhood or agency boundary questions');
});

test('covers varied classic problem families across all five domains', () => {
  const textByDimension = Object.fromEntries(
    dimensionKeys.map((dimension) => {
      const experimentText = experiments
        .flatMap((experiment) => experiment.steps)
        .filter((step) => step.dimension === dimension)
        .flatMap((step) => [step.prompt, ...step.options.flatMap((option) => [option.label, option.benefit, option.cost])]);
      const calibrationText = calibrationQuestions
        .filter((question) => question.dimension === dimension)
        .flatMap((question) =>
          question.scoring.mode === 'axis'
            ? [question.prompt, question.context ?? '', question.leftLabel, question.rightLabel]
            : [question.prompt, question.context ?? '', ...question.options.flatMap((option) => [option.label, option.description])],
        );

      return [dimension, [...experimentText, ...calibrationText].join(' ')];
    }),
  ) as Record<string, string>;

  const expectedFamilies: Record<string, RegExp[]> = {
    epistemology: [/来源|复查|依据/, /解释|理由|自洽|连贯/, /预测|推测|模型|走势/, /盲听|错误率|反馈|样本/],
    ontology: [/材料|零件|旧物|声音文件/, /功能|作用|用途|承担/, /解释|命名|象征|讲述/, /关系|使用|一起生活|实践/],
    ethics: [/伤害|损害|风险|改善/, /权利|授权|底线|资格/, /品格|正直|庄重|体面/, /脆弱|照看|照护|托住/],
    politics: [/退出|选择空间|私人生活|弹性/, /公开参与|共同修正|申诉|讨论/, /熟悉|共同记忆|生活关系|习惯/, /排除|挤压|脆弱|占便宜/],
    meaning: [/想不想|节奏|今天能做|方向/, /承诺|责任|长期|积累/, /哀悼|告别|继续生活|失望/, /重新开始|崩溃|迷茫|没有.*保证/],
  };

  for (const [dimension, patterns] of Object.entries(expectedFamilies)) {
    for (const pattern of patterns) {
      assert.match(textByDimension[dimension], pattern, `${dimension} misses ${pattern}`);
    }
  }
});

test('keeps internal knowledge cards concise and self-contained', () => {
  for (const card of Object.values(philosopherCards)) {
    assert.ok(card.name.length >= 2);
    assert.ok(card.summary.length >= 24);
    assert.ok(card.whyItMatters.length >= 28);
    assert.ok(!card.summary.includes('http'));
    assert.ok(!card.whyItMatters.includes('http'));
  }

  for (const card of Object.values(schoolCards)) {
    assert.ok(card.name.length >= 2);
    assert.ok(card.summary.length >= 18);
    assert.ok(card.resultHint.length >= 10);
    assert.ok(!card.summary.includes('http'));
    assert.ok(!card.resultHint.includes('http'));
  }

  for (const card of Object.values(readingCards)) {
    assert.ok(card.title.length >= 2);
    assert.ok(card.author.length >= 2);
    assert.ok(card.whyRead.length >= 16);
    assert.ok(!card.whyRead.includes('http'));
  }
});

test('presents match strength without raw match percentages in the result UI source', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'main.tsx'), 'utf8');
  assert.ok(source.includes('贴近程度：'));
  assert.ok(source.includes('相邻叙事'));
  assert.ok(source.includes('这不是考试分数'));
  assert.ok(!/匹配度\s*\{/.test(source));
});

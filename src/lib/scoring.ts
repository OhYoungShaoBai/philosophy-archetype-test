import type {
  Answers,
  Archetype,
  AxisCalibrationSignal,
  AxisCalibrationQuestion,
  AxisDimensionKey,
  AxisPole,
  AxisScores,
  CalibrationScoringSignal,
  DimensionDefinition,
  DimensionKey,
  ExperimentStep,
  LikertValue,
  MatchStrength,
  ProfileHighlight,
  ProfileHighlightStrength,
  Question,
  ScoredArchetype,
  TestResult,
  TraditionDimensionKey,
  TraditionDistribution,
  TraditionCalibrationQuestion,
  TraditionKey,
  TraditionScores,
} from './types';

const EXPERIMENT_WEIGHT = 0.8;
const CALIBRATION_WEIGHT = 0.2;

export const axisDimensionKeys: AxisDimensionKey[] = ['epistemology', 'meaning'];

export const traditionDimensionKeys: TraditionDimensionKey[] = ['ontology', 'ethics', 'politics'];

export const dimensionKeys: DimensionKey[] = ['epistemology', 'ontology', 'ethics', 'politics', 'meaning'];

export const traditionKeysByDimension: Record<TraditionDimensionKey, TraditionKey[]> = {
  ontology: ['nature', 'idea', 'essence', 'process'],
  ethics: ['consequence', 'principle', 'virtue', 'care'],
  politics: ['liberty', 'republic', 'community', 'equality'],
};

export const dimensionDefinitions: Record<DimensionKey, DimensionDefinition> = {
  epistemology: {
    key: 'epistemology',
    name: '认识论',
    mode: 'axis',
    leftLabel: '经验校验',
    rightLabel: '理性建构',
    leftTraditions: ['经验主义', '怀疑主义', '实证精神'],
    rightTraditions: ['理性主义', '观念论', '批判哲学'],
    resultHint: '你如何判断一个说法是否可靠。',
  },
  ontology: {
    key: 'ontology',
    name: '本体论',
    mode: 'tradition',
    resultHint: '你更习惯怎样解释“什么是真实存在”。',
    traditions: [
      { key: 'nature', label: '自然/物质', traditions: ['自然主义', '物质论', '斯宾诺莎式整体观'] },
      { key: 'idea', label: '观念/意识', traditions: ['观念论', '现象学', '诠释学'] },
      { key: 'essence', label: '本质/目的', traditions: ['实体论', '目的论', '亚里士多德传统'] },
      { key: 'process', label: '过程/关系', traditions: ['过程哲学', '关系本体论', '道家/缘起传统'] },
    ],
  },
  ethics: {
    key: 'ethics',
    name: '伦理学',
    mode: 'tradition',
    resultHint: '你在道德取舍中优先保护什么。',
    traditions: [
      { key: 'consequence', label: '后果', traditions: ['后果主义', '功利主义', '实用主义'] },
      { key: 'principle', label: '原则', traditions: ['义务论', '权利论', '契约论'] },
      { key: 'virtue', label: '德性', traditions: ['德性伦理', '儒家修身', '古典伦理'] },
      { key: 'care', label: '关怀', traditions: ['关怀伦理', '责任伦理', '女性主义伦理'] },
    ],
  },
  politics: {
    key: 'politics',
    name: '政治/社会哲学',
    mode: 'tradition',
    resultHint: '你如何理解个人与公共生活的关系。',
    traditions: [
      { key: 'liberty', label: '自由', traditions: ['自由主义', '个人主义', '存在主义政治面向'] },
      { key: 'republic', label: '共和', traditions: ['共和主义', '公共理性', '公民参与传统'] },
      { key: 'community', label: '共同体', traditions: ['社群主义', '礼治传统', '共同善'] },
      { key: 'equality', label: '平等/批判', traditions: ['平等主义', '批判理论', '解放传统'] },
    ],
  },
  meaning: {
    key: 'meaning',
    name: '人生/意义哲学',
    mode: 'axis',
    leftLabel: '自我生成',
    rightLabel: '目的秩序',
    leftTraditions: ['存在主义', '荒诞主义', '道家逍遥传统'],
    rightTraditions: ['目的论', '德性伦理', '儒家修身传统'],
    resultHint: '你如何理解人生方向从哪里来。',
  },
};

export const calibrationScale: { value: LikertValue; label: string }[] = [
  { value: 1, label: '明显接近前者' },
  { value: 2, label: '略接近前者' },
  { value: 3, label: '两边都能理解' },
  { value: 4, label: '略接近后者' },
  { value: 5, label: '明显接近后者' },
];

export const experimentFocusLabels: Record<DimensionKey, string> = {
  epistemology: '事实怎么判断',
  ontology: '它到底算什么',
  ethics: '怎样对人负责',
  politics: '共同规则怎么定',
  meaning: '这件事如何安放进人生',
};

const emptyAxisScores = (value = 50): AxisScores => ({
  epistemology: value,
  meaning: value,
});

const emptyTraditionScores = (value = 0): TraditionScores => ({
  ontology: { nature: value, idea: value, essence: value, process: value },
  ethics: { consequence: value, principle: value, virtue: value, care: value },
  politics: { liberty: value, republic: value, community: value, equality: value },
});

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const matchStrengthText: Record<MatchStrength['level'], MatchStrength> = {
  clear: {
    level: 'clear',
    label: '清晰接近',
    description: '这个原型很能解释你的选择路径。',
  },
  leaning: {
    level: 'leaning',
    label: '明显偏向',
    description: '主原型成立，但混合成分也重要。',
  },
  light: {
    level: 'light',
    label: '轻度接近',
    description: '这是最近的叙事入口，不是强身份判断。',
  },
  mixed: {
    level: 'mixed',
    label: '混合画像',
    description: '优先阅读五领域画像，而不是把自己归成单一原型。',
  },
};

const axisProfileText: Record<
  AxisDimensionKey,
  {
    left: Pick<ProfileHighlight, 'label' | 'detail'>;
    balanced: Pick<ProfileHighlight, 'label' | 'detail'>;
    right: Pick<ProfileHighlight, 'label' | 'detail'>;
  }
> = {
  epistemology: {
    left: {
      label: '认识方式：更靠近可复查的证据',
      detail: '你会先问谁能核对、材料从哪里来，再决定要不要相信一个说法。',
    },
    balanced: {
      label: '认识方式：在证据与整体解释之间校准',
      detail: '你既需要事实支点，也会看一个说法能不能组成完整解释。',
    },
    right: {
      label: '认识方式：更靠近成形的解释',
      detail: '你会先看说法内部是否连贯，再回头寻找能支撑它的材料。',
    },
  },
  meaning: {
    left: {
      label: '人生方向：更靠近自我生成',
      detail: '你倾向把打断和变化看作重新选择生活方向的机会。',
    },
    balanced: {
      label: '人生方向：在自我生成与稳定秩序之间校准',
      detail: '你既重视真实愿望，也不轻易放掉承诺、责任和长期安排。',
    },
    right: {
      label: '人生方向：更靠近稳定的目的秩序',
      detail: '你倾向把选择放进较长的责任、修养或人生结构里判断。',
    },
  },
};

const traditionProfileNames: Record<TraditionDimensionKey, string> = {
  ontology: '真实理解',
  ethics: '责任判断',
  politics: '公共规则',
};

const traditionProfileLabels: Record<TraditionKey, string> = {
  nature: '自然/物质',
  idea: '观念/意识',
  essence: '本质/目的',
  process: '过程/关系',
  consequence: '后果',
  principle: '原则',
  virtue: '德性',
  care: '关怀',
  liberty: '自由',
  republic: '共和',
  community: '共同体',
  equality: '平等/批判',
};

const traditionProfileDetails: Record<TraditionKey, string> = {
  nature: '你更愿意从可见材料、身体条件和现实限制解释事情是什么。',
  idea: '你更愿意从记忆、意识和被赋予的意义解释事情是什么。',
  essence: '你更愿意寻找稳定形式、用途和核心标准来界定事情。',
  process: '你更愿意把事情看成关系和变化中的连续过程。',
  consequence: '你会优先估算伤害、收益和实际后果。',
  principle: '你会优先守住规则、权利和不能越过的底线。',
  virtue: '你会优先问这件事会塑造什么样的人和品格。',
  care: '你会优先照看关系里更脆弱、更容易被忽略的人。',
  liberty: '你会优先保留个人选择和退出空间。',
  republic: '你会优先让规则经得起公开讨论和共同参与。',
  community: '你会优先维护共同生活里的互相承认与归属。',
  equality: '你会优先看谁被结构性地压低、排除或没有发声机会。',
};

export function scoreAxisChoice(pole: AxisPole) {
  return pole === 'right' ? 100 : 0;
}

export function scoreCalibrationPair(value: LikertValue) {
  const right = Math.round(((value - 1) / 4) * 100);
  return {
    left: 100 - right,
    right,
  };
}

export function scoreRankingCalibrationAnswer(answer: string[]) {
  return Object.fromEntries(answer.map((id, index) => [id, answer.length - index])) as Record<string, number>;
}

export function scoreAxisCalibrationAnswer(value: LikertValue, scoring: AxisCalibrationSignal) {
  const pair = scoreCalibrationPair(value);
  const leftScore = scoring.leftPole === 'right' ? 100 : 0;
  const rightScore = scoring.rightPole === 'right' ? 100 : 0;
  return Math.round((leftScore * pair.left + rightScore * pair.right) / 100);
}

export function classifyMatchStrength(primaryScore: number, secondScore?: number): MatchStrength {
  const gap = secondScore == null ? Number.POSITIVE_INFINITY : primaryScore - secondScore;
  if (primaryScore < 50 || gap < 3) {
    return matchStrengthText.mixed;
  }
  if (primaryScore >= 80 && gap >= 5) {
    return matchStrengthText.clear;
  }
  if (primaryScore >= 65) {
    return matchStrengthText.leaning;
  }
  return matchStrengthText.light;
}

function axisHighlightStrength(score: number): ProfileHighlightStrength {
  if (score <= 25 || score >= 75) return 'focused';
  if (score <= 40 || score >= 60) return 'leaning';
  return 'balanced';
}

function buildAxisHighlight(dimension: AxisDimensionKey, score: number): ProfileHighlight {
  const direction = score <= 40 ? 'left' : score >= 60 ? 'right' : 'balanced';
  const text = axisProfileText[dimension][direction];
  return {
    dimension,
    ...text,
    strength: axisHighlightStrength(score),
  };
}

function buildTraditionHighlight(dimension: TraditionDimensionKey, distribution: TraditionDistribution): ProfileHighlight {
  const ranked = traditionKeysByDimension[dimension]
    .map((key) => ({ key, score: distribution[key] ?? 0 }))
    .sort((a, b) => b.score - a.score);
  const [first, second] = ranked;
  const dimensionName = traditionProfileNames[dimension];

  if (first && second && first.score - second.score < 10) {
    return {
      dimension,
      label: `${dimensionName}：${traditionProfileLabels[first.key]} × ${traditionProfileLabels[second.key]}`,
      detail: `这两种处理方式都很强：${traditionProfileDetails[first.key]}同时，${traditionProfileDetails[second.key]}`,
      strength: 'mixed',
    };
  }

  return {
    dimension,
    label: `${dimensionName}：主要靠近${traditionProfileLabels[first.key]}`,
    detail: traditionProfileDetails[first.key],
    strength: first.score >= 60 ? 'focused' : 'leaning',
  };
}

export function buildProfileHighlights(axisScores: AxisScores, traditionScores: TraditionScores): ProfileHighlight[] {
  return [
    buildAxisHighlight('epistemology', axisScores.epistemology),
    buildAxisHighlight('meaning', axisScores.meaning),
    buildTraditionHighlight('ontology', traditionScores.ontology),
    buildTraditionHighlight('ethics', traditionScores.ethics),
    buildTraditionHighlight('politics', traditionScores.politics),
  ];
}

function isLikertValue(value: unknown): value is LikertValue {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isRankingAnswer(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function isAxisCalibrationQuestion(question: Question): question is AxisCalibrationQuestion {
  return question.kind === 'calibration' && question.scoring.mode === 'axis';
}

function isTraditionCalibrationQuestion(question: Question): question is TraditionCalibrationQuestion {
  return question.kind === 'calibration' && question.scoring.mode === 'tradition-ranking';
}

export function getExperimentStepKey(step: ExperimentStep) {
  return step.id;
}

export function shuffleQuestions<T>(items: readonly T[], random = Math.random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function normalizeDistribution(rawScores: TraditionDistribution, keys: TraditionKey[]): TraditionDistribution {
  const total = keys.reduce((sum, key) => sum + (rawScores[key] ?? 0), 0);
  if (total <= 0) {
    const equal = 100 / keys.length;
    return Object.fromEntries(keys.map((key) => [key, Math.round(equal)])) as TraditionDistribution;
  }

  const rawPercentages = keys.map((key) => ({
    key,
    raw: ((rawScores[key] ?? 0) / total) * 100,
  }));
  const rounded = rawPercentages.map((item) => ({
    ...item,
    value: Math.floor(item.raw),
    remainder: item.raw - Math.floor(item.raw),
  }));
  let missing = 100 - rounded.reduce((sum, item) => sum + item.value, 0);
  rounded
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((item) => {
      if (missing > 0) {
        item.value += 1;
        missing -= 1;
      }
    });

  return Object.fromEntries(rounded.map((item) => [item.key, item.value])) as TraditionDistribution;
}

function combineDistributions(
  experimentScores: TraditionDistribution,
  likertScores: TraditionDistribution,
  keys: TraditionKey[],
): TraditionDistribution {
  const experimentDistribution = normalizeDistribution(experimentScores, keys);
  const calibrationDistribution = normalizeDistribution(likertScores, keys);
  const combined = Object.fromEntries(
    keys.map((key) => [
      key,
      (experimentDistribution[key] ?? 0) * EXPERIMENT_WEIGHT + (calibrationDistribution[key] ?? 0) * CALIBRATION_WEIGHT,
    ]),
  ) as TraditionDistribution;

  return normalizeDistribution(combined, keys);
}

function average(total: number, count: number, fallback = 50) {
  return count > 0 ? total / count : fallback;
}

function axisTarget(pole: AxisPole) {
  return pole === 'right' ? 75 : 25;
}

function archetypeDistance(axisScores: AxisScores, traditionScores: TraditionScores, archetype: Archetype) {
  let sum = 0;

  for (const key of axisDimensionKeys) {
    sum += (axisScores[key] - axisTarget(archetype.axisSignature[key])) ** 2;
  }

  for (const dimension of traditionDimensionKeys) {
    const keys = traditionKeysByDimension[dimension];
    const targets = archetype.traditionSignature[dimension];
    const targetValue = 100 / targets.length;
    for (const key of keys) {
      const target = targets.includes(key) ? targetValue : 0;
      sum += ((traditionScores[dimension][key] ?? 0) - target) ** 2;
    }
  }

  return Math.sqrt(sum);
}

export function calculateResult(questions: Question[], archetypes: Archetype[], answers: Answers): TestResult {
  if (questions.length === 0) {
    throw new Error('题库为空，无法生成结果。');
  }
  if (archetypes.length === 0) {
    throw new Error('结果原型为空，无法生成结果。');
  }

  const experimentAxisTotals: Record<AxisDimensionKey, number> = { epistemology: 0, meaning: 0 };
  const experimentAxisCounts: Record<AxisDimensionKey, number> = { epistemology: 0, meaning: 0 };
  const calibrationAxisTotals: Record<AxisDimensionKey, number> = { epistemology: 0, meaning: 0 };
  const calibrationAxisCounts: Record<AxisDimensionKey, number> = { epistemology: 0, meaning: 0 };
  const experimentTraditionScores = emptyTraditionScores(0);
  const calibrationTraditionScores = emptyTraditionScores(0);
  const experimentPath = [];

  for (const question of questions) {
    if (question.kind === 'calibration') {
      const answer = answers[question.id];
      if (question.scoring.mode === 'axis' ? !isLikertValue(answer) : !isRankingAnswer(answer)) {
        throw new Error('还有题目未完成，暂时不能生成结果。');
      }

      if (isAxisCalibrationQuestion(question)) {
        if (!isLikertValue(answer)) {
          throw new Error('还有题目未完成，暂时不能生成结果。');
        }
        const dimension = question.dimension as AxisDimensionKey;
        calibrationAxisTotals[dimension] += scoreAxisCalibrationAnswer(answer, question.scoring);
        calibrationAxisCounts[dimension] += 1;
      } else if (isTraditionCalibrationQuestion(question)) {
        if (!isRankingAnswer(answer) || answer.length !== question.options.length || new Set(answer).size !== answer.length) {
          throw new Error('还有题目未完成，暂时不能生成结果。');
        }
        const dimension = question.dimension as TraditionDimensionKey;
        const rankingScores = scoreRankingCalibrationAnswer(answer);
        for (const optionId of answer) {
          const option = question.options.find((item) => item.id === optionId);
          if (!option) {
            throw new Error('题目答案格式不正确，暂时不能生成结果。');
          }
          calibrationTraditionScores[dimension][option.tradition] =
            (calibrationTraditionScores[dimension][option.tradition] ?? 0) + rankingScores[option.id];
        }
      }
    }

    if (question.kind === 'experiment') {
      for (const step of question.steps) {
        const answer = answers[getExperimentStepKey(step)];
        if (typeof answer !== 'string' || answer === '') {
          throw new Error('还有题目未完成，暂时不能生成结果。');
        }

        const option = step.options.find((item) => item.id === answer);
        if (!option) {
          throw new Error('题目答案格式不正确，暂时不能生成结果。');
        }

        experimentPath.push({
          experimentId: question.id,
          experimentTitle: question.title,
          stepId: step.id,
          dimension: step.dimension,
          focusLabel: experimentFocusLabels[step.dimension],
          stepPrompt: step.prompt,
          choiceLabel: option.label,
          benefit: option.benefit,
          cost: option.cost,
        });

        if (option.scoring.mode === 'axis') {
          const dimension = step.dimension as AxisDimensionKey;
          experimentAxisTotals[dimension] += scoreAxisChoice(option.scoring.pole);
          experimentAxisCounts[dimension] += 1;
        } else {
          const dimension = step.dimension as TraditionDimensionKey;
          experimentTraditionScores[dimension][option.scoring.tradition] =
            (experimentTraditionScores[dimension][option.scoring.tradition] ?? 0) + 1;
        }
      }
    }
  }

  const axisScores = Object.fromEntries(
    axisDimensionKeys.map((dimension) => {
      const experimentScore = average(experimentAxisTotals[dimension], experimentAxisCounts[dimension]);
      const calibrationScore = average(calibrationAxisTotals[dimension], calibrationAxisCounts[dimension]);
      return [
        dimension,
        Math.round(clamp(experimentScore * EXPERIMENT_WEIGHT + calibrationScore * CALIBRATION_WEIGHT, 0, 100)),
      ];
    }),
  ) as AxisScores;

  const traditionScores = Object.fromEntries(
    traditionDimensionKeys.map((dimension) => [
      dimension,
      combineDistributions(
        experimentTraditionScores[dimension],
        calibrationTraditionScores[dimension],
        traditionKeysByDimension[dimension],
      ),
    ]),
  ) as TraditionScores;

  const rankedByDistance = archetypes
    .map((archetype) => {
      const distance = archetypeDistance(axisScores, traditionScores, archetype);
      return {
        archetype,
        distance,
        matchScore: Math.max(0, Math.round(100 - distance / 3)),
      };
    })
    .sort((a, b) => a.distance - b.distance);
  const ranked = rankedByDistance.map<ScoredArchetype>((item, index) => ({
    ...item,
    matchStrength: classifyMatchStrength(item.matchScore, rankedByDistance[index + 1]?.matchScore),
  }));
  const primary = ranked[0];
  const profileHighlights = buildProfileHighlights(axisScores, traditionScores);

  return {
    axisScores,
    traditionScores,
    primary,
    related: ranked.slice(1, 3),
    experimentPath,
    profileHighlights,
    resultMode: primary.matchStrength.level === 'mixed' ? 'profile-led' : 'archetype-led',
  };
}

export function getAnsweredCount(questions: Question[], answers: Answers) {
  return questions.reduce((count, question) => {
    if (question.kind === 'calibration') {
      const answer = answers[question.id];
      if (isAxisCalibrationQuestion(question)) {
        return answer != null && answer !== '' ? count + 1 : count;
      }
      if (isTraditionCalibrationQuestion(question)) {
        return Array.isArray(answer) && answer.length === question.options.length ? count + 1 : count;
      }
      return count;
    }

    return (
      count +
      question.steps.filter((step) => {
        const answer = answers[getExperimentStepKey(step)];
        return typeof answer === 'string' && answer.length > 0;
      }).length
    );
  }, 0);
}

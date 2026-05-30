import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, BookOpen, Compass, Copy, RotateCcw, Sparkles } from 'lucide-react';
import { questions } from './data/questions';
import { archetypes } from './data/results';
import {
  axisDimensionKeys,
  calculateResult,
  calibrationScale,
  dimensionDefinitions,
  dimensionKeys,
  getAnsweredCount,
  getExperimentStepKey,
  shuffleQuestions,
  traditionDimensionKeys,
} from './lib/scoring';
import type {
  AnswerValue,
  Answers,
  AxisCalibrationQuestion,
  AxisDimensionKey,
  Question,
  TestResult,
  TraditionCalibrationQuestion,
  TraditionDimensionKey,
  TraditionKey,
} from './lib/types';
import './styles.css';

const featuredArchetypes = [archetypes[0], archetypes[11], archetypes[14]];

function getTraditionLabel(dimension: TraditionDimensionKey, tradition: TraditionKey) {
  const definition = dimensionDefinitions[dimension];
  if (definition.mode !== 'tradition') return tradition;
  return definition.traditions.find((item) => item.key === tradition)?.label ?? tradition;
}

function getTopTraditions(result: TestResult) {
  return traditionDimensionKeys.map((dimension) => {
    const entries = Object.entries(result.traditionScores[dimension]) as [TraditionKey, number][];
    const [tradition, value] = entries.sort((a, b) => b[1] - a[1])[0];
    return {
      dimension,
      dimensionName: dimensionDefinitions[dimension].name,
      label: getTraditionLabel(dimension, tradition),
      value,
    };
  });
}

function getResultHeadline(result: TestResult) {
  const title = result.primary.archetype.title;
  switch (result.primary.matchStrength.level) {
    case 'clear':
      return `你清晰接近「${title}」`;
    case 'leaning':
      return `你明显偏向「${title}」`;
    case 'light':
      return `「${title}」是你的最近叙事入口`;
    case 'mixed':
      return '你的画像更适合从五领域组合阅读';
  }
}

function getRelatedStrengthLabel(level: TestResult['primary']['matchStrength']['level']) {
  return level === 'clear' || level === 'leaning' ? '明显相关' : '轻度相关';
}

function buildShareText(result: TestResult) {
  const { archetype } = result.primary;
  const axisLine = axisDimensionKeys
    .map((dimension) => `${dimensionDefinitions[dimension].name} ${result.axisScores[dimension]}`)
    .join(' · ');
  const traditionLine = getTopTraditions(result)
    .map((item) => `${item.dimensionName}：${item.label}`)
    .join(' · ');
  const highlightLine = result.profileHighlights.map((item) => item.label).join('；');

  return [
    `我的哲学思想倾向：${getResultHeadline(result)}`,
    `最近叙事入口：${archetype.title} / ${archetype.englishTitle}`,
    `贴近程度：${result.primary.matchStrength.label}（${result.primary.matchStrength.description}）`,
    `思想谱系：${archetype.spectrumLabels.join(' · ')}`,
    `五领域摘要：${highlightLine}`,
    `轴向画像：${axisLine}`,
    `传统倾向：${traditionLine}`,
    archetype.summary,
    `相近思想家：${archetype.philosophers.join('、')}`,
  ].join('\n');
}

async function writeClipboard(text: string) {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the textarea fallback for browsers that expose but block clipboard writes.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
}

function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="home-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Philosophical Spectrum Test</p>
          <h1>哲学思想倾向测试</h1>
          <p className="hero-lede">
            通过四个综合思想实验和一组低提示校准题，生成你的五领域哲学画像、思想谱系与解题路径。
          </p>
          <div className="hero-meta" aria-label="测试结构">
            <span>4 个综合实验</span>
            <span>20 个选择步骤</span>
            <span>10 道校准题</span>
            <span>{archetypes.length} 种手写原型</span>
          </div>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={onStart}>
              <BookOpen size={18} />
              开始测试
            </button>
            <span className="micro-note">不是科学人格诊断，而是一份哲学自我理解的草图。</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="showcase-title">
            <Compass size={18} />
            <span>Traditions as a living map</span>
          </div>
          <div className="archetype-showcase">
            {featuredArchetypes.map((archetype) => (
              <figure className="showcase-card" key={archetype.id}>
                <img src={archetype.image} alt="" />
                <figcaption>
                  <strong>{archetype.shortName}</strong>
                  <span>{archetype.spectrumLabels.join(' · ')}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="dimension-orbit five">
            <span>Knowing</span>
            <span>Being</span>
            <span>Ethics</span>
            <span>Polis</span>
            <span>Meaning</span>
          </div>
          <div className="lamp-glow" />
        </div>
      </section>
    </main>
  );
}

function isAxisCalibrationQuestion(question: Question): question is AxisCalibrationQuestion {
  return question.kind === 'calibration' && question.scoring.mode === 'axis';
}

function isTraditionCalibrationQuestion(question: Question): question is TraditionCalibrationQuestion {
  return question.kind === 'calibration' && question.scoring.mode === 'tradition-ranking';
}

function Quiz({
  orderedQuestions,
  answers,
  currentIndex,
  onAnswer,
  onBack,
  onNext,
}: {
  orderedQuestions: Question[];
  answers: Answers;
  currentIndex: number;
  onAnswer: (questionId: string, value: AnswerValue) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const question = orderedQuestions[currentIndex];
  const selected = question.kind === 'calibration' ? answers[question.id] : null;
  const isLast = currentIndex === orderedQuestions.length - 1;
  const answeredCount = getAnsweredCount(orderedQuestions, answers);
  const totalSignals = orderedQuestions.reduce((total, item) => total + (item.kind === 'calibration' ? 1 : item.steps.length), 0);
  const canContinue =
    question.kind === 'calibration'
      ? isAxisCalibrationQuestion(question)
        ? selected != null
        : isTraditionCalibrationQuestion(question) && Array.isArray(selected) && selected.length === question.options.length
      : question.steps.every((step) => typeof answers[getExperimentStepKey(step)] === 'string' && answers[getExperimentStepKey(step)] !== '');
  const progress = (answeredCount / totalSignals) * 100;
  const rankingAnswer = isTraditionCalibrationQuestion(question) && Array.isArray(selected) ? selected : [];

  const toggleRankingOption = (optionId: string) => {
    if (!isTraditionCalibrationQuestion(question)) return;
    const next = rankingAnswer.includes(optionId)
      ? rankingAnswer.filter((item) => item !== optionId)
      : [...rankingAnswer, optionId];
    onAnswer(question.id, next);
  };

  return (
    <main className="quiz-shell">
      <header className="quiz-top">
        <div>
          <p className="eyebrow">{question.kind === 'experiment' ? '思想实验' : '校准判断'}</p>
          <h1>第 {currentIndex + 1} 组</h1>
        </div>
        <span className="count-mark">{currentIndex + 1}/{orderedQuestions.length}</span>
      </header>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <section className="question-panel">
        {isAxisCalibrationQuestion(question) && (
          <>
            <p className="context-line">{question.context ?? '请在两种判断方式之间选择更接近你的一边。'}</p>
            <h2>{question.prompt}</h2>
            <div className="calibration-anchors" aria-hidden="true">
              <span>{question.leftLabel}</span>
              <span>{question.rightLabel}</span>
            </div>
            <div className="scale-grid calibration-scale-grid" role="group" aria-label="取向程度">
              {calibrationScale.map((option) => (
                <button
                  className={`scale-button ${selected === option.value ? 'selected' : ''}`}
                  key={option.value}
                  type="button"
                  onClick={() => onAnswer(question.id, option.value)}
                >
                  <span className="scale-value">{option.value}</span>
                  <strong>{option.label}</strong>
                </button>
              ))}
            </div>
          </>
        )}

        {isTraditionCalibrationQuestion(question) && (
          <>
            <p className="context-line">{question.context ?? '请按你更先考虑的顺序依次点选；点已选项可以撤回。'}</p>
            <h2>{question.prompt}</h2>
            <div className="ranking-grid" role="group" aria-label="排序校准">
              {question.options.map((option) => {
                const rank = rankingAnswer.indexOf(option.id);
                return (
                  <button
                    className={`ranking-option ${rank >= 0 ? 'selected' : ''}`}
                    key={option.id}
                    type="button"
                    onClick={() => toggleRankingOption(option.id)}
                  >
                    <span className="rank-mark">{rank >= 0 ? rank + 1 : ''}</span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {question.kind === 'experiment' && (
          <>
            <p className="context-line">请在同一个情境里连续做几次取舍；先看每条路的吸引力，选中后再面对它的代价。</p>
            <h2>{question.title}</h2>
            <p className="experiment-setup">{question.setup}</p>
            <div className="experiment-steps">
              {question.steps.map((step, index) => {
                const stepKey = getExperimentStepKey(step);
                const stepAnswer = answers[stepKey];
                return (
                  <article className="experiment-step" key={step.id}>
                    <h3>
                      <span>{index + 1}</span>
                      {step.prompt}
                    </h3>
                    <div className={`experiment-option-grid option-count-${step.options.length}`}>
                      {step.options.map((option) => (
                        <button
                          className={`experiment-option ${stepAnswer === option.id ? 'selected' : ''}`}
                          key={option.id}
                          type="button"
                          onClick={() => onAnswer(stepKey, option.id)}
                        >
                          <strong>{option.label}</strong>
                          <span>{option.benefit}</span>
                          {stepAnswer === option.id && <small className="option-cost">代价：{option.cost}</small>}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
      <footer className="quiz-actions">
        <button className="quiet-action" type="button" onClick={onBack} disabled={currentIndex === 0}>
          <ArrowLeft size={18} />
          上一组
        </button>
        <button className="primary-action" type="button" onClick={onNext} disabled={!canContinue}>
          {isLast ? '查看结果' : '下一组'}
          <ArrowRight size={18} />
        </button>
      </footer>
    </main>
  );
}

function AxisProfile({ result, dimension }: { result: TestResult; dimension: AxisDimensionKey }) {
  const definition = dimensionDefinitions[dimension];
  if (definition.mode !== 'axis') return null;
  const score = result.axisScores[dimension];
  const leaning = score >= 50 ? definition.rightLabel : definition.leftLabel;

  return (
    <article className="axis-profile">
      <div className="axis-heading">
        <div>
          <p className="section-kicker">{definition.name}</p>
          <h3>{leaning}</h3>
        </div>
        <b>{score}</b>
      </div>
      <div className="axis-scale" aria-label={`${definition.name} ${score}`}>
        <span style={{ left: `${score}%` }} />
      </div>
      <div className="axis-labels">
        <small>{definition.leftLabel}</small>
        <small>{definition.rightLabel}</small>
      </div>
      <p>{definition.resultHint}</p>
    </article>
  );
}

function TraditionProfile({ result, dimension }: { result: TestResult; dimension: TraditionDimensionKey }) {
  const definition = dimensionDefinitions[dimension];
  if (definition.mode !== 'tradition') return null;

  const entries = definition.traditions
    .map((tradition) => ({
      ...tradition,
      value: result.traditionScores[dimension][tradition.key] ?? 0,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <article className="tradition-profile">
      <p className="section-kicker">{definition.name}</p>
      <h3>{entries[0].label}</h3>
      <p>{definition.resultHint}</p>
      <div className="tradition-bars">
        {entries.map((entry) => (
          <div className="tradition-row" key={entry.key}>
            <span>{entry.label}</span>
            <div className="bar">
              <span style={{ width: `${entry.value}%` }} />
            </div>
            <b>{entry.value}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

function ResultView({ result, onRestart }: { result: TestResult; onRestart: () => void }) {
  const { archetype } = result.primary;
  const [copied, setCopied] = useState(false);
  const topTraditions = getTopTraditions(result);
  const resultHeadline = getResultHeadline(result);

  const copyResult = async () => {
    await writeClipboard(buildShareText(result));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="result-shell">
      <section className="result-hero">
        <div className="result-copy">
          <p className="eyebrow">{result.resultMode === 'profile-led' ? '你的混合画像' : '你的思想原型'}</p>
          <h1>{resultHeadline}</h1>
          <p className="english-title">
            {result.resultMode === 'profile-led'
              ? `最近叙事入口：${archetype.title} / ${archetype.englishTitle}`
              : archetype.englishTitle}
          </p>
          <div className="spectrum-strip" aria-label="思想谱系">
            {archetype.spectrumLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className={`match-strength ${result.primary.matchStrength.level}`}>
            <strong>贴近程度：{result.primary.matchStrength.label}</strong>
            <p>{result.primary.matchStrength.description}</p>
            <small>这不是考试分数，而是在手写思想原型中寻找与你路径最近的叙事。</small>
          </div>
          <p className="result-summary">{archetype.summary}</p>
          <p className="diagnostic-note">这是一份哲学自我理解工具，不是科学人格诊断；结果表示倾向和相邻传统，而非单一学派归属。</p>
          <div className="result-actions">
            <button className="primary-action" type="button" onClick={copyResult}>
              <Copy size={18} />
              {copied ? '已复制' : '复制摘要'}
            </button>
            <button className="quiet-action" type="button" onClick={onRestart}>
              <RotateCcw size={18} />
              重测
            </button>
          </div>
        </div>
        <figure className="result-image">
          <img src={archetype.image} alt={`${archetype.title}插画`} />
          <figcaption>{archetype.shortName}的思想场景 · 贴近程度：{result.primary.matchStrength.label}</figcaption>
        </figure>
      </section>

      <section className="profile-section five-domain">
        <div className="profile-heading">
          <p className="section-kicker">Five Domains</p>
          <h2>五领域思想画像</h2>
          <p>先读这里，再读原型。混合不是失败，而是你在不同问题里调用了不止一种哲学直觉。</p>
        </div>
        <div className="profile-highlight-grid">
          {result.profileHighlights.map((item) => (
            <article className={`profile-highlight ${item.strength}`} key={item.dimension}>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <div className="axis-profile-grid">
          {axisDimensionKeys.map((dimension) => (
            <AxisProfile dimension={dimension} key={dimension} result={result} />
          ))}
        </div>
        <div className="tradition-profile-grid">
          {traditionDimensionKeys.map((dimension) => (
            <TraditionProfile dimension={dimension} key={dimension} result={result} />
          ))}
        </div>
      </section>

      <section className="reading-section">
        <article className="text-block">
          <p className="section-kicker">Spectrum</p>
          <h2>主义谱系说明</h2>
          <p>{archetype.academicNote}</p>
        </article>
        <article className="text-block accent">
          <p className="section-kicker">Path</p>
          <h2>你的解题习惯</h2>
          <p>{archetype.pathNote}</p>
        </article>
      </section>

      <section className="reading-section">
        <article className="text-block wide">
          <p className="section-kicker">Insight</p>
          <h2>你如何组织问题</h2>
          <p>{archetype.insight}</p>
        </article>
        <article className="text-block accent">
          <p className="section-kicker">Gentle Warning</p>
          <h2>温和的提醒</h2>
          <p>{archetype.blindSpot}</p>
        </article>
      </section>

      <section className="path-section">
        <div className="profile-heading">
          <p className="section-kicker">Thought Experiments</p>
          <h2>解题路径回放</h2>
          <p>{topTraditions.map((item) => `${item.dimensionName}偏向${item.label}`).join('；')}。</p>
        </div>
        <div className="path-list">
          {result.experimentPath.map((item) => (
            <article className="path-item" key={item.stepId}>
              <small>{item.experimentTitle} · {item.focusLabel}</small>
              <strong>{item.choiceLabel}</strong>
              <p>{item.benefit}</p>
              <p className="path-cost">{item.cost}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reference-section">
        <div>
          <p className="section-kicker">Philosophers</p>
          <h2>相近思想家</h2>
          <div className="tag-row">
            {archetype.philosophers.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="section-kicker">Schools</p>
          <h2>相关流派</h2>
          <div className="tag-row">
            {archetype.schools.map((school) => (
              <span key={school}>{school}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="section-kicker">Reading</p>
          <h2>延伸阅读方向</h2>
          <p className="reading-hint">{archetype.readingHint}</p>
        </div>
      </section>

      <section className="related-section">
        <h2>你的邻近类型</h2>
        <div className="related-list">
          {result.related.map(({ archetype: related, matchStrength }) => (
            <div className="related-item" key={related.id}>
              <Sparkles size={16} />
              <span>{related.title}</span>
              <small>相邻叙事 · {getRelatedStrengthLabel(matchStrength.level)} · {related.spectrumLabels.join(' · ')}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function App() {
  const [stage, setStage] = useState<'home' | 'quiz' | 'result'>('home');
  const [answers, setAnswers] = useState<Answers>({});
  const [orderedQuestions, setOrderedQuestions] = useState<Question[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);

  const result = useMemo(() => {
    if (stage !== 'result') return null;
    return calculateResult(orderedQuestions, archetypes, answers);
  }, [answers, orderedQuestions, stage]);

  const start = () => {
    setOrderedQuestions(shuffleQuestions(questions));
    setAnswers({});
    setCurrentIndex(0);
    setStage('quiz');
  };

  const next = () => {
    if (currentIndex === orderedQuestions.length - 1) {
      setStage('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentIndex((value) => value + 1);
  };

  if (stage === 'home') return <Home onStart={start} />;
  if (stage === 'quiz') {
    return (
      <Quiz
        answers={answers}
        currentIndex={currentIndex}
        orderedQuestions={orderedQuestions}
        onAnswer={(questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }))}
        onBack={() => setCurrentIndex((value) => Math.max(0, value - 1))}
        onNext={next}
      />
    );
  }
  return result ? <ResultView result={result} onRestart={start} /> : <Home onStart={start} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

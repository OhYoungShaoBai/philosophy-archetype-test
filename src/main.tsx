import { StrictMode, type RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { ArrowLeft, ArrowRight, BookOpen, Compass, Copy, Download, LibraryBig, RotateCcw, Sparkles, X } from 'lucide-react';
import { questions } from './data/questions';
import { archetypes } from './data/results';
import { philosopherCards, readingCards, schoolCards } from './data/knowledge';
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
import { buildShareCardData, buildShareText } from './lib/share';
import type { ShareCardData, ShareDomainScore } from './lib/share';
import { buildKnowledgeIndex, getKnowledgeCategoryForKind, knowledgeCategoryTabs } from './lib/knowledgeIndex';
import type { KnowledgeCategoryId, KnowledgeDetailSection, KnowledgeIndexItem, KnowledgeItemKind, KnowledgeRelatedItem } from './lib/knowledgeIndex';
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
const knowledgeIndex = buildKnowledgeIndex({ archetypes, philosopherCards, schoolCards, readingCards });

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

function SiteNav({
  current,
  onHome,
  onOpenLibrary,
  onStart,
}: {
  current: 'home' | 'library' | 'result';
  onHome: () => void;
  onOpenLibrary: () => void;
  onStart: () => void;
}) {
  return (
    <header className="site-nav">
      <button className="brand-button" type="button" onClick={onHome} aria-label="回到首页">
        <Compass size={18} />
        <span>哲学思想倾向测试</span>
      </button>
      <nav aria-label="站内导航">
        <button className={current === 'home' ? 'active' : ''} type="button" onClick={onHome}>
          首页
        </button>
        <button className={current === 'library' ? 'active' : ''} type="button" onClick={onOpenLibrary}>
          百科
        </button>
        <button className="nav-start" type="button" onClick={onStart}>
          开始测试
        </button>
      </nav>
    </header>
  );
}

function Home({ onStart, onHome, onOpenLibrary }: { onStart: () => void; onHome: () => void; onOpenLibrary: () => void }) {
  const outcomeItems = [
    ['五领域画像', '认识、真实、伦理、公共生活和人生方向的组合图。'],
    ['原型解读', '15 种手写思想原型，给你一个最近的叙事入口。'],
    ['分享图与文案', '保存竖版结果卡，邀请朋友比较彼此的思想倾向。'],
    ['路径化百科', '沿着原型、哲学家、流派和阅读推荐继续探索。'],
  ];

  return (
    <main className="home-shell">
      <SiteNav current="home" onHome={onHome} onOpenLibrary={onOpenLibrary} onStart={onStart} />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Philosophical Self-Understanding Test</p>
          <h1>哲学自我理解测试</h1>
          <p className="hero-lede">
            通过四个综合思想实验和一组低提示校准题，生成你的五领域哲学画像、思想谱系与解题路径。它不是心理诊断，也不是娱乐玄学，而是一张帮助你理解自己如何判断的临时地图。
          </p>
          <p className="hero-share-hook">
            测完后可以把结果卡发给朋友：看看你们是在同一条思想路径上相邻，还是从完全不同的问题出发。
          </p>
          <div className="hero-meta" aria-label="测试结构">
            <span>4 个综合实验</span>
            <span>20 个选择步骤</span>
            <span>10 道校准题</span>
            <span>{archetypes.length} 种手写原型</span>
          </div>
          <div className="outcome-preview" aria-label="答完会得到什么">
            {outcomeItems.map(([title, description]) => (
              <article className="outcome-item" key={title}>
                <strong>{title}</strong>
                <span>{description}</span>
              </article>
            ))}
          </div>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={onStart}>
              <BookOpen size={18} />
              开始测试
            </button>
            <button className="quiet-action" type="button" onClick={onOpenLibrary}>
              <LibraryBig size={18} />
              先逛百科
            </button>
            <span className="micro-note">结果页会先给核心画像，深读内容再进入百科。</span>
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

interface KnowledgeDetail {
  title: string;
  eyebrow: string;
  body: string;
  detail: string;
  guideQuestion?: string;
  detailSections?: KnowledgeDetailSection[];
  portraitItems?: KnowledgeDetailSection[];
  image?: string;
  tags?: string[];
  relatedArchetypes?: Array<Pick<TestResult['primary']['archetype'], 'id' | 'title' | 'shortName'>>;
  relatedItems?: KnowledgeRelatedItem[];
}

const knowledgeKindLabels: Record<KnowledgeItemKind, string> = {
  archetype: '原型',
  philosopher: '哲学家',
  school: '流派',
  reading: '阅读',
};

function getKnowledgeItem(kind: KnowledgeItemKind, id: string) {
  return knowledgeIndex[getKnowledgeCategoryForKind(kind)].find((item) => item.id === id);
}

function getPhilosopherDetail(id: string): KnowledgeDetail {
  const card = philosopherCards[id];
  return {
    title: card.name,
    eyebrow: card.era,
    body: card.summary,
    detail: card.whyItMatters,
  };
}

function getSchoolDetail(id: string): KnowledgeDetail {
  const card = schoolCards[id];
  return {
    title: card.name,
    eyebrow: '思想流派',
    body: card.summary,
    detail: card.resultHint,
  };
}

function getReadingDetail(id: string): KnowledgeDetail {
  const card = readingCards[id];
  return {
    title: card.title,
    eyebrow: card.author,
    body: card.whyRead,
    detail: '把它当成一条入口即可：先读与你结果相关的章节或主题，再回头看完整脉络。',
  };
}

function KnowledgeCardButton({
  title,
  eyebrow,
  description,
  onOpen,
}: {
  title: string;
  eyebrow: string;
  description: string;
  onOpen: () => void;
}) {
  return (
    <button className="knowledge-card" type="button" onClick={onOpen}>
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <small>{description}</small>
    </button>
  );
}

function DetailModal({
  detail,
  onClose,
  onOpenRelated,
}: {
  detail: KnowledgeDetail | null;
  onClose: () => void;
  onOpenRelated?: (item: KnowledgeRelatedItem) => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!detail) return undefined;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [detail, onClose]);

  if (!detail) return null;
  const hasPortraitItems = Boolean(detail.portraitItems?.length);
  const hasDetailSections = Boolean(detail.detailSections?.length);

  return (
    <div className="detail-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <article className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button ref={closeButtonRef} className="detail-modal-close" type="button" aria-label="关闭" onClick={onClose}>
          <X size={18} />
        </button>
        <p className="section-kicker">{detail.eyebrow}</p>
        <h2 id="detail-modal-title">{detail.title}</h2>
        {detail.image && <img className="detail-modal-image" src={detail.image} alt="" />}
        {detail.tags && (
          <div className="detail-modal-tags">
            {detail.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
        <p>{detail.body}</p>
        {detail.guideQuestion && (
          <div className="detail-guide-question">
            <strong>导读问题</strong>
            <span>{detail.guideQuestion}</span>
          </div>
        )}
        {hasPortraitItems && (
          <section className="detail-portrait-panel" aria-label="原型画像">
            <strong>原型画像</strong>
            <div className="detail-portrait-grid">
              {detail.portraitItems?.map((item) => (
                <article className="detail-portrait-card" key={item.title}>
                  <span>{item.title}</span>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}
        {hasDetailSections ? (
          <section className="detail-section-list" aria-label="百科深读">
            {detail.detailSections?.map((section) => (
              <article className="detail-section-card" key={section.title}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </section>
        ) : (
          <div className="detail-modal-note">
            {detail.detail.split('\n').map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
        {detail.relatedArchetypes && detail.relatedArchetypes.length > 0 && (
          <div className="detail-related">
            <strong>相关原型</strong>
            <div>
              {detail.relatedArchetypes.map((archetype) => (
                <span key={archetype.id}>
                  {archetype.shortName} · {archetype.title}
                </span>
              ))}
            </div>
          </div>
        )}
        {detail.relatedItems && detail.relatedItems.length > 0 && (
          <div className="detail-related detail-related-items">
            <strong>继续索引</strong>
            <div>
              {detail.relatedItems.map((item) => (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  onClick={() => onOpenRelated?.(item)}
                >
                  <small>{knowledgeKindLabels[item.kind]}</small>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

function getRelatedArchetypes(ids: string[]) {
  return ids
    .map((id) => archetypes.find((archetype) => archetype.id === id))
    .filter((archetype): archetype is TestResult['primary']['archetype'] => Boolean(archetype))
    .map(({ id, title, shortName }) => ({ id, title, shortName }));
}

function buildLibraryDetail(item: KnowledgeIndexItem): KnowledgeDetail {
  return {
    title: item.title,
    eyebrow: item.eyebrow,
    body: item.description,
    detail: item.detail,
    guideQuestion: item.guideQuestion,
    detailSections: item.detailSections,
    portraitItems: item.portraitItems,
    image: item.image,
    tags: item.tags,
    relatedArchetypes: getRelatedArchetypes(item.relatedArchetypeIds),
    relatedItems: item.relatedItems,
  };
}

function LibraryView({
  backLabel,
  onBack,
  onHome,
  onOpenLibrary,
  onStart,
}: {
  backLabel: string;
  onBack: () => void;
  onHome: () => void;
  onOpenLibrary: () => void;
  onStart: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategoryId>('archetypes');
  const [selectedDetail, setSelectedDetail] = useState<KnowledgeDetail | null>(null);
  const items = knowledgeIndex[activeCategory];
  const activeTab = knowledgeCategoryTabs.find((tab) => tab.id === activeCategory) ?? knowledgeCategoryTabs[0];
  const openLibraryItem = (kind: KnowledgeItemKind, id: string) => {
    const item = getKnowledgeItem(kind, id);
    if (!item) return;
    setActiveCategory(getKnowledgeCategoryForKind(kind));
    setSelectedDetail(buildLibraryDetail(item));
  };

  return (
    <main className="library-shell">
      <SiteNav current="library" onHome={onHome} onOpenLibrary={onOpenLibrary} onStart={onStart} />
      <section className="library-hero">
        <div>
          <p className="eyebrow">Philosophy Library</p>
          <h1>站内哲学百科</h1>
          <p>
            这里不是完整哲学史，而是一间轻量阅览室：从测试里的 15 个原型出发，继续查看相邻哲学家、流派和阅读入口。
          </p>
        </div>
        <div className="library-hero-actions">
          <button className="quiet-action" type="button" onClick={onBack}>
            <ArrowLeft size={18} />
            {backLabel}
          </button>
          <button className="primary-action" type="button" onClick={onStart}>
            <BookOpen size={18} />
            开始测试
          </button>
        </div>
      </section>

      <section className="library-paths" aria-label="导读路径">
        {knowledgeIndex.paths.map((path) => (
          <article className="library-path-card" key={path.id}>
            <p className="section-kicker">{path.eyebrow}</p>
            <h2>{path.title}</h2>
            <p>{path.description}</p>
            <div className="library-path-steps">
              {path.steps.map((step) => (
                <button key={`${path.id}-${step.label}`} type="button" onClick={() => openLibraryItem(step.targetKind, step.targetId)}>
                  <span>{step.label}</span>
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="library-tabs" aria-label="百科分类">
        {knowledgeCategoryTabs.map((tab) => (
          <button
            className={activeCategory === tab.id ? 'active' : ''}
            key={tab.id}
            type="button"
            aria-pressed={activeCategory === tab.id}
            onClick={() => setActiveCategory(tab.id)}
          >
            <strong>{tab.label}</strong>
            <span>{tab.description}</span>
          </button>
        ))}
      </section>

      <section className="library-section" aria-labelledby="library-section-title">
        <div className="library-section-heading">
          <p className="section-kicker">{activeTab.description}</p>
          <h2 id="library-section-title">{activeTab.label}</h2>
        </div>
        <div className={`library-grid ${activeCategory}`}>
          {items.map((item) => (
            <button className={`library-card ${item.kind}`} key={`${item.kind}-${item.id}`} type="button" onClick={() => setSelectedDetail(buildLibraryDetail(item))}>
              {item.image && <img src={item.image} alt="" />}
              <span className="library-card-eyebrow">{item.eyebrow}</span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <small className="library-guide-question">{item.guideQuestion}</small>
              <div className="library-card-tags" aria-label="标签">
                {item.tags.slice(0, 4).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <small>{item.relatedItems.length} 个相关索引</small>
            </button>
          ))}
        </div>
      </section>
      <DetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} onOpenRelated={(item) => openLibraryItem(item.kind, item.id)} />
    </main>
  );
}

function ShareDomainItem({ score }: { score: ShareDomainScore }) {
  if (score.kind === 'axis') {
    return (
      <div className="share-domain-row">
        <div>
          <strong>{score.label}</strong>
          <small>
            {score.leftLabel} / {score.rightLabel}
          </small>
        </div>
        <div className="share-axis-meter" aria-label={`${score.label} ${score.value}`}>
          <span style={{ width: `${score.value}%` }} />
        </div>
        <b>{score.value}</b>
      </div>
    );
  }

  return (
    <div className="share-domain-row tradition">
      <div>
        <strong>{score.label}</strong>
        <small>{score.entries.slice(0, 2).map((entry) => entry.label).join(' / ')}</small>
      </div>
      <div className="share-tradition-stack">
        {score.entries.slice(0, 3).map((entry) => (
          <span key={entry.label} style={{ width: `${entry.value}%` }} />
        ))}
      </div>
      <b>{score.entries[0].value}</b>
    </div>
  );
}

function ShareCard({ card }: { card: ShareCardData }) {
  return (
    <article className="share-card">
      <div className="share-card-image">
        <img src={card.image} alt="" />
      </div>
      <div className="share-card-body">
        <p className="section-kicker">{card.headline}</p>
        <h2>{card.title}</h2>
        <p className="share-english">{card.englishTitle}</p>
        <div className="share-tags">
          {card.spectrumLabels.slice(0, 4).map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <p className="share-summary">{card.summary}</p>
        <div className="share-domain-list">
          {card.domainScores.map((score) => (
            <ShareDomainItem key={score.dimension} score={score} />
          ))}
        </div>
        <div className="share-highlights">
          {card.profileHighlights.map((highlight) => (
            <span key={highlight}>{highlight}</span>
          ))}
        </div>
        {card.personalNote && <p className="share-note">我的备注：{card.personalNote}</p>}
        <p className="share-invitation">{card.invitation}</p>
        <p className="share-disclaimer">{card.disclaimer}</p>
      </div>
    </article>
  );
}

function SharePanel({
  card,
  cardRef,
  personalNote,
  isExporting,
  onNoteChange,
  onCopy,
  onExport,
}: {
  card: ShareCardData;
  cardRef: RefObject<HTMLDivElement | null>;
  personalNote: string;
  isExporting: boolean;
  onNoteChange: (value: string) => void;
  onCopy: () => void;
  onExport: () => void;
}) {
  return (
    <section className="share-section">
      <div className="share-layout">
        <div className="share-controls">
          <p className="section-kicker">Share Card</p>
          <h2>把这张思想地图发给朋友</h2>
          <p>卡片保留五领域画像和结果摘记，不显示原型匹配百分比。复制文案会邀请朋友也来测一次，看看彼此的思想原型是否相邻。</p>
          <label className="share-note-label">
            <span>个人备注</span>
            <textarea
              className="share-note-input"
              maxLength={80}
              placeholder="例如：我想把这个结果当成一次自我观察。"
              value={personalNote}
              onChange={(event) => onNoteChange(event.target.value)}
            />
          </label>
          <div className="share-actions">
            <button className="primary-action" type="button" onClick={onExport} disabled={isExporting}>
              <Download size={18} />
              {isExporting ? '正在生成' : '保存分享图'}
            </button>
            <button className="quiet-action" type="button" onClick={onCopy}>
              <Copy size={18} />
              复制分享文案
            </button>
          </div>
        </div>
        <div className="share-preview">
          <div ref={cardRef} className="share-card-export">
            <ShareCard card={card} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultLibraryBridge({
  archetype,
  onOpenLibrary,
  onOpenDetail,
}: {
  archetype: TestResult['primary']['archetype'];
  onOpenLibrary: () => void;
  onOpenDetail: (kind: KnowledgeItemKind, id: string) => void;
}) {
  const item = getKnowledgeItem('archetype', archetype.id);
  const relatedItems = item?.relatedItems.slice(0, 6) ?? [];

  return (
    <section className="continue-section result-library-bridge">
      <div className="bridge-copy">
        <p className="section-kicker">Continue Reading</p>
        <h2>继续了解{archetype.shortName}</h2>
        <p>结果页只保留核心画像；完整原型画像、相邻思想家、流派和阅读路径已经放进站内百科。</p>
        {item?.guideQuestion && <strong className="bridge-question">{item.guideQuestion}</strong>}
        <div className="bridge-actions">
          <button className="primary-action" type="button" onClick={onOpenLibrary}>
            <LibraryBig size={18} />
            进入哲学百科
          </button>
          {item && (
            <button className="quiet-action" type="button" onClick={() => onOpenDetail('archetype', archetype.id)}>
              <Compass size={18} />
              打开当前原型
            </button>
          )}
        </div>
      </div>
      <div className="bridge-link-grid" aria-label="相关百科索引">
        {relatedItems.map((related) => (
          <button key={`${related.kind}-${related.id}`} type="button" onClick={() => onOpenDetail(related.kind, related.id)}>
            <small>{knowledgeKindLabels[related.kind]}</small>
            <strong>{related.title}</strong>
            <span>{related.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ArchetypeEncyclopedia({
  archetype,
  onOpen,
}: {
  archetype: TestResult['primary']['archetype'];
  onOpen: (detail: KnowledgeDetail) => void;
}) {
  const { encyclopedia } = archetype;
  const portraitItems = [
    ['真正想保护', encyclopedia.portrait.coreDrive],
    ['判断方式', encyclopedia.portrait.decisionStyle],
    ['行动风格', encyclopedia.portrait.actionStyle],
    ['关系模式', encyclopedia.portrait.relationshipPattern],
    ['压力下', encyclopedia.portrait.underPressure],
    ['容易被误读为', encyclopedia.portrait.misreadAs],
    ['成长提醒', encyclopedia.portrait.growthEdge],
  ];

  return (
    <section className="encyclopedia-section">
      <div className="encyclopedia-heading">
        <p className="section-kicker">Deep Reading</p>
        <h2>{archetype.shortName}的原型百科</h2>
        <p>先读这个原型怎样判断和行动，再把哲学家、流派和阅读当作相邻思想资源。</p>
      </div>
      <div className="portrait-panel">
        <div className="portrait-panel-heading">
          <p className="section-kicker">Portrait</p>
          <h3>原型画像</h3>
        </div>
        <div className="portrait-grid">
          {portraitItems.map(([label, text]) => (
            <article className="portrait-card" key={label}>
              <span>{label}</span>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="encyclopedia-layout">
        <article className="encyclopedia-deep-dive">
          {encyclopedia.deepDive.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="practice-prompt">
            <LibraryBig size={18} />
            <span>{encyclopedia.practicePrompt}</span>
          </div>
        </article>
        <div className="knowledge-column">
          <h3>相邻思想资源 · 思想家</h3>
          <div className="knowledge-card-grid">
            {encyclopedia.philosopherIds.map((id) => {
              const card = philosopherCards[id];
              return (
                <KnowledgeCardButton
                  key={id}
                  title={card.name}
                  eyebrow={card.era}
                  description={card.summary}
                  onOpen={() => onOpen(getPhilosopherDetail(id))}
                />
              );
            })}
          </div>
          <h3>相邻思想资源 · 流派</h3>
          <div className="knowledge-card-grid">
            {encyclopedia.schoolIds.map((id) => {
              const card = schoolCards[id];
              return (
                <KnowledgeCardButton
                  key={id}
                  title={card.name}
                  eyebrow="思想流派"
                  description={card.summary}
                  onOpen={() => onOpen(getSchoolDetail(id))}
                />
              );
            })}
          </div>
          <h3>相邻思想资源 · 阅读入口</h3>
          <div className="knowledge-card-grid">
            {encyclopedia.readingIds.map((id) => {
              const card = readingCards[id];
              return (
                <KnowledgeCardButton
                  key={id}
                  title={card.title}
                  eyebrow={card.author}
                  description={card.whyRead}
                  onOpen={() => onOpen(getReadingDetail(id))}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ResultView({
  result,
  onHome,
  onOpenLibrary,
  onRestart,
}: {
  result: TestResult;
  onHome: () => void;
  onOpenLibrary: () => void;
  onRestart: () => void;
}) {
  const { archetype } = result.primary;
  const [copied, setCopied] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<KnowledgeDetail | null>(null);
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const topTraditions = getTopTraditions(result);
  const resultHeadline = getResultHeadline(result);
  const shareCard = useMemo(() => buildShareCardData(result, { personalNote }), [personalNote, result]);

  const copyResult = async () => {
    await writeClipboard(buildShareText(result, { personalNote }));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const exportShareCard = async () => {
    if (!shareCardRef.current) return;
    setIsExporting(true);
    setExportError('');
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#efe5d2',
      });
      const link = document.createElement('a');
      link.download = `philosophy-archetype-${archetype.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setExportError('图片生成失败，可以先复制文案，或稍后重试保存分享图。');
    } finally {
      setIsExporting(false);
    }
  };
  const openKnowledgeDetail = (kind: KnowledgeItemKind, id: string) => {
    const item = getKnowledgeItem(kind, id);
    if (!item) return;
    setSelectedDetail(buildLibraryDetail(item));
  };

  return (
    <main className="result-shell">
      <SiteNav current="result" onHome={onHome} onOpenLibrary={onOpenLibrary} onStart={onRestart} />
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
            <button className="quiet-action" type="button" onClick={onOpenLibrary}>
              <LibraryBig size={18} />
              继续了解
            </button>
          </div>
        </div>
        <figure className="result-image">
          <img src={archetype.image} alt={`${archetype.title}插画`} />
          <figcaption>{archetype.shortName}的思想场景 · 贴近程度：{result.primary.matchStrength.label}</figcaption>
        </figure>
      </section>

      <SharePanel
        card={shareCard}
        cardRef={shareCardRef}
        isExporting={isExporting}
        personalNote={personalNote}
        onCopy={copyResult}
        onExport={exportShareCard}
        onNoteChange={setPersonalNote}
      />
      {exportError && <p className="export-error">{exportError}</p>}

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

      <section className="reading-section">
        <article className="text-block wide">
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

      <ResultLibraryBridge archetype={archetype} onOpenDetail={openKnowledgeDetail} onOpenLibrary={onOpenLibrary} />

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
      <DetailModal detail={selectedDetail} onClose={() => setSelectedDetail(null)} onOpenRelated={(item) => openKnowledgeDetail(item.kind, item.id)} />
    </main>
  );
}

type AppStage = 'home' | 'quiz' | 'result' | 'library';

function App() {
  const [stage, setStage] = useState<AppStage>('home');
  const [libraryReturnStage, setLibraryReturnStage] = useState<'home' | 'result'>('home');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setStage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLibrary = () => {
    setLibraryReturnStage(stage === 'result' ? 'result' : 'home');
    setStage('library');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeLibrary = () => {
    setStage(libraryReturnStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => {
    if (currentIndex === orderedQuestions.length - 1) {
      setStage('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentIndex((value) => value + 1);
  };

  if (stage === 'home') return <Home onHome={goHome} onOpenLibrary={openLibrary} onStart={start} />;
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
  if (stage === 'library') {
    return (
      <LibraryView
        backLabel={libraryReturnStage === 'result' ? '返回结果' : '回到首页'}
        onBack={closeLibrary}
        onHome={goHome}
        onOpenLibrary={openLibrary}
        onStart={start}
      />
    );
  }
  return result ? (
    <ResultView result={result} onHome={goHome} onOpenLibrary={openLibrary} onRestart={start} />
  ) : (
    <Home onHome={goHome} onOpenLibrary={openLibrary} onStart={start} />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

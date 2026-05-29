import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowRight, BookOpen, Compass, Copy, RotateCcw, Sparkles } from 'lucide-react';
import { questions } from './data/questions';
import { archetypes } from './data/results';
import { calculateResult, dimensionKeys, getAnsweredCount } from './lib/scoring';
import type { Answers, DimensionKey, TestResult } from './lib/types';
import './styles.css';

const dimensionLabels: Record<DimensionKey, { left: string; right: string; name: string }> = {
  truth: { left: '经验怀疑', right: '理性建构', name: '真理如何成立' },
  meaning: { left: '荒诞自由', right: '秩序意义', name: '意义从何而来' },
  ethics: { left: '后果关怀', right: '原则义务', name: '善该如何选择' },
  society: { left: '共同体责任', right: '个体自由', name: '人应如何共处' },
};

const featuredArchetypes = [archetypes[0], archetypes[4], archetypes[7]];

function buildShareText(result: TestResult) {
  const { archetype } = result.primary;
  return [
    `我的哲学思想倾向：${archetype.title} / ${archetype.englishTitle}`,
    archetype.summary,
    `相近思想家：${archetype.philosophers.join('、')}`,
    `相关流派：${archetype.schools.join('、')}`,
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

function RadarChart({ vector }: { vector: Record<DimensionKey, number> }) {
  const points = dimensionKeys.map((key, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / dimensionKeys.length;
    const radius = 28 + vector[key] * 0.56;
    return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
  });

  return (
    <svg className="radar" viewBox="0 0 200 200" role="img" aria-label="四维思想画像">
      {[84, 56, 28].map((radius) => (
        <polygon
          key={radius}
          points={dimensionKeys
            .map((_, index) => {
              const angle = -Math.PI / 2 + (index * Math.PI * 2) / dimensionKeys.length;
              return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
            })
            .join(' ')}
          className="radar-grid"
        />
      ))}
      {dimensionKeys.map((key, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2) / dimensionKeys.length;
        return (
          <line
            key={key}
            x1="100"
            y1="100"
            x2={100 + Math.cos(angle) * 84}
            y2={100 + Math.sin(angle) * 84}
            className="radar-axis"
          />
        );
      })}
      <polygon points={points.join(' ')} className="radar-shape" />
      {points.map((point) => {
        const [cx, cy] = point.split(',');
        return <circle key={point} cx={cx} cy={cy} r="3.5" className="radar-dot" />;
      })}
    </svg>
  );
}

function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="home-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Philosophical Archetype Test</p>
          <h1>哲学思想倾向测试</h1>
          <p className="hero-lede">
            二十个处境问题，穿过认识、意义、伦理与社会四条思想轴线，生成一张更接近你的精神地图。
          </p>
          <div className="hero-meta" aria-label="测试结构">
            <span>20 道处境题</span>
            <span>4 条哲学维度</span>
            <span>8 种思想原型</span>
          </div>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={onStart}>
              <BookOpen size={18} />
              开始测试
            </button>
            <span className="micro-note">不是人格诊断，而是一份自我理解的草图。</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="showcase-title">
            <Compass size={18} />
            <span>Eight ways of reading the self</span>
          </div>
          <div className="archetype-showcase">
            {featuredArchetypes.map((archetype) => (
              <figure className="showcase-card" key={archetype.id}>
                <img src={archetype.image} alt="" />
                <figcaption>
                  <strong>{archetype.shortName}</strong>
                  <span>{archetype.englishTitle}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="dimension-orbit">
            <span>Truth</span>
            <span>Meaning</span>
            <span>Ethics</span>
            <span>Society</span>
          </div>
          <div className="lamp-glow" />
        </div>
      </section>
    </main>
  );
}

function Quiz({
  answers,
  currentIndex,
  onAnswer,
  onBack,
  onNext,
}: {
  answers: Answers;
  currentIndex: number;
  onAnswer: (questionId: string, optionId: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const question = questions[currentIndex];
  const selected = answers[question.id];
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = getAnsweredCount(questions, answers);
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <main className="quiz-shell">
      <header className="quiz-top">
        <div>
          <p className="eyebrow">{question.area}</p>
          <h1>第 {currentIndex + 1} 题</h1>
        </div>
        <span className="count-mark">{answeredCount}/{questions.length}</span>
      </header>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <section className="question-panel">
        <p className="context-line">{question.context}</p>
        <h2>{question.prompt}</h2>
        <div className="option-grid">
          {question.options.map((option) => (
            <button
              className={`option-tile ${selected === option.id ? 'selected' : ''}`}
              key={option.id}
              type="button"
              onClick={() => onAnswer(question.id, option.id)}
            >
              <span className="option-letter">{option.id.toUpperCase()}</span>
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          ))}
        </div>
      </section>
      <footer className="quiz-actions">
        <button className="quiet-action" type="button" onClick={onBack} disabled={currentIndex === 0}>
          <ArrowLeft size={18} />
          上一题
        </button>
        <button className="primary-action" type="button" onClick={onNext} disabled={!selected}>
          {isLast ? '查看结果' : '下一题'}
          <ArrowRight size={18} />
        </button>
      </footer>
    </main>
  );
}

function ResultView({ result, onRestart }: { result: TestResult; onRestart: () => void }) {
  const { archetype } = result.primary;
  const [copied, setCopied] = useState(false);

  const copyResult = async () => {
    await writeClipboard(buildShareText(result));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="result-shell">
      <section className="result-hero">
        <div className="result-copy">
          <p className="eyebrow">你的思想倾向</p>
          <h1>{archetype.title}</h1>
          <p className="english-title">{archetype.englishTitle}</p>
          <p className="result-summary">{archetype.summary}</p>
          <p className="diagnostic-note">这是一份哲学自我理解工具，不是科学人格诊断。</p>
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
          <figcaption>{archetype.shortName}的思想场景</figcaption>
        </figure>
      </section>

      <section className="reading-section">
        <article className="text-block">
          <p className="section-kicker">Insight</p>
          <h2>你如何看待世界</h2>
          <p>{archetype.insight}</p>
        </article>
        <article className="text-block accent">
          <p className="section-kicker">Gentle Warning</p>
          <h2>温和的提醒</h2>
          <p>{archetype.blindSpot}</p>
        </article>
      </section>

      <section className="profile-section">
        <div className="radar-panel">
          <p className="section-kicker">Map</p>
          <h2>四维思想画像</h2>
          <RadarChart vector={result.vector} />
        </div>
        <div className="dimension-list">
          {dimensionKeys.map((key) => (
            <div className="dimension-row" key={key}>
              <div className="dimension-label">
                <strong>{dimensionLabels[key].name}</strong>
                <span>
                  {dimensionLabels[key].left} · {dimensionLabels[key].right}
                </span>
              </div>
              <div className="bar">
                <span style={{ width: `${result.vector[key]}%` }} />
              </div>
              <b>{result.vector[key]}</b>
            </div>
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
          {result.related.map(({ archetype: related }) => (
            <div className="related-item" key={related.id}>
              <Sparkles size={16} />
              <span>{related.title}</span>
              <small>{related.englishTitle}</small>
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
  const [currentIndex, setCurrentIndex] = useState(0);

  const result = useMemo(() => {
    if (stage !== 'result') return null;
    return calculateResult(questions, archetypes, answers);
  }, [answers, stage]);

  const start = () => {
    setAnswers({});
    setCurrentIndex(0);
    setStage('quiz');
  };

  const next = () => {
    if (currentIndex === questions.length - 1) {
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
        onAnswer={(questionId, optionId) => setAnswers((current) => ({ ...current, [questionId]: optionId }))}
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

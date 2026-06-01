export type DimensionKey = 'epistemology' | 'ontology' | 'ethics' | 'politics' | 'meaning';

export type AxisDimensionKey = 'epistemology' | 'meaning';

export type TraditionDimensionKey = 'ontology' | 'ethics' | 'politics';

export type DimensionMode = 'axis' | 'tradition';

export type AxisPole = 'left' | 'right';

export type LikertValue = 1 | 2 | 3 | 4 | 5;

export type OntologyTradition = 'nature' | 'idea' | 'essence' | 'process';

export type EthicsTradition = 'consequence' | 'principle' | 'virtue' | 'care';

export type PoliticsTradition = 'liberty' | 'republic' | 'community' | 'equality';

export type TraditionKey = OntologyTradition | EthicsTradition | PoliticsTradition;

export interface TraditionDefinition {
  key: TraditionKey;
  label: string;
  traditions: string[];
}

interface BaseDimensionDefinition {
  key: DimensionKey;
  name: string;
  mode: DimensionMode;
  resultHint: string;
}

export interface AxisDimensionDefinition extends BaseDimensionDefinition {
  key: AxisDimensionKey;
  mode: 'axis';
  leftLabel: string;
  rightLabel: string;
  leftTraditions: string[];
  rightTraditions: string[];
}

export interface TraditionDimensionDefinition extends BaseDimensionDefinition {
  key: TraditionDimensionKey;
  mode: 'tradition';
  traditions: TraditionDefinition[];
}

export type DimensionDefinition = AxisDimensionDefinition | TraditionDimensionDefinition;

export interface AxisScoringSignal {
  mode: 'axis';
  pole: AxisPole;
}

export interface TraditionScoringSignal {
  mode: 'tradition';
  tradition: TraditionKey;
}

export type ScoringSignal = AxisScoringSignal | TraditionScoringSignal;

export interface AxisCalibrationSignal {
  mode: 'axis';
  leftPole: AxisPole;
  rightPole: AxisPole;
}

export interface TraditionCalibrationSignal {
  mode: 'tradition-ranking';
}

export type CalibrationScoringSignal = AxisCalibrationSignal | TraditionCalibrationSignal;

export interface RankingCalibrationOption {
  id: string;
  label: string;
  description: string;
  tradition: TraditionKey;
}

export interface AxisCalibrationQuestion {
  kind: 'calibration';
  id: string;
  dimension: AxisDimensionKey;
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  context?: string;
  scoring: AxisCalibrationSignal;
}

export interface TraditionCalibrationQuestion {
  kind: 'calibration';
  id: string;
  dimension: TraditionDimensionKey;
  prompt: string;
  context?: string;
  options: RankingCalibrationOption[];
  scoring: TraditionCalibrationSignal;
}

export type CalibrationQuestion = AxisCalibrationQuestion | TraditionCalibrationQuestion;

export interface ExperimentOption {
  id: string;
  label: string;
  benefit: string;
  cost: string;
  scoring: ScoringSignal;
}

export interface ExperimentStep {
  id: string;
  dimension: DimensionKey;
  prompt: string;
  options: ExperimentOption[];
}

export interface ThoughtExperimentQuestion {
  kind: 'experiment';
  id: string;
  title: string;
  setup: string;
  steps: ExperimentStep[];
}

export type Question = CalibrationQuestion | ThoughtExperimentQuestion;

export type AxisScores = Record<AxisDimensionKey, number>;

export type TraditionDistribution = Partial<Record<TraditionKey, number>>;

export type TraditionScores = Record<TraditionDimensionKey, TraditionDistribution>;

export type AxisSignature = Record<AxisDimensionKey, AxisPole>;

export type TraditionSignature = Record<TraditionDimensionKey, TraditionKey[]>;

export interface Archetype {
  id: string;
  title: string;
  englishTitle: string;
  shortName: string;
  axisSignature: AxisSignature;
  traditionSignature: TraditionSignature;
  image: string;
  spectrumLabels: string[];
  summary: string;
  insight: string;
  blindSpot: string;
  academicNote: string;
  pathNote: string;
  philosophers: string[];
  schools: string[];
  readingHint: string;
  encyclopedia: ArchetypeEncyclopedia;
}

export interface ArchetypeEncyclopedia {
  portrait: ArchetypePortrait;
  deepDive: string[];
  practicePrompt: string;
  philosopherIds: string[];
  schoolIds: string[];
  readingIds: string[];
}

export interface ArchetypePortrait {
  coreDrive: string;
  decisionStyle: string;
  actionStyle: string;
  relationshipPattern: string;
  underPressure: string;
  misreadAs: string;
  growthEdge: string;
}

export type AnswerValue = LikertValue | string | string[];

export type Answers = Record<string, AnswerValue>;

export type MatchStrengthLevel = 'clear' | 'leaning' | 'light' | 'mixed';

export interface MatchStrength {
  level: MatchStrengthLevel;
  label: string;
  description: string;
}

export type ProfileHighlightStrength = 'focused' | 'leaning' | 'balanced' | 'mixed';

export interface ProfileHighlight {
  dimension: DimensionKey;
  label: string;
  detail: string;
  strength: ProfileHighlightStrength;
}

export interface ScoredArchetype {
  archetype: Archetype;
  distance: number;
  matchScore: number;
  matchStrength: MatchStrength;
}

export interface ExperimentPathItem {
  experimentId: string;
  experimentTitle: string;
  stepId: string;
  dimension: DimensionKey;
  focusLabel: string;
  stepPrompt: string;
  choiceLabel: string;
  benefit: string;
  cost: string;
}

export interface TestResult {
  axisScores: AxisScores;
  traditionScores: TraditionScores;
  primary: ScoredArchetype;
  related: ScoredArchetype[];
  experimentPath: ExperimentPathItem[];
  profileHighlights: ProfileHighlight[];
  resultMode: 'archetype-led' | 'profile-led';
}

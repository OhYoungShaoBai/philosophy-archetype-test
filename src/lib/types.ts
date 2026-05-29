export type DimensionKey = 'truth' | 'meaning' | 'ethics' | 'society';

export type DimensionVector = Record<DimensionKey, number>;

export type OptionWeights = Partial<DimensionVector>;

export interface QuestionOption {
  id: string;
  label: string;
  description: string;
  weights: OptionWeights;
}

export interface Question {
  id: string;
  area: string;
  prompt: string;
  context: string;
  options: QuestionOption[];
}

export interface Archetype {
  id: string;
  title: string;
  englishTitle: string;
  shortName: string;
  vector: DimensionVector;
  image: string;
  summary: string;
  insight: string;
  blindSpot: string;
  philosophers: string[];
  schools: string[];
  readingHint: string;
}

export type Answers = Record<string, string>;

export interface ScoredArchetype {
  archetype: Archetype;
  distance: number;
}

export interface TestResult {
  vector: DimensionVector;
  primary: ScoredArchetype;
  related: ScoredArchetype[];
}

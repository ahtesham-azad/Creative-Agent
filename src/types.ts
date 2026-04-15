export type ActiveTab = 'research' | 'settings';

export interface ReferenceGame {
  id: string;
  title: string;
  url: string;
  iconUrl?: string;
}

export interface AnalysisResult {
  prompts: string[];
}

export interface ReferenceResult {
  games: ReferenceGame[];
}

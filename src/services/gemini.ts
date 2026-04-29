import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

// The list of models we will "race" to find the first available one
const MODELS = [
  'gemini-3-pro',
  'gemini-3-flash',
  'gemini-2.5-flash'
];

const getApiKey = (manualKey?: string) => {
  const key = manualKey || localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  return key?.trim() || '';
};

/**
 * Helper to attempt a request on a specific model
 */
async function fetchWithModel(model: string, apiKey: string, prompt: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Model ${model} unavailable`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Empty response from ${model}`);
  
  return text;
}

/**
 * The "Race" logic: Fires all requests and takes the fastest successful one
 */
async function raceModels(apiKey: string, prompt: string): Promise<string> {
  const attempts = MODELS.map(model => fetchWithModel(model, apiKey, prompt));
  
  // Promise.any returns the first one that succeeds. 
  // If all fail, it throws an AggregateError.
  try {
    return await Promise.any(attempts);
  } catch (err) {
    throw new Error('All Gemini models are currently busy or unavailable. Please try again in a moment.');
  }
}

export async function searchGames(genre: string, manualKey?: string): Promise<ReferenceGame[]> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing. Please check Settings.');

  const prompt = `Return ONLY a valid JSON object: {"games": [{"id": "1", "title": "Game Name"}]} for the genre: "${genre}"`;

  const text = await raceModels(apiKey, prompt);
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as ReferenceResult;
    return parsed.games.map((game) => ({
      ...game,
      url: `https://play.google.com/store/search?q=${encodeURIComponent(game.title)}&c=apps`,
    }));
  } catch (err) {
    throw new Error('Could not parse game list. The AI returned an invalid format.');
  }
}

export async function generateDNALockedPrompts(
  keyword: string,
  games: ReferenceGame[],
  manualKey?: string
): Promise<AnalysisResult> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing.');

  const gamesList = games.map((g, i) => `${i + 1}. ${g.title}`).join('\n');
  const prompt = `References:\n${gamesList}\nGenerate 10 stylized 3D prompts for "${keyword}". Return ONLY JSON: {"prompts": ["p1", ...]}`;

  const text = await raceModels(apiKey, prompt);
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error('Failed to parse DNA-Locked prompts.');
  }
}
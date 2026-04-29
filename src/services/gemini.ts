import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

// Verified stable models as of April 2026
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

const getApiKey = (manualKey?: string) => {
  return manualKey || localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

async function fetchWithModel(model: string, apiKey: string, prompt: string, temperature = 0.1): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 1024 }
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`[${response.status}] ${error.error?.message || `Model ${model} unavailable`}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from model');
  return text;
}

async function getAIResponse(apiKey: string, prompt: string, temperature = 0.1): Promise<string> {
  const errors: string[] = [];
  for (const model of MODELS) {
    try {
      return await fetchWithModel(model, apiKey, prompt, temperature);
    } catch (e: any) {
      console.warn(`Model ${model} failed:`, e.message);
      errors.push(`${model}: ${e.message}`);
    }
  }
  throw new Error(`All models failed.\n${errors.join('\n')}`);
}

export async function searchGames(genre: string, manualKey?: string): Promise<ReferenceGame[]> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing. Enter it in Settings.');

  const prompt = `Return ONLY a valid JSON object with EXACTLY 10 games for the genre "${genre}":
{"games": [{"id": "1", "title": "Game Name"}, ...]}
No markdown, no explanation. JSON only.`;

  const text = await getAIResponse(apiKey, prompt, 0.1);

  try {
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as ReferenceResult;
    return parsed.games.map((game) => ({
      ...game,
      url: `https://play.google.com/store/search?q=${encodeURIComponent(game.title)}&c=apps`,
    }));
  } catch {
    throw new Error('Failed to parse game list. Please try again.');
  }
}

export async function generateDNALockedPrompts(
  keyword: string,
  games: ReferenceGame[],
  manualKey?: string
): Promise<AnalysisResult> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing.');

  await new Promise(resolve => setTimeout(resolve, 1500));

  const gameTitles = games.map(g => g.title).join(', ');

  const prompt = `Act as a Senior 3D Game Artist and ASO expert.
Task: Generate 10 DNA-Locked prompts for the keyword "${keyword}".
Style References: ${gameTitles}.

Requirements:
1. Use technical terms (UE5, Octane Render, Raytraced, PBR textures, 8k).
2. Maintain a "stylized semi-realistic" aesthetic.
3. Include lighting descriptions (Cinematic, Rim Lighting, Volumetric).

Return ONLY a JSON object, no markdown:
{"prompts": ["prompt 1...", "prompt 2...", ..., "prompt 10..."]}`;

  const text = await getAIResponse(apiKey, prompt, 0.8);

  try {
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error('The AI returned an invalid format. Please try again.');
  }
}
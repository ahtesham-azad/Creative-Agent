import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

// Using the absolute standard model identifier for v1 stability
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

const getApiKey = (manualKey?: string) => {
  return manualKey || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
};

const STYLE_LOCK_PROMPT = `
STRICT STYLE RULES:
1. PREFIX: Every prompt MUST start with "[3D Mobile Game Render]".
2. FOOTER: Every prompt MUST end with "Rendered in a 3D engine style, absolutely no photorealism, game asset aesthetic only."
3. VISUALS: Use "semi-realism", "Smooth high-poly assets", "Baked volumetric lighting", and "High-fidelity CGI".
4. FORBIDDEN: Do not use "photorealism", "8k photography", "real-life grain", "biological textures", or "camera noise".
`;

export async function searchGames(genre: string, manualKey?: string): Promise<ReferenceGame[]> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing.');

  const prompt = `Return ONLY a valid JSON object of the top 10 successful Google Play Store games for: "${genre}". 
  Format: {"games": [{"id": "1", "title": "Game Name"}]}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5 }
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(`Google API Error: ${errorJson.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as ReferenceResult;
    return parsed.games.map((game) => ({
      ...game,
      url: `https://play.google.com/store/search?q=${encodeURIComponent(game.title)}&c=apps`,
    }));
  } catch (err) {
    throw new Error('Failed to parse reference games list.');
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
  const prompt = `Analyze: ${gamesList}\nGenerate 10 screenshot prompts for a "${keyword}" game.\n${STYLE_LOCK_PROMPT}\nReturn ONLY JSON: {"prompts": ["prompt1", ...]}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 }
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(`Generation Error: ${errorJson.error?.message || 'Check API limits'}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error('Failed to parse prompts.');
  }
}
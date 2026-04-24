import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

// Using stable v1 endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

const getApiKey = (manualKey?: string) => {
  return manualKey || import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
};

// Helper to clean JSON strings from AI responses
const cleanJson = (text: string) => {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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

  const prompt = `Identify the top 10 most successful Google Play Store games for the genre: "${genre}". 
  Return ONLY a valid JSON object: {"games": [{"id": "unique-id", "title": "Exact Game Name"}]}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // REMOVED responseMimeType to fix "Unknown name" error
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
    const parsed = JSON.parse(cleanJson(text)) as ReferenceResult;
    return parsed.games.map((game) => ({
      ...game,
      url: `https://play.google.com/store/search?q=${encodeURIComponent(game.title)}&c=apps`,
    }));
  } catch (err) {
    throw new Error('Failed to parse games list. Please try searching again.');
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
  const prompt = `Analyze these games: ${gamesList}\nGenerate 10 prompts for a "${keyword}" game.\n${STYLE_LOCK_PROMPT}\nReturn ONLY JSON: {"prompts": ["prompt1", ...]}`;

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
    return JSON.parse(cleanJson(text)) as AnalysisResult;
  } catch {
    throw new Error('Failed to parse DNA-Locked prompts.');
  }
}
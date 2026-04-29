import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

// April 2026 Update: Use the stable v1 endpoint and gemini-2.5-flash
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

const getApiKey = (manualKey?: string) => {
  // Check order: Passed directly > Browser Storage > Vercel Environment Variable
  const key = manualKey || localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  return key?.trim() || '';
};

export async function searchGames(genre: string, manualKey?: string): Promise<ReferenceGame[]> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing. Please add it to Settings.');

  const prompt = `Return ONLY a valid JSON object listing 10 top Google Play games for: "${genre}". 
  Format: {"games": [{"id": "1", "title": "Game Name"}]}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json();
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
    throw new Error('Failed to parse response. Please try again.');
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
  const prompt = `Generate 10 stylized 3D game art prompts for "${keyword}" based on these competitors:\n${gamesList}\nReturn ONLY JSON: {"prompts": ["prompt1", ...]}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    }),
  });

  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(`Generation Error: ${errorJson.error?.message || 'Error'}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error('Failed to parse DNA-Locked prompts.');
  }
}
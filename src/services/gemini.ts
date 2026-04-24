import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Helper to get key from Vercel Environment or User Input
const getApiKey = (manualKey?: string) => {
  // Checks Vercel secret first, then manual input, then local storage
  return import.meta.env.VITE_GEMINI_API_KEY || manualKey || localStorage.getItem('gemini_api_key') || '';
};

const STYLE_LOCK_PROMPT = `
STRICT STYLE RULES:
1. PREFIX: Every prompt MUST start with "[3D Mobile Game Render]".
2. FOOTER: Every prompt MUST end with "Rendered in a 3D engine style, absolutely no photorealism, game asset aesthetic only."
3. VISUALS: Use "semi-realism", "Smooth high-poly assets", "Baked volumetric lighting", and "High-fidelity CGI".
4. FORBIDDEN: Do not use "photorealism", "8k photography", "real-life grain", "biological textures", or "camera noise".
`;

// STEP 1: Search for Games
export async function searchGames(genre: string, manualKey?: string): Promise<ReferenceGame[]> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing. Please add it to Vercel or Settings.');

  const prompt = `Identify the top 10 most successful Google Play Store games for the genre/keyword: "${genre}". 
  Return ONLY a valid JSON object: {"games": [{"id": "unique-id", "title": "Exact Game Name"}]}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.5, // Lower temperature for more factual game names
        responseMimeType: 'application/json' 
      }
    }),
  });

  if (!response.ok) throw new Error('Failed to fetch reference games. Check your API Key.');

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as ReferenceResult;

    return parsed.games.map((game) => ({
      ...game,
      // Fixed URL logic to prevent 404s
      url: `https://play.google.com/store/search?q=${encodeURIComponent(game.title)}&c=apps`,
    }));
  } catch {
    throw new Error('Failed to parse reference games list.');
  }
}

// STEP 2: Generate DNA-Locked Prompts
export async function generateDNALockedPrompts(
  keyword: string,
  games: ReferenceGame[],
  manualKey?: string
): Promise<AnalysisResult> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing.');

  const gamesList = games.map((g, i) => `${i + 1}. ${g.title}`).join('\n');

  const prompt = `
    You are a professional 3D Art Director for mobile game marketing.
    
    REFERENCE GAMES TO ANALYZE:
    ${gamesList}

    TASK:
    Generate 10 highly detailed ASO screenshot prompts for a new "${keyword}" game.
    
    ${STYLE_LOCK_PROMPT}

    DNA LOCK RULES:
    - Environment: Stick 100% to the setting (e.g., city, desert, garage) found in the references.
    - Lighting: Match the color palette and time of day from the reference games.
    - Complexity: Each prompt must be 70-90 words long, describing a specific "hook" shot for the Play Store.

    Return ONLY a valid JSON object: {"prompts": ["prompt1", "prompt2", ...]}
  `;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.8, 
        responseMimeType: 'application/json' 
      }
    }),
  });

  if (!response.ok) throw new Error('AI Generation failed. Your API key might be rate-limited.');

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new Error('Failed to parse DNA-Locked prompts. Please try again.');
  }
}
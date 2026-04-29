import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

/**
 * 2026 Model Update:
 * Gemini 1.5 is now shut down. We must use the 3.1 Flash series.
 * 'gemini-3.1-flash' is the fastest for free-tier users.
 */
const MODELS = ['gemini-3.1-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

const getApiKey = (manualKey?: string) => {
  // Vite projects require the VITE_ prefix for environment variables
  return manualKey || localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

async function fetchWithModel(model: string, apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.1, // Keep low for stable JSON
        maxOutputTokens: 1024
      }
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Model ${model} unavailable`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response");
  return text;
}

/**
 * Tries the models in sequence until one works. 
 * This bypasses the "High Demand" lockout on the primary Flash model.
 */
async function getAIResponse(apiKey: string, prompt: string): Promise<string> {
  for (const model of MODELS) {
    try {
      return await fetchWithModel(model, apiKey, prompt);
    } catch (e) {
      console.warn(`Model ${model} busy, trying next...`);
      continue;
    }
  }
  throw new Error('Google servers are at peak capacity. Please wait 10 seconds.');
}

export async function searchGames(genre: string, manualKey?: string): Promise<ReferenceGame[]> {
  const apiKey = getApiKey(manualKey);
  if (!apiKey) throw new Error('API Key missing. Enter it in Settings.');

  const prompt = `Return ONLY a valid JSON object with EXACTLY 10 games: {"games": [{"id": "1", "title": "Game Name"}]} for the genre: "${genre}"`;
  
  const text = await getAIResponse(apiKey, prompt);
  
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

  // CRITICAL: We wait 1.5 seconds here. 
  // This prevents the "High Demand" error by spacing out the Search and Build calls.
  await new Promise(resolve => setTimeout(resolve, 1500));

  const gameTitles = games.map(g => g.title).join(', ');
  
  // This prompt forces the AI to act as a Senior 3D Game Artist
  const prompt = `Act as a Senior 3D Game Artist and ASO expert. 
  Task: Generate 10 DNA-Locked prompts for the keyword "${keyword}".
  Style References: ${gameTitles}.
  
  Requirements:
  1. Use technical terms (UE5, Octane Render, Raytraced, PBR textures, 8k).
  2. Maintain a "stylized semi-realistic" aesthetic.
  3. Include lighting descriptions (Cinematic, Rim Lighting, Volumetric).
  
  Return ONLY a JSON object:
  {"prompts": ["prompt 1...", "prompt 2...", "prompt 10..."]}`;

  // We use the most stable 2026 model for complex prompt generation
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8 } // Higher temperature for more creative/unique prompts
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    // If we still hit a limit, we give a clear instruction to the user
    if (response.status === 429 || response.status === 503) {
      throw new Error("Google is busy. Please wait 5 seconds and click 'Build' again.");
    }
    throw new Error(err.error?.message || 'Failed to generate prompts.');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  try {
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned) as AnalysisResult;
  } catch (err) {
    throw new Error('The AI returned an invalid format. Please try again.');
  }
}
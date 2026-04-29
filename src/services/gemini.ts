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
  if (!apiKey) throw new Error('API Key missing.');

  // Using gemini-2.5-flash on the stable v1 endpoint as seen in your logs
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const prompt = `Return a JSON object containing a list of 10 popular Google Play games for the genre: "${genre}". 
  The response MUST be valid JSON in this exact format:
  {
    "games": [
      {"id": "1", "title": "Exact Game Name"},
      {"id": "2", "title": "Exact Game Name"}
    ]
  }
  Do not include any text before or after the JSON.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // Force the model to be more predictable
      generationConfig: { 
        temperature: 0.1,
        topP: 0.1
      }
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Server is overloaded. Try again in 5 seconds.');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  // DEBUG: Look at your browser console (F12) to see this output!
  console.log("Raw AI Response:", text);

  try {
    // Aggressive cleaning to handle markdown code blocks
    const cleaned = text.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as ReferenceResult;
    
    if (!parsed.games || parsed.games.length === 0) {
       throw new Error("AI returned an empty list.");
    }

    return parsed.games.map((game) => ({
      id: game.id,
      title: game.title,
      // Fixed URL builder to ensure the link works
      url: `https://play.google.com/store/search?q=${encodeURIComponent(game.title)}&c=apps`,
    }));
  } catch (err) {
    console.error("JSON Parsing Error:", err);
    throw new Error('The AI gave a messy response. Please click Search again.');
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
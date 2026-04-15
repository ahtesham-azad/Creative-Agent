import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const STYLE_LOCK_PROMPT = `
Strictly follow these 'Mobile Game Engine' style rules for all 10 prompts:
- FORMAT: [3D Mobile Game Render] + [Perspective] + [Action/Subject] + [Environment] + [Lighting] + [UI Overlay]
- STYLE KEYWORDS: "Stylized semi-realism", "Unreal Engine 5 mobile render", "Unity 3D engine style", "Smooth high-poly assets", "Clean anti-aliased edges", "Game marketing splash art".
- LIGHTING: "Baked volumetric lighting", "High-contrast rim lighting", "Saturated colors", "Global illumination".
- NEGATIVE STYLE (FORBIDDEN): No "photorealism", "8k photography", "real-life grain", "camera noise", or "biological textures".
- ASSET DESCRIPTION: Describe characters as "3D character models" and environments as "level environments" to force a digital look.

CRITICAL: Every single prompt MUST emphasize that this is a 3D mobile game engine render, NOT real life or photography.`;

const PROMPT_ENGINEERING_RULES = `
MANDATORY RULES FOR PROMPT GENERATION:
1. MANDATORY FOOTER: Every prompt MUST end with: "Rendered in a 3D engine style, absolutely no photorealism, game asset aesthetic only."
2. STYLE DNA: Focus on "Semi-realistic 3D game marketing art."
   - Texture: Smooth, high-poly, clean anti-aliasing.
   - Lighting: Baked volumetric lighting, high-contrast rim light.
3. FIDELITY OVERRIDE:
   - NO "Photorealistic", "8k", or "Real life".
   - NO "Cartoonish", "2D", or "Cell-shaded".
4. CONTEXT LOCK: Stick 100% to the reference games provided.
   - If the reference is 'Modern Garage', do NOT add 'Neon Streets'.
   - If the reference is 'Desert Sniper', do NOT add 'Rainy Weather'.
   - Do not add random weather unless the reference games explicitly feature it.
   - Do not add neon cities unless the reference aesthetic demands it.
5. ENVIRONMENT CONSISTENCY: Match the exact environment tone and era of your reference games.
6. NO RANDOM ADDITIONS: Every visual element must be traceable to a pattern found in the reference games.`;

export async function analyzeGenre(genre: string, apiKey: string): Promise<AnalysisResult> {
  const prompt = `You are an expert mobile game App Store Optimization (ASO) strategist and 3D art director specializing in Google Play Store screenshots for games.

A developer wants to create high-converting 3D game screenshots for a "${genre}" game.

${STYLE_LOCK_PROMPT}

Your task:
1. Mentally simulate research of the top 10 Play Store games in the "${genre}" genre
2. Identify the dominant visual patterns:
   - Common color palettes and lighting moods
   - Camera angles and composition styles (isometric, over-the-shoulder, first-person, cinematic, etc.)
   - UI overlay styles (minimal HUD, dramatic action text, score displays, etc.)
   - Key gameplay elements and environmental themes
3. Based on these patterns, generate 10 distinct "Master Blueprint" prompts for high-quality 3D renders that would stand out on the Play Store

Each prompt must be:
- Highly detailed (50-80 words)
- Specify: scene composition, camera angle, lighting style, color palette, mood, key visual elements, and render quality
- Designed for a 9:16 portrait screenshot (1080x1920px)
- Optimized to maximize downloads through visual appeal and genre conventions
- MUST include game engine style keywords and FORBIDDEN the photorealistic negative styles

Return ONLY a valid JSON object in this exact format:
{"prompts": ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5", "prompt6", "prompt7", "prompt8", "prompt9", "prompt10"]}

No markdown, no code blocks, no additional text. Just the raw JSON.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || `API Error: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from Gemini API');
  }

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
      throw new Error('Invalid response format');
    }
    return parsed;
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

export async function fetchReferenceGames(genre: string, apiKey: string): Promise<ReferenceGame[]> {
  const prompt = `You are an expert mobile game researcher. Your task is to identify the top 10 Play Store games in the "${genre}" genre.

For each game, provide:
1. Official game title (exact name as it appears on Play Store)

You MUST return a valid JSON object in this exact format:
{"games": [{"id": "game1", "title": "Game Title"}, ...]}

Provide exactly 10 games. No markdown, no code blocks, just raw JSON.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || `API Error: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from Gemini API');
  }

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as ReferenceResult;
    if (!parsed.games || !Array.isArray(parsed.games)) {
      throw new Error('Invalid response format');
    }
    return parsed.games.map((game) => ({
      ...game,
      url: `https://play.google.com/store/search?q=${encodeURIComponent(game.title)}&c=apps`,
    }));
  } catch {
    throw new Error('Failed to parse reference games. Please try again.');
  }
}

export async function analyzeWithReferences(genre: string, games: ReferenceGame[], apiKey: string): Promise<AnalysisResult> {
  const gamesList = games.map((g, i) => `${i + 1}. ${g.title}: ${g.url}`).join('\n');

  const prompt = `You are an expert mobile game App Store Optimization (ASO) strategist and 3D art director specializing in Google Play Store screenshots for games.

A developer wants to create high-converting 3D game screenshots for a "${genre}" game.

Reference Games Analyzed:
${gamesList}

${STYLE_LOCK_PROMPT}

Your task:
1. Analyze the visual patterns from these reference games:
   - Common color palettes and lighting moods
   - Camera angles and composition styles (isometric, over-the-shoulder, first-person, cinematic, etc.)
   - UI overlay styles (minimal HUD, dramatic action text, score displays, etc.)
   - Key gameplay elements and environmental themes
2. Based on these patterns, generate 10 distinct "Master Blueprint" prompts for high-quality 3D renders that would stand out on the Play Store

Each prompt must be:
- Highly detailed (50-80 words)
- Specify: scene composition, camera angle, lighting style, color palette, mood, key visual elements, and render quality
- Designed for a 9:16 portrait screenshot (1080x1920px)
- Optimized to maximize downloads through visual appeal and genre conventions
- MUST include game engine style keywords and FORBIDDEN the photorealistic negative styles

Return ONLY a valid JSON object in this exact format:
{"prompts": ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5", "prompt6", "prompt7", "prompt8", "prompt9", "prompt10"]}

No markdown, no code blocks, no additional text. Just the raw JSON.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || `API Error: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from Gemini API');
  }

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
      throw new Error('Invalid response format');
    }
    return parsed;
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

export async function generateDNALockedPrompts(
  keyword: string,
  games: ReferenceGame[],
  apiKey: string
): Promise<AnalysisResult> {
  const gamesList = games.map((g, i) => `${i + 1}. ${g.title}: ${g.url}`).join('\n');

  const prompt = `You are an expert mobile game App Store Optimization (ASO) strategist and 3D art director specializing in Google Play Store screenshots for games.

PHASE 2: DNA-LOCKED GENERATION
Your task is to analyze the EXACT visual DNA from the provided reference games and generate 10 ASO-optimized screenshot prompts that stick 100% to their aesthetic.

Keyword/Genre: ${keyword}

REFERENCE GAMES TO ANALYZE (You MUST examine these games):
${gamesList}

${PROMPT_ENGINEERING_RULES}

${STYLE_LOCK_PROMPT}

CRITICAL INSTRUCTIONS:
1. Analyze each reference game link to extract their exact visual patterns.
2. Generate 10 prompts that are VARIATIONS of the reference aesthetic, not random interpretations.
3. CONTEXT LOCK: Do not add weather, environments, or visual elements not present in the references.
   - If references are desert-based, do NOT add rain or neon cities.
   - If references are modern/urban, do NOT add fantasy elements unless present in references.
   - If references are industrial, maintain that industrial tone throughout.
4. Every prompt MUST include the mandatory footer.
5. Each prompt should be highly detailed (60-80 words) and optimized for Play Store conversion.

Return ONLY a valid JSON object:
{"prompts": ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5", "prompt6", "prompt7", "prompt8", "prompt9", "prompt10"]}

No markdown, no code blocks. Just raw JSON.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = (errorData as { error?: { message?: string } })?.error?.message || `API Error: ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response from Gemini API');
  }

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    if (!parsed.prompts || !Array.isArray(parsed.prompts)) {
      throw new Error('Invalid response format');
    }
    return parsed;
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

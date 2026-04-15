import { AnalysisResult, ReferenceGame } from '../types';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const PROMPT_ENGINEERING_RULES = `
MANDATORY STYLE CONSTRAINTS:
1. PREFIX & FOOTER: Every single prompt MUST start with "[3D Mobile Game Render]" and MUST end with "Rendered in a 3D engine style, absolutely no photorealism, game asset aesthetic only."
2. THE "PREMIUM CGI" SWEET SPOT: 
   - AVOID PHOTOREALISM: No realistic skin pores, no camera grain, no 8k photography style.
   - AVOID CARTOON/TOONISH: No 2D cel-shading, no thick black outlines, no "kiddy" proportions.
   - TARGET: High-fidelity 3D CGI (like Unity/Unreal marketing art). Smooth high-poly models, clean edges, and vibrant "baked" lighting.
3. CONTEXT LOCK: Do not add random weather (rain/fog) or environments (neon/cyberpunk) unless they are clearly visible in the reference games provided.
4. ASSET LOGIC: Describe characters as "3D character assets" and cars as "high-poly vehicle models" to ensure the AI creates game objects, not real objects.`;

const STYLE_LOCK_PROMPT = `
Strictly follow these 'Mobile Game Engine' rules:
- PERSPECTIVE: Focus on dynamic game-camera angles (First-person, Third-person chase, or Cinematic isometric).
- LIGHTING: Use "High-contrast rim lighting," "Global illumination," and "Saturated color grading."
- SURFACE: Describe surfaces as "Clean, optimized shaders" and "Anti-aliased edges."
- FORBIDDEN: Words like "Photorealistic," "Hyper-realistic," "Real life," "F-stop," or "Photography."`;

export async function generateDNALockedPrompts(
  keyword: string,
  games: ReferenceGame[],
  apiKey: string
): Promise<AnalysisResult> {
  // We use the search links to define the "Boundaries" for the AI
  const gamesList = games
    .map((g, i) => `${i + 1}. ${g.title} (Style Reference: ${g.url})`)
    .join('\n');

  const prompt = `You are a professional 3D Art Director for mobile game marketing.

PHASE 2: DNA-LOCKED GENERATION
Analyze the visual DNA of the following top-ranking games for the keyword "${keyword}". 

REFERENCE GAMES:
${gamesList}

INSTRUCTIONS:
1. Extract the environment, lighting, and "mood" from these references.
2. Generate 10 unique prompts that stick 100% to this DNA.
3. If the references are "Industrial Parking," every prompt must be "Industrial Parking." 

${PROMPT_ENGINEERING_RULES}

${STYLE_LOCK_PROMPT}

Output ONLY valid JSON:
{"prompts": ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5", "prompt6", "prompt7", "prompt8", "prompt9", "prompt10"]}

Each prompt should be 70-90 words long, highly descriptive, and follow the [Prefix] and [Footer] rules perfectly.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7, // Lowered slightly for better rule adherence
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (errorData as any)?.error?.message || `API Error: ${response.status}`;
    throw new Error(message);
  }

  const data = (await response.json()) as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('No response from Gemini API');

  try {
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    return parsed;
  } catch {
    throw new Error('Failed to parse AI response. Try again.');
  }
}

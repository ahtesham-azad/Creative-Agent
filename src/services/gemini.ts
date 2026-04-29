import { AnalysisResult, ReferenceResult, ReferenceGame } from '../types';

// USE v1beta for better compatibility with manual keys and "flash" models
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const getApiKey = (manualKey?: string) => {
  // Check order: 
  // 1. Key passed directly from the UI
  // 2. Key stored in localStorage (from SettingsTab)
  // 3. Fallback to Vercel environment variable
  const key = manualKey || localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
  return key?.trim() || '';
};

// ... keep your existing searchGames and generateDNALockedPrompts functions below
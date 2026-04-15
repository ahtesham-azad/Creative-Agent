import { useState } from 'react';
import {
  Search,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Loader2,
  ChevronRight,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { fetchReferenceGames } from '../services/gemini';
import { generateDNALockedPrompts } from '../services/dnaLocked';
import { PromptCard } from './PromptCard';
import { ReferencesDrawer } from './ReferencesDrawer';
import { ReferenceGame } from '../types';

interface ResearchTabProps {
  apiKey: string;
  onGoToSettings: () => void;
}

export function ResearchTab({ apiKey, onGoToSettings }: ResearchTabProps) {
  const [keyword, setKeyword] = useState('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [referenceGames, setReferenceGames] = useState<ReferenceGame[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'phase1' | 'phase2'>('phase1');

  const handleFetchReferences = async () => {
    if (!apiKey) {
      setError('Please add your Gemini API key in Settings first.');
      return;
    }
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setPrompts([]);
    setReferenceGames([]);

    try {
      const games = await fetchReferenceGames(keyword.trim(), apiKey);
      setReferenceGames(games);
      setPhase('phase1');
      setDrawerOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = (id: string) => {
    setReferenceGames(referenceGames.filter((g) => g.id !== id));
  };

  const handleAddGame = (title: string, url: string) => {
    const newGame: ReferenceGame = {
      id: `custom-${Date.now()}`,
      title,
      url,
    };
    setReferenceGames([...referenceGames, newGame]);
  };

  const handleConfirmStyles = async () => {
    if (phase === 'phase1') {
      setPhase('phase2');
    } else {
      if (referenceGames.length === 0) {
        setError('Please add at least one reference game');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await generateDNALockedPrompts(keyword.trim(), referenceGames, apiKey);
        setPrompts(result.prompts);
        setDrawerOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGenerate = () => {
    prompts.forEach((prompt) => {
      const encoded = encodeURIComponent(prompt);
      window.open(`https://gemini.google.com/app?q=${encoded}`, '_blank');
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && prompts.length === 0) {
      handleFetchReferences();
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Genre Research</h2>
          <p className="text-slate-400">
            Enter a game genre to find reference games and generate ASO-optimized 3D screenshot prompts.
          </p>
        </div>

        {prompts.length === 0 && (
          <>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Battle Royale, Tower Defense, Racing, RPG, Idle Clicker..."
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-12 pr-36 py-4 text-white placeholder-slate-600 text-base focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
              />
              <button
                onClick={handleFetchReferences}
                disabled={loading || !keyword.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-semibold text-sm rounded-lg transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Fetching
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Find References
                  </>
                )}
              </button>
            </div>

            {!apiKey && (
              <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-amber-300 text-sm flex-1">No API key configured.</p>
                <button
                  onClick={onGoToSettings}
                  className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Add Key <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {error && (
              <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400/60 hover:text-red-300 transition-colors text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-slate-700"></div>
                  <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-medium">Finding top {keyword} games...</p>
                  <p className="text-slate-500 text-sm mt-1">Researching Play Store data</p>
                </div>
              </div>
            )}

            {!loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                  <Search className="w-7 h-7 text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Enter a genre to get started</p>
                  <p className="text-slate-600 text-sm mt-1 max-w-xs">
                    Find reference games and generate optimized screenshot prompts.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {['Battle Royale', 'Tower Defense', 'Idle RPG', 'Racing', 'Puzzle', 'MOBA'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setKeyword(g)}
                      className="text-xs text-slate-500 hover:text-cyan-400 bg-slate-800/60 hover:border-cyan-500/30 border border-slate-700/50 px-3 py-1.5 rounded-full transition-all duration-150"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {prompts.length > 0 && (
          <div className="pb-32">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="text-slate-300 font-semibold">Master Blueprints</span>
                <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {prompts.length} Prompts
                </span>
              </div>
              <button
                onClick={() => {
                  setPrompts([]);
                  setKeyword('');
                  setReferenceGames([]);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Search
              </button>
            </div>

            <div className="space-y-3">
              {prompts.map((prompt, i) => (
                <PromptCard key={i} index={i + 1} prompt={prompt} />
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900/98 to-transparent pt-6 pb-6">
              <div className="max-w-3xl mx-auto px-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-3 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-300 text-xs leading-relaxed">
                    Allow popups in your browser to generate all images at once. Each prompt will open in a new tab.
                  </p>
                </div>

                <button
                  onClick={handleGenerate}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-base rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate All Images
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ReferencesDrawer
        isOpen={drawerOpen}
        games={referenceGames}
        onClose={() => setDrawerOpen(false)}
        onDeleteGame={handleDeleteGame}
        onAddGame={handleAddGame}
        onConfirmStyles={handleConfirmStyles}
        isLoading={loading}
        phase={phase}
      />
    </>
  );
}

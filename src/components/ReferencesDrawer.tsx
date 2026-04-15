import { useState } from 'react';
import { Trash2, ExternalLink, Zap, X } from 'lucide-react';
import { ReferenceGame } from '../types';

interface ReferencesDrawerProps {
  isOpen: boolean;
  games: ReferenceGame[];
  onClose: () => void;
  onDeleteGame: (id: string) => void;
  onAddGame: (title: string, url: string) => void;
  onConfirmStyles: () => void;
  isLoading: boolean;
  phase: 'phase1' | 'phase2';
}

export function ReferencesDrawer({
  isOpen,
  games,
  onClose,
  onDeleteGame,
  onAddGame,
  onConfirmStyles,
  isLoading,
  phase,
}: ReferencesDrawerProps) {
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddCustomLink = () => {
    if (!customUrl.trim()) {
      setError('Please enter a Play Store URL');
      return;
    }
    if (!customUrl.includes('play.google.com')) {
      setError('URL must be a valid Play Store link');
      return;
    }

    const urlObj = new URL(customUrl.trim());
    let gameTitle = 'Custom Game';

    if (urlObj.searchParams.has('id')) {
      gameTitle = urlObj.searchParams.get('id') || gameTitle;
    } else if (urlObj.searchParams.has('q')) {
      gameTitle = urlObj.searchParams.get('q') || gameTitle;
    }

    onAddGame(gameTitle, customUrl.trim());
    setCustomUrl('');
    setError(null);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-slate-900 border-l border-slate-700/50 flex flex-col z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/40">
          <div>
            <h2 className="text-base font-bold text-white">Reference Games</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {phase === 'phase1' ? 'Phase 1: Research & Verify' : 'Phase 2: DNA Lock'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {phase === 'phase1' && (
          <div className="px-4 pt-4 pb-3 border-b border-slate-700/30">
            <label className="text-xs font-semibold text-slate-300 mb-2 block">Add Custom Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste Play Store URL"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
              />
              <button
                onClick={handleAddCustomLink}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-md text-slate-300 hover:text-white text-xs font-medium transition-all"
              >
                Add
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-lg bg-slate-800/50 flex items-center justify-center mb-2">
                <ExternalLink className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-slate-500 text-xs">No games added yet</p>
            </div>
          ) : (
            games.map((game, idx) => (
              <div
                key={game.id}
                className="group bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 hover:bg-slate-800/70 transition-all"
              >
                <div className="flex items-start gap-2 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}</span>
                      <p className="text-sm font-semibold text-white truncate">{game.title}</p>
                    </div>
                  </div>
                  {phase === 'phase1' && (
                    <button
                      onClick={() => onDeleteGame(game.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-medium py-1.5 rounded-md transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Check Store
                </a>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-800/20 space-y-3">
          {phase === 'phase2' && games.length > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-cyan-300">
                {games.length} game reference{games.length !== 1 ? 's' : ''} ready for DNA-locked generation.
              </p>
            </div>
          )}

          <button
            onClick={onConfirmStyles}
            disabled={games.length === 0 || isLoading}
            className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 inline-flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : games.length === 0
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
                {phase === 'phase1' ? 'Analyzing...' : 'Generating...'}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                {phase === 'phase1' ? 'Confirm Styles' : 'Generate Prompts'}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

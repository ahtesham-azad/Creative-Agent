import { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, ExternalLink } from 'lucide-react';

interface SettingsTabProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export function SettingsTab({ apiKey, onApiKeyChange }: SettingsTabProps) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onApiKeyChange(inputValue.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <p className="text-slate-400">Configure your AI credentials to power the screenshot agent.</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-cyan-400" />
            <label className="text-sm font-semibold text-slate-200">Google Gemini API Key</label>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Your API key is stored locally in your browser and never sent to any server other than Google's API.
          </p>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Get a free API key from Google AI Studio
          </a>

          <button
            onClick={handleSave}
            disabled={!inputValue.trim()}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              saved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save Key'
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 bg-slate-800/30 border border-slate-700/30 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">How it works</h3>
        <ol className="space-y-2.5 text-sm text-slate-400">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
            Enter your Gemini API key above and save it.
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
            Go to the Research tab and type your game genre.
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">3</span>
            Click Analyze — the AI simulates Play Store research and generates 10 blueprint prompts.
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">4</span>
            Click Generate to open all 10 prompts in Gemini image tabs simultaneously.
          </li>
        </ol>
      </div>
    </div>
  );
}

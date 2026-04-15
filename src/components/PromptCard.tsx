import { useState } from 'react';
import { Copy, Check, Eye } from 'lucide-react';

interface PromptCardProps {
  index: number;
  prompt: string;
}

export function PromptCard({ index, prompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/20 hover:bg-slate-800/60 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mt-0.5">
          <span className="text-cyan-400 text-xs font-bold">{index}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{prompt}</p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1.5">
          <button
            onClick={() => setShowPreview(!showPreview)}
            title="Preview prompt"
            className="w-7 h-7 rounded-md bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-amber-400 hover:border-amber-500/30 hover:bg-amber-500/10 flex items-center justify-center transition-all duration-200"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copy prompt"
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 ${
              copied
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                : 'bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/10'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="mt-3 p-3 bg-slate-900/50 border border-slate-700/30 rounded-md">
          <p className="text-xs text-slate-400 mb-2 font-semibold">Full Preview:</p>
          <p className="text-xs text-slate-300 leading-relaxed">{prompt}</p>
        </div>
      )}
    </div>
  );
}

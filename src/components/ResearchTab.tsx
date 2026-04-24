import React, { useState } from 'react';
import { Search, Trash2, Copy, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import { searchGames, generateDNALockedPrompts } from '../services/gemini';
import { ReferenceGame, AnalysisResult } from '../types';
import { PromptCard } from './PromptCard';


export default function ResearchTab() {
  const [keyword, setKeyword] = useState('');
  const [references, setReferences] = useState<ReferenceGame[]>([]);
  const [prompts, setPrompts] = useState<{ id: string; text: string }[]>([]);
  const [loading, setLoading] = useState({ search: false, generating: false });

  // STEP 1: Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(prev => ({ ...prev, search: true }));
    try {
      const results = await searchGames(keyword);
      setReferences(results);
      setPrompts([]); // Reset prompts for new search
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  // STEP 2: Handle Generation
  const handleGenerate = async () => {
    if (references.length === 0) return;

    setLoading(prev => ({ ...prev, generating: true }));
    try {
      const result = await generateDNALockedPrompts(keyword, references);
      const formattedPrompts = result.prompts.map((text, index) => ({
        id: `prompt-${index}`,
        text
      }));
      setPrompts(formattedPrompts);
      
      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setLoading(prev => ({ ...prev, generating: false }));
    }
  };

  const removeReference = (id: string) => {
    setReferences(prev => prev.filter(r => r.id !== id));
  };

  const copyAll = () => {
    const text = prompts.map(p => p.text).join('\n\n---\n\n');
    navigator.clipboard.writeText(text);
    alert('All 10 prompts copied to clipboard!');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4">
      {/* HEADER SECTION */}
      <div className="text-center pt-8">
        <h1 className="text-4xl font-black text-white mb-2 italic uppercase tracking-tighter">
          3D Creative Factory
        </h1>
        <p className="text-slate-400">Transform competitor DNA into high-conversion 3D engine prompts.</p>
      </div>

      {/* STEP 1: SEARCH */}
      <section className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Search size={20} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Step 1: Find Competitors</h2>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., Sniper Ghost Shooter, Car Parking 3D..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading.search}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
          >
            {loading.search ? <Loader2 className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </section>

      {/* STEP 2: REFERENCE GRID */}
      {references.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-end mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Step 2: Curate Visual DNA</h2>
                <p className="text-sm text-slate-400">Delete styles that don't match your target 3D aesthetic.</p>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={loading.generating}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-8 py-4 rounded-xl font-black text-lg uppercase tracking-wider flex items-center gap-3 shadow-lg shadow-green-900/20 transition-all"
            >
              {loading.generating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Analyzing DNA...
                </>
              ) : (
                'Build 10 Visual Prompts'
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {references.map((game) => (
              <div key={game.id} className="group relative bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-slate-600 transition-all">
                <div className="flex flex-col">
                  <span className="text-white font-bold truncate max-w-[250px]">{game.title}</span>
                  <a 
                    href={game.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 flex items-center gap-1 hover:underline mt-1"
                  >
                    Check Style <ExternalLink size={10} />
                  </a>
                </div>
                <button
                  onClick={() => removeReference(game.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STEP 3: OUTPUT SECTION */}
      {prompts.length > 0 && (
        <section id="results-section" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white uppercase italic">Step 3: Screenshot Prompts</h2>
            <button
              onClick={copyAll}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm border border-slate-700 transition-all"
            >
              <Copy size={16} />
              Copy All 10
            </button>
          </div>

          <div className="grid gap-6">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
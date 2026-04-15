import { Search, Settings, Gamepad2 } from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">ASO Creative Factory</h1>
            <p className="text-slate-500 text-xs">Mobify</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => onTabChange('research')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === 'research'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          Research
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
            activeTab === 'settings'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3">
          <p className="text-slate-400 text-xs leading-relaxed">
            Powered by <span className="text-cyan-400 font-medium">Gemini 2.5 Flash</span>. Generate ASO-optimized 3D screenshots for your game.
          </p>
        </div>
      </div>
    </aside>
  );
}

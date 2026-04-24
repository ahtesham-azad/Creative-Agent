import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SettingsTab } from './components/SettingsTab';
import ResearchTab from './components/ResearchTab';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ActiveTab } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('research');
  const [apiKey, setApiKey] = useLocalStorage<string>('gemini_api_key', '');

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 min-h-screen">
          {activeTab === 'research' && (
            <ResearchTab
              apiKey={apiKey}
              onGoToSettings={() => setActiveTab('settings')}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

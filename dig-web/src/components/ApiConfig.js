'use client';
import { useState, useEffect } from 'react';
import { Settings, X, Save } from 'lucide-react';

export default function ApiConfig() {
  const [isOpen, setIsOpen] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load existing keys from the global api_keys.json via a local API route
    fetch('/api/keys')
      .then(res => res.json())
      .then(data => {
        if (data.keys) {
          setGeminiKey(data.keys['Gemini'] || data.keys['Gemini (Google)'] || '');
          setOpenaiKey(data.keys['OpenAI'] || '');
          setClaudeKey(data.keys['Anthropic'] || data.keys['Claude (Anthropic)'] || '');
        }
      })
      .catch(err => console.error("Failed to load API keys", err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          'Gemini (Google)': geminiKey,
          'Gemini': geminiKey,
          'OpenAI': openaiKey,
          'Claude (Anthropic)': claudeKey,
          'Anthropic': claudeKey
        })
      });
      alert('API 키가 저장되었습니다.');
      setIsOpen(false);
    } catch (e) {
      alert('저장 실패: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-zinc-900 border border-zinc-700 rounded-full hover:bg-zinc-800 hover:border-primary transition-all shadow-xl z-50 text-zinc-400 hover:text-white"
        title="API Settings"
      >
        <Settings size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="text-primary" /> API Key Settings
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Gemini API Key</label>
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="AI Studio Key..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="sk-..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Claude API Key</label>
                <input 
                  type="password" 
                  value={claudeKey}
                  onChange={(e) => setClaudeKey(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="sk-ant-..."
                />
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full mt-6 bg-primary text-black font-bold py-3 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                <Save size={18} /> {isSaving ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState } from 'react';
import ChatPanel from '../../components/generator/ChatPanel';
import LivePreview from '../../components/generator/LivePreview';
import { useGeneration } from '../../hooks/useGeneration';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function GeneratorPage() {
  const { code, messages, isGenerating, generate, reset } = useGeneration();
  const [chatVisible, setChatVisible] = useState(true);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#1e1e2e]">
      {/* Chat Panel */}
      <div
        className={`flex-shrink-0 border-r border-white/10 transition-all duration-300 ease-in-out overflow-hidden ${
          chatVisible ? 'w-80' : 'w-0'
        }`}
      >
        <div className="w-80 h-full">
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onGenerate={generate}
            onReset={reset}
          />
        </div>
      </div>

      {/* Live Preview (takes remaining space) */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toggle chat panel button */}
        <button
          onClick={() => setChatVisible(!chatVisible)}
          className="absolute top-3 left-3 z-30 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          title={chatVisible ? 'Hide chat' : 'Show chat'}
        >
          {chatVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        <LivePreview code={code} isGenerating={isGenerating} />
      </div>
    </div>
  );
}

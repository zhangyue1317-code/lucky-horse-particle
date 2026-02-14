import React, { useState } from 'react';
import { UIConfig } from '../types';

interface ConfigPanelProps {
  config: UIConfig;
  setConfig: React.Dispatch<React.SetStateAction<UIConfig>>;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof UIConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/70 hover:bg-white/20 transition-all hover:scale-105"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-xs font-sans text-white/80 shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10 flex-shrink-0">
        <h3 className="font-bold text-sm tracking-wider uppercase text-yellow-500">Style Settings</h3>
        <button onClick={() => setIsOpen(false)} className="hover:text-white">✕</button>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
        
        {/* Container Section - Simplified since layout controls are no longer needed for the title */}
        <section>
          <h4 className="mb-2 font-semibold text-white/60">Glass Material (Buttons)</h4>
          <div className="space-y-3">
             <div className="flex items-center justify-between pt-2">
                <label>Bg Color</label>
                <input type="color" value={config.containerBgColor} onChange={(e) => handleChange('containerBgColor', e.target.value)} className="w-8 h-6 rounded cursor-pointer bg-transparent" />
             </div>

             <div>
                <div className="flex justify-between items-center">
                  <label>Opacity</label>
                  <span className="text-white/40">{Math.round(config.containerBgOpacity * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={config.containerBgOpacity} 
                  onChange={(e) => handleChange('containerBgOpacity', parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             <div>
                <div className="flex justify-between items-center">
                  <label>Blur (Frost)</label>
                  <span className="text-white/40">{config.containerBlur}px</span>
                </div>
                <input 
                  type="range" min="0" max="50" step="1" 
                  value={config.containerBlur} 
                  onChange={(e) => handleChange('containerBlur', parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             <div>
                <div className="flex justify-between items-center">
                  <label>Border Opacity</label>
                  <span className="text-white/40">{Math.round(config.containerBorderOpacity * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={config.containerBorderOpacity} 
                  onChange={(e) => handleChange('containerBorderOpacity', parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             <div>
                <div className="flex justify-between items-center">
                  <label>Shine/Highlight</label>
                  <span className="text-white/40">{Math.round(config.containerShineOpacity * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={config.containerShineOpacity} 
                  onChange={(e) => handleChange('containerShineOpacity', parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
             </div>
          </div>
        </section>
        
        <div className="mt-4 pt-4 border-t border-white/10 text-center text-[10px] text-white/20">
            UI Configuration
        </div>
      </div>
    </div>
  );
};
import React, { useRef } from 'react';
import { UIConfig } from '../types';

interface OverlayProps {
  onAddPhoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  gestureName: string;
  config?: UIConfig; 
}

export const Overlay: React.FC<OverlayProps> = ({ onAddPhoto, gestureName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between" style={{ fontFamily: '"Microsoft YaHei", sans-serif' }}>
      
      {/* Top Right Controls Group */}
      {/* Note: Config button is at right-4. We place this at right-16 to sit next to it. */}
      <div className="fixed top-4 right-16 pointer-events-auto z-50">
        <button 
            onClick={handleIconClick}
            className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/70 hover:bg-white/20 transition-all hover:scale-105 group hover:text-yellow-200"
            title="Upload Photos"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 18.5a14 14 0 0 0 14 0"></path>
                <path d="M16 13.5v-3.5l-6-3"></path>
                <path d="M10 13.5v-3"></path>
                <path d="M12 7l1-2a2 2 0 0 1 2-1 2 2 0 0 1 2 2c0 2-2 3-2 3"></path>
                <path d="M8 14h8"></path>
            </svg>
        </button>

        <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={onAddPhoto}
            multiple
        />
      </div>

      {/* Bottom Status Area - Simplified & Minimalist */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4">
             {/* Current Gesture Badge */}
             <div className="flex items-center gap-3 px-5 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white/90 shadow-2xl transition-all duration-300">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Status</span>
                <div className="w-px h-3 bg-white/20"></div>
                <span className="text-sm font-bold text-yellow-400 tracking-wide min-w-[60px] text-center">
                    {gestureName === 'NONE' ? 'WAITING' : gestureName}
                </span>
             </div>

             {/* Minimal Legend with Active State Indicators */}
             <div className="flex gap-8 text-[10px] text-white/30 uppercase tracking-widest transition-opacity duration-500">
                <div className={`flex items-center gap-2 transition-all duration-300 ${gestureName === 'OPEN_PALM' ? 'text-yellow-200 opacity-100' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${gestureName === 'OPEN_PALM' ? 'bg-yellow-400 shadow-[0_0_10px_#facc15] scale-125' : 'bg-white/20'}`}></span>
                    <span>Flow</span>
                </div>
                <div className={`flex items-center gap-2 transition-all duration-300 ${gestureName === 'FIST' ? 'text-red-300 opacity-100' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${gestureName === 'FIST' ? 'bg-red-500 shadow-[0_0_10px_#ef4444] scale-125' : 'bg-white/20'}`}></span>
                    <span>Form</span>
                </div>
                <div className={`flex items-center gap-2 transition-all duration-300 ${gestureName === 'PINCH' ? 'text-blue-300 opacity-100' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${gestureName === 'PINCH' ? 'bg-blue-400 shadow-[0_0_10px_#60a5fa] scale-125' : 'bg-white/20'}`}></span>
                    <span>Photo</span>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};
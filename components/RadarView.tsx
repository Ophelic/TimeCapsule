import React from 'react';
import { Target, Radio, Zap, Podcast } from 'lucide-react';

interface RadarViewProps {
  nearbyCount: number;
  scanning: boolean;
  onScan: () => void;
  onCreate: () => void;
  onCompose: () => void; // New prop
}

export const RadarView: React.FC<RadarViewProps> = ({ nearbyCount, scanning, onScan, onCreate, onCompose }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full relative p-4 z-10 w-full max-w-md mx-auto">
      
      {/* Decorative Corner Brackets - Optimized opacity */}
      <div className="absolute top-4 left-4 right-4 bottom-20 pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyan-500 rounded-tl-2xl"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-cyan-500 rounded-tr-2xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-cyan-500 rounded-bl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyan-500 rounded-br-2xl"></div>
      </div>

      {/* Main Radar Complex - Responsive Size */}
      <div className="relative w-[65vw] h-[65vw] max-w-[300px] max-h-[300px] flex items-center justify-center mb-8 sm:mb-12 shrink-0">
        
        {/* Outer Rotating Ring (Slow) */}
        <div className="absolute inset-[-15px] border border-cyan-900/40 rounded-full animate-spin-slow border-dashed opacity-50"></div>
        
        {/* Inner Counter-Rotating Ring */}
        <div className="absolute inset-[-5px] border border-cyan-800/30 rounded-full animate-spin-reverse-slow border-dotted opacity-60"></div>

        {/* Static Concentric Circles */}
        <div className="absolute inset-0 border border-cyan-500/20 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.1)]"></div>
        <div className="absolute inset-[25%] border border-cyan-500/10 rounded-full"></div>
        <div className="absolute inset-[50%] border border-cyan-500/10 rounded-full"></div>

        {/* Dynamic Scanning Effect */}
        {scanning && (
            <>
                <div className="absolute inset-0 rounded-full border border-cyan-400 opacity-20 animate-ping"></div>
                <div className="absolute w-full h-full rounded-full overflow-hidden animate-spin">
                    <div className="absolute top-1/2 left-1/2 w-[50%] h-[50%] bg-gradient-to-t from-cyan-400/30 to-transparent origin-bottom-left transform -rotate-45 blur-md"></div>
                </div>
            </>
        )}
        
        {/* Central HUD Element */}
        <div className="z-10 bg-black/60 backdrop-blur-sm p-4 rounded-full border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] relative group cursor-default">
             <div className="absolute inset-0 rounded-full border border-cyan-200 opacity-20 animate-pulse"></div>
            <Target className={`w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 ${scanning ? 'animate-pulse' : ''}`} />
        </div>

        {/* Detected Signal Nodes */}
        {nearbyCount > 0 && (
            <>
                {/* Randomly placed "blips" */}
                <div className="absolute top-[20%] right-[20%] w-2 h-2 bg-red-500 rounded-full animate-ping shadow-[0_0_10px_#ef4444]"></div>
                <div className="absolute top-[20%] right-[20%] w-2 h-2 bg-red-500 rounded-full"></div>
                
                {nearbyCount > 1 && (
                     <div className="absolute bottom-[30%] left-[25%] w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-75"></div>
                )}
            </>
        )}
        
        {/* Decorative Lines */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
        <div className="absolute top-0 left-1/2 h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-900/50 to-transparent"></div>
      </div>

      {/* Stats with Glitch Effect */}
      <div className="text-center space-y-2 mb-6 z-10">
        <h2 
            className="text-3xl font-display font-black text-white tracking-widest glitch-text"
            data-text={nearbyCount > 0 ? `${nearbyCount} SIGNALS` : 'NO SIGNAL'}
        >
            {nearbyCount > 0 ? `${nearbyCount} SIGNALS` : 'NO SIGNAL'}
        </h2>
        <div className="flex items-center justify-center gap-2 bg-black/40 py-1 px-3 rounded-full border border-white/5 inline-flex">
            <div className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}></div>
            <p className="text-cyan-300/80 font-mono text-[10px] tracking-[0.2em] uppercase">
                {scanning ? 'SCANNING_SECTOR...' : 'SYSTEM_IDLE'}
            </p>
        </div>
      </div>

      {/* Action Buttons - Updated Layout */}
      <div className="flex gap-3 w-full z-10 px-2">
        <button 
            onClick={onScan}
            disabled={scanning}
            className={`
                flex-1 group relative py-4 bg-cyan-950/40 border border-cyan-500/50 rounded-xl
                hover:bg-cyan-900/60 active:scale-95 transition-all duration-300
                flex flex-col items-center justify-center gap-1 overflow-hidden
                ${scanning ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_15px_rgba(6,182,212,0.15)]'}
            `}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Radio className={`w-5 h-5 text-cyan-400 ${scanning ? 'animate-spin' : ''}`} />
            <span className="font-display font-bold text-cyan-100 uppercase tracking-wider text-[9px]">
                {scanning ? 'ACTIVE' : 'SCAN'}
            </span>
        </button>

        <button 
            onClick={onCreate}
            className="flex-1 group relative py-4 bg-purple-900/20 border border-purple-500/50 rounded-xl hover:bg-purple-900/40 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
        >
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Zap className="w-5 h-5 text-purple-400 group-hover:text-purple-200 transition-colors" />
            <span className="font-display font-bold text-purple-100 uppercase tracking-wider text-[9px] group-hover:text-white">
                MARKER
            </span>
        </button>

        <button 
            onClick={onCompose}
            className="flex-1 group relative py-4 bg-emerald-900/20 border border-emerald-500/50 rounded-xl hover:bg-emerald-900/40 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        >
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Podcast className="w-5 h-5 text-emerald-400 group-hover:text-emerald-200 transition-colors" />
            <span className="font-display font-bold text-emerald-100 uppercase tracking-wider text-[9px] group-hover:text-white">
                SIGNAL
            </span>
        </button>
      </div>
    </div>
  );
};
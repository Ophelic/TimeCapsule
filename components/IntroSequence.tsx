import React, { useState, useEffect } from 'react';
import { FastForward, Terminal } from 'lucide-react';
import { CyberBackground } from './CyberBackground';

interface IntroSequenceProps {
  onComplete: () => void;
}

const SCRIPT = [
  { 
    en: "SYSTEM SELF-CHECK INITIATED...", 
    cn: "系统自检程序启动..." 
  },
  { 
    en: "THE WORLD MOVES TOO FAST. DATA IS EVAPORATING.", 
    cn: "世界太快，数据正在蒸发..." 
  },
  { 
    en: "WE ARE THE ANCHORS. PINNING MEMORIES TO REALITY.", 
    cn: "我们是锚点，我们将记忆钉在现实领域..." 
  },
  { 
    en: "OPERATOR, YOUR SIGNAL HAS BEEN INTERCEPTED.", 
    cn: "操作员，你的信号已被截获..." 
  },
  { 
    en: "SYNCHRONIZATION REQUIRES AUTHENTICATION...", 
    cn: "同步需要身份验证..." 
  }
];

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isLineComplete, setIsLineComplete] = useState(false);
  
  const typingSpeed = 35;

  useEffect(() => {
    // Safety check for bounds
    if (lineIndex >= SCRIPT.length) {
      onComplete();
      return;
    }

    const currentLine = SCRIPT[lineIndex];
    if (!currentLine) return;

    const totalChars = currentLine.en.length;

    if (charIndex < totalChars) {
      const timeout = setTimeout(() => {
        setCharIndex(prev => prev + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    } else {
      setIsLineComplete(true);
    }
  }, [charIndex, lineIndex, onComplete]);

  const handleInteraction = () => {
    if (lineIndex >= SCRIPT.length) return;

    if (!isLineComplete) {
      // If typing, finish immediately
      const currentLine = SCRIPT[lineIndex];
      if (currentLine) {
        setCharIndex(currentLine.en.length);
        setIsLineComplete(true);
      }
    } else {
      // If finished, go to next line
      if (lineIndex < SCRIPT.length - 1) {
        setLineIndex(prev => prev + 1);
        setCharIndex(0);
        setIsLineComplete(false);
      } else {
        onComplete();
      }
    }
  };

  const currentScript = SCRIPT[lineIndex];

  return (
    <div 
      onClick={handleInteraction}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 cursor-pointer select-none overflow-hidden"
    >
      {/* Enhanced Background */}
      <CyberBackground mode="flow" intensity="high" />

      {/* Skip Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className="absolute top-8 right-8 flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors z-20 group"
      >
        <span className="text-[10px] font-mono tracking-widest group-hover:text-cyan-300">SKIP_SEQ</span>
        <FastForward className="w-4 h-4 group-hover:text-cyan-300" />
      </button>

      {/* Main Text Container */}
      <div className="w-full max-w-2xl relative z-10 min-h-[200px] flex flex-col items-center justify-center backdrop-blur-sm p-8 rounded-2xl bg-black/20 border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Terminal Icon Decor */}
        <div className="mb-8 opacity-70 animate-pulse">
           <Terminal className="w-10 h-10 text-cyan-400" />
        </div>

        {/* English Text (Typewriter) */}
        <h2 className="text-xl md:text-3xl font-display font-bold text-center tracking-widest text-white mb-6 h-16 leading-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
          {/* Safe access to string property */}
          {currentScript?.en?.substring(0, charIndex) || ""}
          <span className="animate-pulse text-cyan-400">_</span>
        </h2>

        {/* Chinese Text (Fade In with Glow) */}
        <div className={`transition-all duration-700 transform ${charIndex > 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-lg md:text-xl font-sans font-light text-cyan-200 tracking-[0.2em] text-center drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            {currentScript?.cn || ""}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2 mt-8">
            {SCRIPT.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-300 ${idx === lineIndex ? 'w-8 bg-cyan-400' : 'w-1 bg-slate-700'}`}
                ></div>
            ))}
        </div>

      </div>

      {/* Footer Hint */}
      <div className="absolute bottom-12 z-20 opacity-60 animate-pulse flex flex-col items-center gap-2">
        <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-cyan-500 to-transparent"></div>
        <p className="text-[10px] font-mono text-cyan-200 uppercase tracking-[0.3em]">
            {isLineComplete ? "Click to Proceed" : "Receiving Data Stream..."}
        </p>
      </div>
    </div>
  );
};
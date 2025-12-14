import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square, Send, Radio, Zap, Volume2, Activity } from 'lucide-react';
import { synth } from '../utils/synthEngine';

interface SignalComposerProps {
  onCancel: () => void;
  onTransmit: (signalData: boolean[][]) => void;
}

const ROWS = 6; // Kick, Snare, HiHat, Bass, Bleep, Stab
const COLS = 8; // 8 Steps
const ROW_LABELS = ['KICK', 'NOISE', 'TICK', 'BASS', 'DATA', 'SYNTH'];
const BPM = 200; // Fast cyberpunk tempo

export const SignalComposer: React.FC<SignalComposerProps> = ({ onCancel, onTransmit }) => {
  // Grid State: true = active note
  const [grid, setGrid] = useState<boolean[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(false))
  );
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const sequencerRef = useRef<number | null>(null);

  // Initialize synth on first interaction to unlock AudioContext
  useEffect(() => {
    const unlockAudio = () => {
        if (synth.ctx && synth.ctx.state === 'suspended') {
            synth.ctx.resume();
        }
        document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const stepTime = (60 / BPM) * 1000; // ms per beat (quarter note) -> treating steps as 8th notes actually
      // Let's make it faster, assume BPM is for 1/4 notes, we play 1/8 notes
      const intervalTime = stepTime / 2; 

      sequencerRef.current = window.setInterval(() => {
        setCurrentStep(prev => {
          const nextStep = (prev + 1) % COLS;
          playStep(nextStep);
          return nextStep;
        });
      }, intervalTime);
    } else {
      if (sequencerRef.current) {
        clearInterval(sequencerRef.current);
        sequencerRef.current = null;
      }
      setCurrentStep(-1);
    }

    return () => {
      if (sequencerRef.current) clearInterval(sequencerRef.current);
    };
  }, [isPlaying, grid]); // Dependency on grid so we play latest version

  const playStep = (stepIndex: number) => {
    // Check each row for active note at this step
    for (let r = 0; r < ROWS; r++) {
      if (grid[r][stepIndex]) {
        synth.playSound(r);
      }
    }
  };

  const toggleCell = (row: number, col: number) => {
    const newGrid = [...grid];
    newGrid[row] = [...newGrid[row]]; // Copy row
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);
    
    // Audition sound if turning on
    if (newGrid[row][col]) {
        synth.playSound(row);
    }
  };

  const handleTransmit = () => {
      // Check if grid is empty
      const isEmpty = !grid.some(row => row.some(cell => cell));
      if (isEmpty) return;

      setIsTransmitting(true);
      setIsPlaying(false);
      
      // Transmission Animation Duration
      setTimeout(() => {
          onTransmit(grid);
      }, 2000);
  };

  const clearGrid = () => {
      setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(false)));
      setIsPlaying(false);
      setCurrentStep(-1);
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-[#080808] text-white overflow-hidden">
        
        {/* Background Visuals */}
        <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
             <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-900/20 to-transparent"></div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4 pt-safe-top z-20 border-b border-cyan-900/30 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                <div>
                    <h2 className="text-lg font-display font-bold tracking-wider text-white">SIGNAL<span className="text-cyan-400">Gen</span></h2>
                    <p className="text-[9px] font-mono text-cyan-600">ENCRYPTED FREQUENCY // 8-BIT</p>
                </div>
            </div>
            <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white border border-white/10 rounded-full">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Transmission Overlay */}
        {isTransmitting && (
            <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center pointer-events-none">
                <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                    <div className="absolute inset-0 border-4 border-cyan-500 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-2 border-2 border-cyan-400 rounded-full animate-spin border-t-transparent"></div>
                    <Zap className="w-12 h-12 text-cyan-400 animate-pulse" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white tracking-widest glitch-text" data-text="BROADCASTING">BROADCASTING</h3>
                <p className="font-mono text-cyan-400 text-xs mt-2">ENCRYPTING DATA PACKETS...</p>
                
                {/* ASCII Wave Animation */}
                <div className="mt-8 font-mono text-cyan-600 text-[10px] whitespace-pre text-center leading-none">
                    {`
       /\\      /\\      /\\
    __/  \\____/  \\____/  \\__
                    `}
                </div>
            </div>
        )}

        {/* Main Sequencer Area */}
        <div className="flex-1 flex flex-col justify-center px-2 sm:px-4 py-4 z-10 overflow-y-auto">
            
            {/* Grid Container */}
            <div className="relative bg-black/40 border border-cyan-900/50 rounded-xl p-3 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                
                {/* Playhead Overlay */}
                {currentStep >= 0 && (
                    <div 
                        className="absolute top-0 bottom-0 bg-cyan-500/10 border-l border-cyan-400/50 z-0 transition-all duration-75 ease-linear pointer-events-none"
                        style={{ 
                            left: `${(currentStep / COLS) * 100}%`,
                            width: `${100 / COLS}%` 
                        }}
                    ></div>
                )}

                <div className="flex flex-col gap-1.5 sm:gap-2">
                    {grid.map((row, rIndex) => (
                        <div key={rIndex} className="flex items-center gap-2">
                            {/* Row Label */}
                            <div className="w-10 sm:w-12 text-[9px] font-mono text-cyan-600/80 text-right pr-2">
                                {ROW_LABELS[rIndex]}
                            </div>
                            
                            {/* Pads */}
                            <div className="flex-1 grid grid-cols-8 gap-1 sm:gap-1.5">
                                {row.map((active, cIndex) => (
                                    <button
                                        key={cIndex}
                                        onClick={() => toggleCell(rIndex, cIndex)}
                                        className={`
                                            aspect-square rounded-sm sm:rounded relative overflow-hidden transition-all duration-100
                                            ${active 
                                                ? 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.6)] border-cyan-300' 
                                                : 'bg-white/5 hover:bg-white/10 border-white/5'}
                                            ${currentStep === cIndex ? 'brightness-150 scale-105' : ''}
                                            border
                                        `}
                                    >
                                        {active && (
                                            <div className="absolute inset-0 bg-white/20"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Playback Controls */}
            <div className="mt-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                     <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`
                            h-14 w-14 rounded-full flex items-center justify-center transition-all
                            ${isPlaying 
                                ? 'bg-red-900/20 text-red-500 border border-red-500/50 hover:bg-red-900/40' 
                                : 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-900/40'}
                        `}
                     >
                        {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                    </button>
                    
                    <button 
                        onClick={clearGrid}
                        className="text-xs font-mono text-slate-500 hover:text-white underline decoration-dashed"
                    >
                        CLEAR_PATTERN
                    </button>
                </div>

                <div className="flex-1"></div>

                <button
                    onClick={handleTransmit}
                    className="group relative flex items-center gap-3 px-6 py-4 bg-cyan-950 border border-cyan-500 rounded-lg overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-95"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[glitch_3s_infinite]"></div>
                    <div className="flex flex-col items-start relative z-10">
                        <span className="text-[9px] font-mono text-cyan-400">READY TO SEND</span>
                        <span className="text-sm font-display font-bold text-white tracking-widest">BROADCAST</span>
                    </div>
                    <Send className="w-5 h-5 text-cyan-400 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            
            <div className="mt-6 flex justify-center gap-8 opacity-40">
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-[9px] font-mono">BPM: {BPM}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-[9px] font-mono">OUTPUT: STEREO</span>
                </div>
            </div>

        </div>
    </div>
  );
};
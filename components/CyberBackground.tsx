import React from 'react';

interface CyberBackgroundProps {
  mode: 'flow' | 'static'; 
  intensity?: 'low' | 'high';
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({ mode, intensity = 'high' }) => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#050505]">
      
      {/* 1. Base Gradient (Deep Space) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#050505] to-[#000000]"></div>

      {/* 2. Moving 3D Grid Floor */}
      <div className="absolute inset-0 flex items-end justify-center perspective-[500px] opacity-30">
         <div className={`
            absolute bottom-[-50%] left-[-50%] w-[200%] h-[100%] origin-bottom 
            bg-[linear-gradient(rgba(6,182,212,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.3)_1px,transparent_1px)] 
            bg-[size:40px_40px]
            ${mode === 'flow' ? 'animate-grid-flow' : 'transform rotate-x-[60deg]'}
         `}
         style={{
             maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
             WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)'
         }}>
         </div>
      </div>

      {/* 3. Ceiling Grid (Faint reflection) */}
      <div className="absolute top-0 w-full h-1/2 opacity-10 flex items-start justify-center perspective-[500px]">
         <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[100%] origin-top bg-[linear-gradient(rgba(168,85,247,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.3)_1px,transparent_1px)] bg-[size:60px_60px] transform rotate-x-[-60deg]"></div>
      </div>

      {/* 4. Ambient Glow Orbs */}
      <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[80px] animate-pulse delay-1000"></div>

      {/* 5. Shooting Stars / Data Packets */}
      {intensity === 'high' && (
          <>
            <div className="absolute top-0 right-0 w-[2px] h-[100px] bg-gradient-to-b from-transparent via-cyan-400 to-transparent rotate-45 animate-shooting-star opacity-0" style={{ animationDelay: '2s', top: '20%' }}></div>
            <div className="absolute top-0 right-1/3 w-[2px] h-[150px] bg-gradient-to-b from-transparent via-purple-400 to-transparent rotate-45 animate-shooting-star opacity-0" style={{ animationDelay: '5s', left: '10%' }}></div>
            <div className="absolute top-1/4 left-0 w-[2px] h-[80px] bg-gradient-to-b from-transparent via-white to-transparent rotate-[-45deg] animate-shooting-star opacity-0" style={{ animationDelay: '3.5s', left: '80%' }}></div>
          </>
      )}

      {/* 6. Digital Rain / Matrix Columns (Simulated with CSS gradient animation) */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,182,212,0.5)_50%,transparent_100%)] bg-[size:100%_200%] animate-scan pointer-events-none"></div>

      {/* 7. CRT Vignette & Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,black_100%)] pointer-events-none opacity-80"></div>
    </div>
  );
};
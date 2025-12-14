import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Activity, Music } from 'lucide-react';

interface BackgroundAudioProps {
  variant: 'system' | 'user';
}

export const BackgroundAudio: React.FC<BackgroundAudioProps> = ({ variant }) => {
  const [userEnabled, setUserEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false); // Tracks actual audio context state
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<AudioNode[]>([]);
  const sequencerIntervalRef = useRef<number | null>(null);

  // Initialize Audio Engine once
  useEffect(() => {
    const initAudio = () => {
      if (audioCtxRef.current) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = userEnabled ? 0.4 : 0;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Resume context on first interaction (Browser Autoplay Policy)
      const resume = () => {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => setIsPlaying(true));
        } else {
            setIsPlaying(true);
        }
      };
      
      // If already running (e.g. reload), set state
      if (ctx.state === 'running') setIsPlaying(true);

      document.addEventListener('click', resume, { once: true });
      document.addEventListener('keydown', resume, { once: true });
      document.addEventListener('touchstart', resume, { once: true });
    };

    initAudio();
  }, []);

  // Handle Volume/Mute Toggle
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.linearRampToValueAtTime(userEnabled ? 0.4 : 0, now + 0.5);
    }
  }, [userEnabled]);

  // Handle Track Switching
  useEffect(() => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    
    // Stop previous track
    stopCurrentTrack();

    // Start new track based on variant
    if (variant === 'system') {
        playSystemTrack(audioCtxRef.current, masterGainRef.current);
    } else {
        playUserTrack(audioCtxRef.current, masterGainRef.current);
    }

    return () => stopCurrentTrack();
  }, [variant, isPlaying]); // Re-run if playing state changes (e.g. context resumes)

  const stopCurrentTrack = () => {
      if (sequencerIntervalRef.current) {
          window.clearInterval(sequencerIntervalRef.current);
          sequencerIntervalRef.current = null;
      }
      activeNodesRef.current.forEach(node => {
          try { (node as any).stop?.(); } catch(e){}
          try { node.disconnect(); } catch(e){}
      });
      activeNodesRef.current = [];
  };

  // 1. System Track: Ambient Drone (For Splash/Login)
  const playSystemTrack = (ctx: AudioContext, output: AudioNode) => {
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 50;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 180;
      osc1.connect(filter);
      filter.connect(output);
      osc1.start(now);
      activeNodesRef.current.push(osc1, filter);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 100;
      const gain2 = ctx.createGain();
      gain2.gain.value = 0.2;
      osc2.connect(gain2);
      gain2.connect(output);
      osc2.start(now);
      activeNodesRef.current.push(osc2, gain2);
  };

  // 2. User Track: Rhythmic Cyberpunk BGM (For Main App)
  // Simulating an uploaded file loop
  const playUserTrack = (ctx: AudioContext, output: AudioNode) => {
      // Bass Sequence
      const notes = [65.41, 65.41, 77.78, 87.31]; // C2, C2, Eb2, F2
      let step = 0;

      const playNote = (time: number, freq: number) => {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, time);
          filter.frequency.exponentialRampToValueAtTime(100, time + 0.3);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(output);
          
          osc.start(time);
          osc.stop(time + 0.5);
      };

      const playHiHat = (time: number) => {
          const osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.value = 8000;
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 7000;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.05, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(output);
          osc.start(time);
          osc.stop(time + 0.05);
      }

      // 120 BPM = 500ms per beat
      const schedule = () => {
          const now = ctx.currentTime;
          // Bass
          playNote(now, notes[step % 4]);
          
          // Hi-hats every beat
          playHiHat(now);
          playHiHat(now + 0.25); // 8th note

          // Snare-ish noise on 2 and 4
          if (step % 2 !== 0) {
              const noise = ctx.createBufferSource();
              const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
              const data = buffer.getChannelData(0);
              for(let i=0; i<buffer.length; i++) data[i] = Math.random() * 2 - 1;
              noise.buffer = buffer;
              
              const filter = ctx.createBiquadFilter();
              filter.type = 'highpass';
              filter.frequency.value = 1000;
              
              const gain = ctx.createGain();
              gain.gain.setValueAtTime(0.15, now);
              gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

              noise.connect(filter);
              filter.connect(gain);
              gain.connect(output);
              noise.start(now);
          }

          step++;
      };

      schedule();
      sequencerIntervalRef.current = window.setInterval(schedule, 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      {/* Visualizer: Only visible when enabled */}
      <div className={`flex items-end gap-[2px] h-6 transition-opacity duration-500 ${userEnabled ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`w-0.5 bg-cyan-500/80 h-2 ${userEnabled ? 'animate-[radar_1s_ease-in-out_infinite]' : ''}`}></div>
        <div className={`w-0.5 bg-cyan-400/80 h-4 ${userEnabled ? 'animate-[radar_1.2s_ease-in-out_infinite]' : ''}`}></div>
        <div className={`w-0.5 bg-purple-500/80 h-3 ${userEnabled ? 'animate-[radar_0.8s_ease-in-out_infinite]' : ''}`}></div>
      </div>

      <button
        onClick={() => setUserEnabled(!userEnabled)}
        className={`
          group relative flex items-center justify-center w-12 h-12
          border border-cyan-500/30 bg-black/60 backdrop-blur-md 
          rounded-full hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]
          transition-all duration-300
        `}
      >
        {userEnabled ? (
            variant === 'user' ? (
                <Music className="w-5 h-5 text-cyan-400 animate-pulse" />
            ) : (
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            )
        ) : (
          <VolumeX className="w-5 h-5 text-slate-500 group-hover:text-cyan-400" />
        )}
      </button>
    </div>
  );
};
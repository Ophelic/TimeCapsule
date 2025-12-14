import React, { useState } from 'react';
import { Shield, ChevronRight, Cpu, Lock, AlertCircle, ScanFace } from 'lucide-react';
import { loginUser } from '../services/authService';
import { User } from '../types';
import { CyberBackground } from './CyberBackground';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
        setError('IDENTITY_REQUIRED');
        return;
    }

    setIsLoading(true);
    setError('');

    try {
        const user = await loginUser(username);
        onLoginSuccess(user);
    } catch (err) {
        setError('CONNECTION_REFUSED');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-hidden animate-[fadeIn_1s_ease-out]">
        
        {/* --- DYNAMIC BACKGROUND --- */}
        <CyberBackground mode="flow" intensity="low" />

        {/* --- MAIN CONTENT --- */}
        <div className="w-full max-w-sm z-10 flex flex-col items-center">
            
            {/* 3D Animated Identity Core */}
            <div className="relative w-24 h-24 mb-8">
                 {/* Spinning Rings */}
                 <div className="absolute inset-0 border-2 border-cyan-500/60 rounded-full border-t-transparent border-b-transparent animate-[spin_4s_linear_infinite]"></div>
                 <div className="absolute inset-2 border-2 border-purple-500/50 rounded-full border-l-transparent border-r-transparent animate-[spin_6s_linear_infinite_reverse]"></div>
                 <div className="absolute inset-6 border border-white/20 rounded-full bg-cyan-900/20 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                     <Shield className="w-6 h-6 text-cyan-400" />
                 </div>
                 {/* Scan Line */}
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent h-[10%] w-full top-0 animate-[scan_3s_ease-in-out_infinite]"></div>
            </div>

            {/* Header Text - Updated for Narrative Continuity */}
            <div className="text-center mb-8">
                <h1 className="text-xl font-display font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    AUTHENTICATION <span className="text-cyan-400">TERMINAL</span>
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2 opacity-80">
                    <div className="h-[1px] w-8 bg-cyan-500"></div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest animate-pulse">
                        Awaiting Neural Link
                    </span>
                    <div className="h-[1px] w-8 bg-cyan-500"></div>
                </div>
            </div>

            {/* Glassmorphism Form Card */}
            <form onSubmit={handleLogin} className="w-full bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                {/* Subtle highlight gradient on hover/interaction */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                <div className="space-y-5 relative z-10">
                    
                    {/* Username Input */}
                    <div className="group/input">
                        <label className="block text-[10px] font-mono text-cyan-400/80 mb-1.5 uppercase tracking-wider pl-1">
                            Identity Handle
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-cyan-500 focus:bg-black/80 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
                                placeholder="OPERATOR_ID"
                            />
                            <ScanFace className="absolute right-3 top-3.5 w-4 h-4 text-white/20 group-focus-within/input:text-cyan-400 transition-colors" />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="group/input">
                        <label className="block text-[10px] font-mono text-cyan-400/80 mb-1.5 uppercase tracking-wider pl-1">
                            Passcode
                        </label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-mono placeholder-white/20 focus:outline-none focus:border-cyan-500 focus:bg-black/80 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all"
                                placeholder="••••••••"
                            />
                            <Lock className="absolute right-3 top-3.5 w-4 h-4 text-white/20 group-focus-within/input:text-cyan-400 transition-colors" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-2.5 rounded-lg border border-red-500/30 text-xs font-mono">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    </div>

                    {/* Login Button */}
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className={`
                            w-full relative group overflow-hidden rounded-xl p-[1px] 
                            transition-all duration-300 active:scale-[0.98]
                            ${isLoading ? 'opacity-80' : 'hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'}
                        `}
                    >
                        {/* Gradient Border Animation */}
                        <div className="absolute inset-[-100%] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#22d3ee_50%,#000000_100%)] animate-[spin_4s_linear_infinite] opacity-70 group-hover:opacity-100"></div>
                        
                        {/* Inner Button Content */}
                        <div className="relative bg-[#0a0a0a] rounded-[11px] h-full px-6 py-4 flex items-center justify-center gap-3 group-hover:bg-[#0f0f15] transition-colors">
                            {isLoading ? (
                                <>
                                    <Cpu className="w-4 h-4 text-cyan-400 animate-spin" />
                                    <span className="font-display font-bold text-cyan-400 text-sm tracking-widest">
                                        VERIFYING...
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="font-display font-bold text-white text-sm tracking-widest group-hover:text-cyan-400 transition-colors">
                                        ESTABLISH SYNC
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                                </>
                            )}
                        </div>
                    </button>
                </div>
            </form>

            {/* Footer / Version Info */}
            <div className="mt-8 opacity-40 hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-center font-mono text-cyan-100/50">
                    SECURE CHANNEL 24.908 // TIME CAPSULE CORE
                </p>
            </div>
        </div>
    </div>
  );
};
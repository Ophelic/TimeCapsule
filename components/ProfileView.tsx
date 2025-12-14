import React, { useState, useRef } from 'react';
import { User, Capsule } from '../types';
import { X, Shield, Activity, Map, Database, LogOut, Settings, Award, Share2, ToggleLeft, ToggleRight, Fingerprint, Edit2, Save, Upload } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  capsules: Capsule[];
  onBack: () => void;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, capsules, onBack, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'settings'>('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState(user.bio || "Data runner navigating the neon stream.");
  const [tempAvatar, setTempAvatar] = useState(user.avatar || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Stats
  const myCapsulesCount = capsules.filter(c => c.userId === user.id).length;
  const synchronicityLevel = Math.min(100, Math.floor((myCapsulesCount * 15) + 12));
  const accountAgeDays = 42; 
  const xp = myCapsulesCount * 250;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) setTempAvatar(ev.target.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveProfile = () => {
      const updatedUser = { ...user, bio: tempBio, avatar: tempAvatar };
      onUpdateUser(updatedUser);
      setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-[#050505]">
        
        {/* Background Grid & Decor */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{
                 backgroundImage: 'linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)',
                 backgroundSize: '30px 30px'
             }}>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full"></div>

        {/* Header / Nav */}
        <div className="z-20 flex justify-between items-center p-4 pt-safe-top">
            <h2 className="text-xl font-display font-bold text-white tracking-widest flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-cyan-400" />
                IDENTITY
            </h2>
            <div className="flex gap-2">
                {isEditing ? (
                    <button 
                        onClick={handleSaveProfile}
                        className="p-2 rounded-full bg-cyan-950/50 border border-cyan-500 text-cyan-400 hover:bg-cyan-900/50 active:scale-95 transition-all"
                    >
                        <Save className="w-5 h-5" />
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                )}
                <button 
                    onClick={onBack}
                    className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Main Content Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 z-10 space-y-6">
            
            {/* Identity Card */}
            <div className={`relative w-full bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl border rounded-2xl p-6 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)] transition-all ${isEditing ? 'border-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,0.2)]' : 'border-cyan-500/30'}`}>
                {/* Holographic Sheen */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent skew-x-12 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
                    {/* Avatar Section */}
                    <div className="relative group">
                        <div className={`w-24 h-24 rounded-xl overflow-hidden border-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-black transition-colors ${isEditing ? 'border-cyan-400' : 'border-cyan-500/50'}`}>
                            <img src={isEditing ? tempAvatar : user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            
                            {/* Edit Overlay */}
                            {isEditing && (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Upload className="w-6 h-6 text-cyan-400" />
                                    <span className="text-[8px] font-mono text-cyan-200">UPLOAD</span>
                                </button>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleAvatarSelect}
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-black border border-cyan-500 rounded px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 font-bold">
                            LVL.{Math.floor(xp / 1000) + 1}
                        </div>
                    </div>
                    
                    {/* User Info Section */}
                    <div className="flex-1 min-w-0 text-center sm:text-left w-full">
                        <h3 className="text-2xl font-display font-bold text-white truncate">{user.username}</h3>
                        <p className="font-mono text-[10px] text-cyan-600 truncate mb-3">
                            ID: {user.id}
                        </p>
                        
                        {/* Bio Section */}
                        {isEditing ? (
                            <div className="relative mb-3">
                                <textarea 
                                    value={tempBio}
                                    onChange={(e) => setTempBio(e.target.value)}
                                    maxLength={80}
                                    className="w-full bg-black/40 border border-cyan-500/50 rounded-lg p-2 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-400 resize-none h-16"
                                    placeholder="Enter system protocol..."
                                />
                                <div className="absolute bottom-1 right-2 text-[8px] text-cyan-500/50 font-mono">{tempBio.length}/80</div>
                            </div>
                        ) : (
                            <div className="bg-black/20 border border-white/5 rounded-lg p-2 mb-3">
                                <p className="text-xs font-mono text-cyan-100/80 italic leading-relaxed">
                                    "{user.bio || "Data runner navigating the neon stream."}"
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-center sm:justify-start gap-2">
                            <span className="px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-800 text-[9px] text-cyan-300 font-mono">
                                OPERATOR
                            </span>
                            <span className="px-2 py-0.5 rounded bg-purple-950/50 border border-purple-800 text-[9px] text-purple-300 font-mono flex items-center gap-1">
                                <Shield className="w-3 h-3" /> SECURE
                            </span>
                        </div>
                    </div>
                </div>

                {/* XP Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                        <span>XP PROGRESS</span>
                        <span>{xp} / {((Math.floor(xp / 1000) + 1) * 1000)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 relative"
                            style={{ width: `${(xp % 1000) / 10}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[1px]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
                <button 
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 py-2 rounded-lg text-xs font-display font-bold transition-all ${activeTab === 'stats' ? 'bg-cyan-900/50 text-cyan-100 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                >
                    STATS
                </button>
                <button 
                    onClick={() => setActiveTab('badges')}
                    className={`flex-1 py-2 rounded-lg text-xs font-display font-bold transition-all ${activeTab === 'badges' ? 'bg-cyan-900/50 text-cyan-100 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                >
                    BADGES
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-2 rounded-lg text-xs font-display font-bold transition-all ${activeTab === 'settings' ? 'bg-cyan-900/50 text-cyan-100 shadow-sm' : 'text-slate-500 hover:text-white'}`}
                >
                    SYSTEM
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[200px] animate-[slideUp_0.3s_ease-out]">
                
                {activeTab === 'stats' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                            <div className="bg-cyan-500/20 p-2.5 rounded-full">
                                <Database className="w-5 h-5 text-cyan-400" />
                            </div>
                            <span className="text-2xl font-display font-bold text-white">{myCapsulesCount}</span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Memories Planted</span>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                            <div className="bg-purple-500/20 p-2.5 rounded-full">
                                <Activity className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-2xl font-display font-bold text-white">{synchronicityLevel}%</span>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Synchronicity</span>
                        </div>

                        <div className="col-span-2 bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="bg-emerald-500/20 p-2.5 rounded-full">
                                    <Map className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-display font-bold text-white">SECTOR 7G</span>
                                    <span className="text-[9px] font-mono text-slate-400 uppercase">Primary Operation Zone</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <span className="block text-xl font-display font-bold text-emerald-400">{accountAgeDays}</span>
                                <span className="text-[9px] font-mono text-slate-500">DAYS ACTIVE</span>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'badges' && (
                    <div className="grid grid-cols-3 gap-3">
                         {/* Badge 1 */}
                         <div className="aspect-square bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl flex flex-col items-center justify-center gap-2 group relative overflow-hidden">
                             <Award className="w-8 h-8 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                             <span className="text-[8px] font-mono text-amber-200 uppercase">First Contact</span>
                         </div>
                         {/* Badge 2 (Locked) */}
                         <div className="aspect-square bg-white/5 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 grayscale opacity-50">
                             <Map className="w-8 h-8 text-slate-400" />
                             <span className="text-[8px] font-mono text-slate-500 uppercase">Explorer</span>
                         </div>
                         {/* Badge 3 (Locked) */}
                         <div className="aspect-square bg-white/5 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-2 grayscale opacity-50">
                             <Share2 className="w-8 h-8 text-slate-400" />
                             <span className="text-[8px] font-mono text-slate-500 uppercase">Connector</span>
                         </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <Settings className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-mono text-slate-200">NEURAL FEEDBACK</span>
                            </div>
                            <ToggleRight className="w-8 h-8 text-cyan-400 cursor-pointer" />
                        </div>
                         <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                                <Map className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs font-mono text-slate-200">HIGH PRECISION GPS</span>
                            </div>
                            <ToggleRight className="w-8 h-8 text-cyan-400 cursor-pointer" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                             <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-mono text-slate-400">GHOST MODE</span>
                            </div>
                            <ToggleLeft className="w-8 h-8 text-slate-600 cursor-pointer" />
                        </div>
                    </div>
                )}

            </div>
            
            {/* Action Buttons */}
            <div className="pt-4 space-y-3">
                 <button 
                    onClick={onLogout}
                    className="w-full py-4 rounded-xl border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-900/40 active:scale-95 transition-all flex items-center justify-center gap-2 font-display font-bold tracking-widest text-xs uppercase"
                >
                    <LogOut className="w-4 h-4" />
                    DISCONNECT NEURAL LINK
                </button>
                <div className="text-center">
                    <p className="text-[8px] font-mono text-slate-600">
                        SESSION ID: {Math.random().toString(36).substring(7).toUpperCase()}
                    </p>
                </div>
            </div>

        </div>
    </div>
  );
};
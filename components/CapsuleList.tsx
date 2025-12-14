import React from 'react';
import { Lock, Unlock, MapPin, Clock, ImageIcon, Mic, Video } from 'lucide-react';
import { Capsule } from '../types';
import { calculateDistance, formatDistance } from '../utils/geoUtils';

interface CapsuleListProps {
  capsules: Capsule[];
  currentLocation: { latitude: number; longitude: number } | null;
  onBack: () => void;
}

export const CapsuleList: React.FC<CapsuleListProps> = ({ capsules, currentLocation, onBack }) => {
  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex justify-between items-center mb-6 border-b border-cyan-900 pb-4">
        <h2 className="text-xl font-display font-bold text-white">DETECTED TRACES</h2>
        <button onClick={onBack} className="text-cyan-500 font-mono text-sm hover:underline">
            {'< RETURN'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {capsules.length === 0 ? (
            <div className="text-center text-slate-500 font-mono mt-10">
                NO TRACES FOUND IN RANGE.
            </div>
        ) : (
            capsules.map((capsule) => {
                const distance = currentLocation 
                    ? calculateDistance(currentLocation, capsule.coordinates) 
                    : Infinity;
                
                // Unlock logic: User must be within 50 meters
                const isUnlockable = distance < 50; 

                return (
                    <div 
                        key={capsule.id} 
                        className={`
                            relative border p-4 rounded-lg transition-all duration-300
                            ${isUnlockable 
                                ? 'bg-cyan-950/30 border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                                : 'bg-slate-900/50 border-slate-700 opacity-70 grayscale'}
                        `}
                    >
                        {/* Header: Distance and Lock Status */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                {isUnlockable ? (
                                    <Unlock className="w-4 h-4 text-cyan-400" />
                                ) : (
                                    <Lock className="w-4 h-4 text-slate-500" />
                                )}
                                <span className={`font-mono text-xs ${isUnlockable ? 'text-cyan-400' : 'text-slate-500'}`}>
                                    {isUnlockable ? 'DECRYPTED' : 'ENCRYPTED'}
                                </span>
                            </div>
                            <span className="font-mono text-xs text-slate-400">
                                {formatDistance(distance)}
                            </span>
                        </div>
                        
                        {/* Location and Time Metadata */}
                         <div className="flex items-center gap-4 mb-3 border-b border-white/5 pb-2">
                             {capsule.locationName && (
                                <div className="flex items-center gap-1 text-xs text-cyan-200/70 font-display uppercase truncate max-w-[150px]">
                                    <MapPin className="w-3 h-3" />
                                    <span>{capsule.locationName}</span>
                                </div>
                             )}
                             <div className="flex items-center gap-1 text-xs text-slate-500 font-mono ml-auto">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(capsule.timestamp).toLocaleDateString()}</span>
                             </div>
                         </div>
                        
                        {/* Media Icons Preview (for Locked) */}
                        {!isUnlockable && (capsule.image || capsule.video || capsule.audio) && (
                            <div className="flex gap-2 mb-2">
                                {capsule.image && <ImageIcon className="w-4 h-4 text-slate-600" />}
                                {capsule.video && <Video className="w-4 h-4 text-slate-600" />}
                                {capsule.audio && <Mic className="w-4 h-4 text-slate-600" />}
                            </div>
                        )}

                        {isUnlockable ? (
                            <div className="space-y-3">
                                <p className="text-white font-mono text-sm border-l-2 border-cyan-700 pl-3 py-1 whitespace-pre-wrap">
                                    "{capsule.content}"
                                </p>
                                
                                {/* Image Display */}
                                {capsule.image && (
                                    <div className="relative rounded border border-cyan-900/50 overflow-hidden">
                                        <img src={capsule.image} alt="Trace Visual" className="w-full h-auto object-cover max-h-48 opacity-80" />
                                        <div className="absolute bottom-1 right-2 text-[8px] bg-black/60 px-1 text-cyan-400 font-mono">IMG_DATA</div>
                                    </div>
                                )}
                                
                                {/* Video Display */}
                                {capsule.video && (
                                    <div className="relative rounded border border-cyan-900/50 overflow-hidden">
                                        <video src={capsule.video} controls className="w-full h-auto max-h-48 opacity-90" />
                                        <div className="absolute top-1 right-2 text-[8px] bg-black/60 px-1 text-cyan-400 font-mono">VIDEO_FEED</div>
                                    </div>
                                )}

                                {/* Audio Display */}
                                {capsule.audio && (
                                    <div className="mt-2">
                                        <audio controls src={capsule.audio} className="w-full h-8 opacity-80" />
                                    </div>
                                )}

                                {capsule.aiAnalysis && (
                                    <div className="bg-black/40 p-2 rounded border border-purple-900/50">
                                        <p className="text-[10px] text-purple-400 uppercase font-bold mb-1">
                                            AI SYSTEM LOG:
                                        </p>
                                        <p className="text-xs text-purple-200 font-mono italic">
                                            {capsule.aiAnalysis}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-2">
                                <p className="text-slate-500 text-sm font-mono blur-[2px] select-none">
                                    xxxxxxxxxxxxxxxxxxxxxxxx
                                </p>
                                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-red-400 font-mono border border-red-900/30 bg-red-950/10 py-1">
                                    <MapPin className="w-3 h-3" />
                                    APPROACH TARGET TO DECRYPT
                                </div>
                            </div>
                        )}
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
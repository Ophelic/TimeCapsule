import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Cpu, MapPin, Sparkles, RefreshCw, MessageSquare, Edit3, Send, Mic, Image as ImageIcon, StopCircle, Trash2, Video, AlertTriangle } from 'lucide-react';
import { Coordinates } from '../types';
import { analyzeMemory, identifyLocation, enhanceContent, getChatResponse } from '../services/geminiService';

interface CreateCapsuleProps {
  location: Coordinates | null;
  onCancel: () => void;
  onSave: (content: string, aiAnalysis: string, locationName: string, image?: string, video?: string, audio?: string) => void;
}

type Mode = 'manual' | 'chat';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

// Helper: Convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const CreateCapsule: React.FC<CreateCapsuleProps> = ({ location, onCancel, onSave }) => {
  const [mode, setMode] = useState<Mode>('manual');
  const [content, setContent] = useState(''); // For manual mode
  
  // Media State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<string | null>(null); // Stored as Base64 for saving
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // For playback
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatThinking, setIsChatThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [locationName, setLocationName] = useState<string>('Triangulating...');

  // Identify location on mount
  useEffect(() => {
    let isMounted = true;
    const fetchLocation = async () => {
      if (location) {
        const name = await identifyLocation(location.latitude, location.longitude);
        if (isMounted) setLocationName(name);
      } else {
        setLocationName('Unknown Sector (No GPS)');
      }
    };
    fetchLocation();
    return () => { isMounted = false; };
  }, [location]);

  // Initial greeting when switching to chat mode
  useEffect(() => {
    if (mode === 'chat' && chatHistory.length === 0) {
        setChatHistory([{
            role: 'model',
            text: "Identity verified. I am the Archivist. What memory trace do you wish to implant in this sector?"
        }]);
    }
  }, [mode]);

  // Auto-scroll chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatThinking]);

  // Cleanup audio url
  useEffect(() => {
      return () => {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
      };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  const result = ev.target.result as string;
                  if (file.type.startsWith('image/')) {
                      setSelectedImage(result);
                      setSelectedVideo(null); // Exclusive selection logic for simplicity
                  } else if (file.type.startsWith('video/')) {
                      setSelectedVideo(result);
                      setSelectedImage(null);
                  }
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;
          
          const chunks: BlobPart[] = [];
          recorder.ondataavailable = (e) => chunks.push(e.data);
          recorder.onstop = async () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              setAudioUrl(url);
              const base64 = await blobToBase64(blob);
              setAudioBlob(base64);
              
              stream.getTracks().forEach(track => track.stop()); // Stop mic
          };
          
          recorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Mic Error:", err);
          alert("Microphone access needed to record audio logs.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const handleSendMessage = async () => {
      if (!chatInput.trim()) return;
      
      const userMsg = chatInput;
      setChatInput('');
      
      const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: userMsg }];
      setChatHistory(newHistory);
      setIsChatThinking(true);

      const apiHistory = newHistory.slice(0, -1).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
      }));
      
      const responseText = await getChatResponse(apiHistory, userMsg);
      
      setChatHistory(prev => [...prev, { role: 'model', text: responseText }]);
      setIsChatThinking(false);
  };

  const handleSave = async () => {
    // Determine content source
    let finalContent = "";
    if (mode === 'manual') {
        finalContent = content.trim();
        // If empty text but has media, generate a placeholder text
        if (!finalContent && (selectedImage || selectedVideo || audioBlob)) {
             finalContent = `[DATA LOG] Encrypted Media Attachment Detected. Type: ${selectedImage ? 'VISUAL' : ''} ${selectedVideo ? 'VIDEO' : ''} ${audioBlob ? 'AUDIO' : ''}`;
        }
    } else {
        if (chatHistory.length <= 1) return;
        finalContent = chatHistory.map(msg => {
            const label = msg.role === 'user' ? '[USER]' : '[ARCHIVIST]';
            return `${label}: ${msg.text}`;
        }).join('\n\n');
        finalContent = `--- NEURAL INTERVIEW LOG ---\n\n${finalContent}`;
    }

    if (!finalContent) return;

    setIsProcessing(true);
    
    // Append context for analysis if media exists
    const analysisContext = `${finalContent} ${selectedImage ? '[Contains Visual Data]' : ''} ${selectedVideo ? '[Contains Video Data]' : ''} ${audioBlob ? '[Contains Audio Data]' : ''}`;
    
    // Use fallback coordinates if GPS is missing (0,0)
    const lat = location?.latitude || 0;
    const lng = location?.longitude || 0;

    const analysis = await analyzeMemory(analysisContext, lat, lng);
    setIsProcessing(false);
    
    onSave(finalContent, analysis, locationName, selectedImage || undefined, selectedVideo || undefined, audioBlob || undefined);
  };

  const handleEnhance = async () => {
      if (!content.trim()) return;
      setIsEnhancing(true);
      const enhancedText = await enhanceContent(content);
      setContent(enhancedText);
      setIsEnhancing(false);
  };

  return (
    <div className="flex flex-col h-full px-4 pt-0 pb-4 relative max-w-lg mx-auto w-full">
       
       {/* Background Grid */}
       <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
       </div>

      <div className="z-10 flex justify-between items-center mb-4 border-b border-cyan-800/50 pb-2 shrink-0">
        <h2 className="text-xl font-display font-bold text-white tracking-wide">NEW TRACE</h2>
        <button onClick={onCancel} className="bg-white/5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="z-10 flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Location Badge */}
        <div className={`bg-slate-900/60 backdrop-blur border p-2.5 rounded-xl flex items-center justify-between shrink-0 shadow-lg ${location ? 'border-cyan-900' : 'border-amber-900/50'}`}>
            <div className={`flex items-center gap-2 overflow-hidden ${location ? 'text-cyan-400' : 'text-amber-500'}`}>
                <div className={`p-1.5 rounded-lg ${location ? 'bg-cyan-950/50' : 'bg-amber-950/50'}`}>
                     {location ? <MapPin className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </div>
                <span className="font-display text-xs truncate max-w-[150px]">{locationName}</span>
            </div>
            <div className="font-mono text-[9px] text-cyan-700 bg-black/30 px-2 py-1 rounded">
                {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "ERR: NO_SIGNAL"}
            </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-black/40 border border-cyan-900/50 rounded-lg p-1 shrink-0">
            <button 
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 rounded-md text-[10px] font-display font-bold flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'bg-cyan-900 text-white shadow-md' : 'text-slate-500 hover:text-cyan-400'}`}
            >
                <Edit3 className="w-3 h-3" /> MANUAL
            </button>
            <button 
                onClick={() => setMode('chat')}
                className={`flex-1 py-2 rounded-md text-[10px] font-display font-bold flex items-center justify-center gap-2 transition-all ${mode === 'chat' ? 'bg-purple-900 text-white shadow-md' : 'text-slate-500 hover:text-purple-400'}`}
            >
                <MessageSquare className="w-3 h-3" /> INTERVIEW
            </button>
        </div>

        {/* --- CONTENT AREA (SCROLLABLE) --- */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {mode === 'manual' && (
                <div className="flex flex-col gap-3 h-full">
                    <div className="flex justify-between items-center">
                        <label className="block text-cyan-500/80 text-[10px] font-mono uppercase tracking-wider">
                            Data Input
                        </label>
                        <button 
                            onClick={handleEnhance}
                            disabled={isEnhancing || !content}
                            className="flex items-center gap-1 text-[9px] bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 px-2 py-1 rounded-full hover:bg-cyan-900/50 disabled:opacity-30 transition-all"
                        >
                            {isEnhancing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI REWRITE
                        </button>
                    </div>
                    
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Log your memory fragment here..."
                        className={`
                            flex-1 w-full bg-black/30 border rounded-xl p-4 text-white font-mono placeholder-white/10 text-sm
                            focus:outline-none focus:ring-1 resize-none transition-colors duration-300
                            ${isEnhancing ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'border-cyan-800 focus:border-cyan-500'}
                        `}
                    />

                    {/* Media Attachments Section */}
                    <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                        <label className="block text-cyan-500/80 text-[10px] font-mono uppercase tracking-wider mb-2">
                            Attachments
                        </label>
                        
                        <div className="flex gap-2 mb-3">
                            {/* Audio Button */}
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                                    isRecording 
                                        ? 'bg-red-900/50 border-red-500 text-red-100 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/30'
                                }`}
                            >
                                {isRecording ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                <span className="text-[10px] font-display font-bold">{isRecording ? 'STOP' : 'AUDIO'}</span>
                            </button>

                            {/* Image/Video Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 py-3 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/30 flex items-center justify-center gap-2 transition-all"
                            >
                                <div className="flex gap-1">
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="text-white/20">/</span>
                                    <Video className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-display font-bold">MEDIA</span>
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept="image/*,video/*" 
                                className="hidden" 
                                onChange={handleFileSelect}
                            />
                        </div>

                        {/* Previews */}
                        {(selectedImage || selectedVideo || audioUrl) && (
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {selectedImage && (
                                    <div className="relative group shrink-0">
                                        <img src={selectedImage} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-cyan-500/30" />
                                        <button 
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute -top-2 -right-2 bg-red-900 text-white rounded-full p-1 border border-red-500 shadow-md"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                
                                {selectedVideo && (
                                    <div className="relative group shrink-0 w-16 h-16 bg-black rounded-lg border border-cyan-500/30 overflow-hidden flex items-center justify-center">
                                        <video src={selectedVideo} className="w-full h-full object-cover opacity-80" muted />
                                        <Video className="absolute w-6 h-6 text-white/50" />
                                        <button 
                                            onClick={() => setSelectedVideo(null)}
                                            className="absolute -top-2 -right-2 bg-red-900 text-white rounded-full p-1 border border-red-500 shadow-md z-10"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                
                                {audioUrl && (
                                    <div className="relative flex items-center justify-center bg-cyan-950/40 border border-cyan-500/30 rounded-lg h-16 px-3 min-w-[150px] shrink-0">
                                        <div className="w-full flex items-center gap-2">
                                            <Mic className="w-4 h-4 text-cyan-400" />
                                            <div className="h-1 flex-1 bg-cyan-900/50 rounded-full overflow-hidden">
                                                <div className="h-full w-2/3 bg-cyan-400 animate-pulse"></div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setAudioUrl(null); setAudioBlob(null); }}
                                            className="absolute -top-2 -right-2 bg-red-900 text-white rounded-full p-1 border border-red-500 shadow-md"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- CHAT MODE --- */}
            {mode === 'chat' && (
                <div className="flex flex-col h-full bg-black/20 border border-purple-900/30 rounded-xl overflow-hidden relative">
                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-mono border backdrop-blur-sm ${
                                    msg.role === 'user' 
                                        ? 'bg-cyan-900/40 border-cyan-500/30 text-cyan-50 rounded-br-sm' 
                                        : 'bg-purple-900/40 border-purple-500/30 text-purple-50 rounded-bl-sm'
                                }`}>
                                    <div className="flex items-center gap-1 mb-1 opacity-60 text-[9px] uppercase font-bold tracking-wider">
                                        {msg.role === 'user' ? 'YOU' : 'ARCHIVIST'}
                                    </div>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isChatThinking && (
                            <div className="flex justify-start">
                                <div className="bg-purple-900/20 border border-purple-500/20 p-2 rounded-xl rounded-bl-sm">
                                    <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-2 bg-black/40 border-t border-white/5 flex gap-2">
                        <input 
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a response..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500/50"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isChatThinking || !chatInput.trim()}
                            className="p-2 bg-purple-600/80 rounded-full text-white shadow-[0_0_10px_rgba(147,51,234,0.3)] disabled:opacity-50 disabled:shadow-none"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="mt-4 z-10 shrink-0">
          <button
              onClick={handleSave}
              disabled={isProcessing || (mode === 'manual' ? (!content && !selectedImage && !selectedVideo && !audioBlob) : chatHistory.length <= 1)}
              className={`
                  w-full py-4 rounded-xl border backdrop-blur font-display font-bold tracking-widest uppercase text-sm
                  active:scale-[0.98] transition-all flex items-center justify-center gap-2
                  ${isProcessing ? 'opacity-80 border-cyan-500/50 bg-cyan-900/80' : 
                    (!location ? 'border-amber-500/50 bg-amber-900/60 text-amber-100 hover:bg-amber-800/80' : 
                    'border-cyan-500/50 bg-cyan-900/80 text-cyan-100 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]')}
              `}
          >
              {isProcessing ? (
                  <>
                      <Cpu className="w-5 h-5 animate-spin text-cyan-400" />
                      PROCESSING...
                  </>
              ) : (
                  <>
                      {!location ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : <Save className="w-5 h-5 text-cyan-400" />}
                      {!location ? 'INITIALIZE (OFFLINE MODE)' : 'INITIALIZE DROP'}
                  </>
              )}
          </button>
          {!location && (
               <p className="text-[9px] text-amber-500/70 font-mono text-center mt-2">
                   WARNING: GEOTAG DATA MISSING. DROP WILL BE CACHED LOCALLY.
               </p>
          )}
      </div>
    </div>
  );
};
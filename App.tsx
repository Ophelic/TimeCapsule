import React, { useState, useEffect, useCallback } from 'react';
import { Capsule, Coordinates, ViewState, User } from './types';
import { RadarView } from './components/RadarView';
import { CreateCapsule } from './components/CreateCapsule';
import { CapsuleList } from './components/CapsuleList';
import { ARView } from './components/ARView';
import { ProfileView } from './components/ProfileView';
import { SignalComposer } from './components/SignalComposer';
import { calculateDistance } from './utils/geoUtils';
import { BackgroundParticles } from './components/BackgroundParticles';
import { SplashScreen } from './components/SplashScreen';
import { IntroSequence } from './components/IntroSequence';
import { BackgroundAudio } from './components/BackgroundAudio';
import { LoginScreen } from './components/LoginScreen';
import { getStoredSession, logoutUser, updateUserSession } from './services/authService';
import { Radio } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'splash' | 'intro' | 'login' | 'main'>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [currentView, setCurrentView] = useState<ViewState>('radar');
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [nearbyCapsules, setNearbyCapsules] = useState<Capsule[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('SYSTEM INITIALIZING...');

  // 1. Check for existing session on mount
  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      setCurrentUser(session);
    }
  }, []);

  // 2. Load Data SPECIFIC to the Current User
  useEffect(() => {
    if (currentUser) {
      // Key includes user ID to separate data per account
      const storageKey = `TIMECAPSULE_DATA_${currentUser.id}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        setCapsules(JSON.parse(savedData));
      } else {
        setCapsules([]); // Reset if new user has no data
      }
    }
  }, [currentUser]);

  // 3. Save Data SPECIFIC to the Current User
  useEffect(() => {
    if (currentUser) {
      const storageKey = `TIMECAPSULE_DATA_${currentUser.id}`;
      localStorage.setItem(storageKey, JSON.stringify(capsules));
    }
  }, [capsules, currentUser]);

  // GPS Watcher
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatusMessage('ERROR: GPS MODULE NOT FOUND');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatusMessage('GPS LOCKED. SYSTEM ONLINE.');
      },
      (error) => {
        console.error(error);
        setStatusMessage('WARNING: GPS SIGNAL LOST');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Filter nearby capsules whenever location or capsules change
  useEffect(() => {
    if (location) {
      // Find capsules within 1000 meters (1km) for the radar count
      const nearby = capsules.filter(c => calculateDistance(location, c.coordinates) <= 1000);
      setNearbyCapsules(nearby);
    }
  }, [location, capsules]);

  const handleScan = useCallback(() => {
    // Allow scan even if location is null for UX demo purposes, but warn
    if (!location) {
        setStatusMessage("WARNING: SATELLITE LINK UNSTABLE. SCANNING CACHED SECTOR...");
    } else {
        setStatusMessage("SCANNING LOCAL SECTOR (1KM RADIUS)...");
    }
    
    setIsScanning(true);
    
    // Fake scan delay for effect
    setTimeout(() => {
      setIsScanning(false);
      if (nearbyCapsules.length > 0) {
        setStatusMessage(`${nearbyCapsules.length} SIGNALS DETECTED. ENGAGING HUD.`);
        // Switch to AR View when signals are found
        setCurrentView('ar-view');
      } else {
        setStatusMessage("NO TRACES FOUND IN SECTOR.");
      }
    }, 2000);
  }, [location, nearbyCapsules]);

  const handleSaveCapsule = (content: string, aiAnalysis: string, locationName: string, image?: string, video?: string, audio?: string, signalData?: string) => {
    if (!currentUser) return;

    // Use actual location or fallback 0,0 if GPS is dead, to ensure function works
    const activeLocation = location || { latitude: 0, longitude: 0 };

    const newCapsule: Capsule = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      coordinates: activeLocation,
      locationName: locationName,
      aiAnalysis,
      isLocked: false, // Initially unlocked for the creator
      image,
      video,
      audio,
      signalData,
      userId: currentUser.id // Bind to user
    };

    setCapsules(prev => [...prev, newCapsule]);
    setCurrentView('radar');
    setStatusMessage("MEMORY TRACE ESTABLISHED.");
  };

  const handleBroadcastSignal = (grid: boolean[][]) => {
      const serializedGrid = JSON.stringify(grid);
      const content = "ENCRYPTED AUDIO SIGNAL [8-BIT SEQUENCE]";
      const analysis = "Detecting rhythmic pattern. Artificial origin confirmed.";
      
      handleSaveCapsule(
          content, 
          analysis, 
          "Signal Origin Point", 
          undefined, 
          undefined, 
          undefined, 
          serializedGrid
      );
      
      setStatusMessage("SIGNAL BROADCAST COMPLETE.");
  };

  const handleSplashComplete = () => {
      // Always show Intro for effect, then decide where to go
      setAppState('intro');
  };

  const handleIntroComplete = () => {
      // If session exists, go to main, else login
      if (currentUser) {
          setAppState('main');
      } else {
          setAppState('login');
      }
  };

  const handleLoginSuccess = (user: User) => {
      setCurrentUser(user);
      setAppState('main');
  };

  const handleLogout = () => {
      logoutUser();
      setCurrentUser(null);
      setAppState('login');
      setCapsules([]); // Clear current memory view
      setCurrentView('radar'); // Reset view
  };
  
  const handleUpdateUser = (updatedUser: User) => {
      setCurrentUser(updatedUser);
      updateUserSession(updatedUser);
  };

  // --- RENDER LOGIC ---

  return (
    // Main container has transparent background to show particle system (which is fixed at z-0)
    <div className="h-screen w-full text-white font-sans overflow-hidden flex flex-col relative bg-transparent touch-none">
      
      {/* Global Audio Controller - Persistent across states */}
      <BackgroundAudio variant={appState === 'main' ? 'user' : 'system'} />
      
      {/* 1. SPLASH STATE */}
      {appState === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}

      {/* 2. INTRO STATE */}
      {appState === 'intro' && (
        <IntroSequence onComplete={handleIntroComplete} />
      )}

      {/* 3. LOGIN STATE */}
      {appState === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {/* 4. MAIN APP STATE */}
      {appState === 'main' && (
        <>
            {/* 3D Particle Background - Only visible in Radar/Capsule View */}
            {['radar', 'view-capsule', 'create'].includes(currentView) && <BackgroundParticles />}

            {/* Header / Status Bar - Hidden in AR, Profile, and Signal Composer */}
            {['radar', 'view-capsule', 'create'].includes(currentView) && (
                <header className="absolute top-0 left-0 w-full pt-safe-top z-50 px-4 py-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-none">
                    <div className="pointer-events-auto">
                        <h1 className="text-lg font-display font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                        TIME <span className="text-white">CAPSULE</span>
                        </h1>
                        
                        {/* User Profile Trigger */}
                        {currentUser && (
                            <button 
                            onClick={() => setCurrentView('profile')}
                            className="flex items-center gap-2 mt-1.5 group"
                            >
                                <div className="relative">
                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-cyan-500/50 group-hover:border-cyan-400 transition-colors">
                                        <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-black"></div>
                                </div>
                                <span className="text-[10px] font-mono text-cyan-200/70 uppercase tracking-wide truncate max-w-[100px] group-hover:text-cyan-100">
                                    {currentUser.username}
                                </span>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-end pointer-events-auto mt-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-mono uppercase tracking-widest ${location ? 'text-cyan-400' : 'text-amber-400 animate-pulse'}`}>
                                {location ? 'GPS:LOCK' : 'GPS:SCAN'}
                            </span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-500 bg-black/40 px-1 rounded backdrop-blur-sm border border-white/5">
                        {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "SEARCHING..."}
                        </span>
                    </div>
                </header>
            )}

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden z-10 flex flex-col pt-16 pb-12">
                {/* CRT Scanline Effect Overlay - Hidden in AR and Profile view */}
                {currentView !== 'ar-view' && currentView !== 'profile' && currentView !== 'signal-composer' && (
                    <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] opacity-80 mix-blend-overlay"></div>
                )}
                
                {currentView === 'radar' && (
                <>
                    <RadarView 
                    nearbyCount={nearbyCapsules.length} 
                    scanning={isScanning}
                    onScan={handleScan}
                    onCreate={() => setCurrentView('create')}
                    onCompose={() => setCurrentView('signal-composer')}
                    />
                    {/* Direct List Access Button */}
                    <div className="absolute bottom-20 left-0 w-full flex justify-center z-20 pointer-events-none">
                        <button 
                            onClick={() => setCurrentView('view-capsule')}
                            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-cyan-900/30 text-cyan-500/70 text-[10px] font-mono hover:bg-black/60 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
                        >
                            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                            MANUAL_OVERRIDE_LIST
                        </button>
                    </div>
                </>
                )}

                {currentView === 'create' && (
                <CreateCapsule 
                    location={location}
                    onCancel={() => setCurrentView('radar')}
                    onSave={handleSaveCapsule}
                />
                )}

                {currentView === 'view-capsule' && (
                <CapsuleList 
                    capsules={nearbyCapsules}
                    currentLocation={location}
                    onBack={() => setCurrentView('radar')}
                />
                )}

                {currentView === 'ar-view' && location && (
                    <ARView 
                        capsules={nearbyCapsules}
                        userLocation={location}
                        onBack={() => setCurrentView('radar')}
                    />
                )}

                {/* Profile View - Full Screen Overlay */}
                {currentView === 'profile' && currentUser && (
                    <div className="absolute inset-0 z-50 bg-[#050505] animate-[fadeIn_0.3s_ease-out]">
                        <ProfileView 
                            user={currentUser}
                            capsules={capsules}
                            onBack={() => setCurrentView('radar')}
                            onLogout={handleLogout}
                            onUpdateUser={handleUpdateUser}
                        />
                    </div>
                )}

                {/* Signal Composer - Full Screen Overlay */}
                {currentView === 'signal-composer' && (
                    <div className="absolute inset-0 z-50 bg-[#050505] animate-[fadeIn_0.3s_ease-out] pb-0 pt-0">
                        <SignalComposer 
                            onCancel={() => setCurrentView('radar')}
                            onTransmit={handleBroadcastSignal}
                        />
                    </div>
                )}
            </main>

            {/* Footer Status Pill - Floating above bottom */}
            {['radar', 'create', 'view-capsule'].includes(currentView) && (
                <div className="absolute bottom-6 left-0 w-full flex justify-center z-40 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2">
                        <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
                        <p className="font-mono text-[9px] text-cyan-100/80 uppercase tracking-widest">
                            {statusMessage}
                        </p>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default App;
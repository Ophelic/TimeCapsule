import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Capsule, Coordinates } from '../types';
import { calculateBearing, calculateDistance } from '../utils/geoUtils';
import { X, AlertTriangle, Compass, Camera, Zap, MapPin, Clock, Scan, Hand, ImageIcon, Mic, Video as VideoIcon } from 'lucide-react';

interface ARViewProps {
  capsules: Capsule[];
  userLocation: Coordinates;
  onBack: () => void;
}

// MediaPipe globals declaration
declare global {
  interface Window {
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

export const ARView: React.FC<ARViewProps> = ({ capsules, userLocation, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Three.js layer
  const handCanvasRef = useRef<HTMLCanvasElement>(null); // Hand Tracking layer
  const [error, setError] = useState<string | null>(null);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [debugStatus, setDebugStatus] = useState("INITIALIZING OPTICS...");
  const [streamActive, setStreamActive] = useState(false);
  const [handGesture, setHandGesture] = useState<'OPEN' | 'CLOSED' | 'NONE'>('NONE');
  const [handDetected, setHandDetected] = useState(false);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const capsulesRef = useRef<{ 
      group: THREE.Group; 
      core: THREE.Mesh; 
      ring1: THREE.Mesh; 
      ring2: THREE.Mesh; 
      id: string 
  }[]>([]);
  const gestureDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. Camera Initialization ---
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let isMounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) setError("CAMERA NOT DETECTED");
        return;
      }

      try {
        // Prefer environment (back) camera
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
          });
        } catch (err) {
          console.warn("Back camera failed, trying front...", err);
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (isMounted && videoRef.current && currentStream) {
          videoRef.current.srcObject = currentStream;
          await videoRef.current.play();
          setStreamActive(true);
          setDebugStatus("SENSORS ONLINE. SEARCHING...");
        }
      } catch (err: any) {
        console.error("Camera Error:", err);
        if (isMounted) setError("CAMERA ACCESS DENIED");
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // --- 2. Enhanced MediaPipe Hand Tracking ---
  useEffect(() => {
      if (!window.Hands) return;
      
      const hands = new window.Hands({locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }});
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0, // Lite model for performance
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results: any) => {
        if (!handCanvasRef.current) return;
        const ctx = handCanvasRef.current.getContext('2d');
        if (!ctx) return;
        
        ctx.save();
        ctx.clearRect(0, 0, handCanvasRef.current.width, handCanvasRef.current.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setHandDetected(true);
            setDebugStatus("TARGET ACQUIRED");
            
            for (const landmarks of results.multiHandLandmarks) {
                drawSciFiHandOverlay(ctx, landmarks);
                detectGesture(landmarks);
            }
        } else {
            setHandDetected(false);
            setHandGesture('NONE');
            if(streamActive) setDebugStatus("SCANNING FOR HAND SIGNAL...");
        }
        ctx.restore();
      });

      let frameId: number;
      const processVideo = async () => {
          if (videoRef.current && videoRef.current.readyState === 4 && streamActive) {
             await hands.send({image: videoRef.current});
          }
          frameId = requestAnimationFrame(processVideo);
      };
      
      if (streamActive) {
          processVideo();
      }

      return () => {
          cancelAnimationFrame(frameId);
          hands.close();
      };
  }, [streamActive]);

  // --- Custom Drawing for Sci-Fi Effect ---
  const drawSciFiHandOverlay = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;

      // Helper to map normalized coordinates to canvas
      const toPixel = (lm: any) => ({ x: lm.x * width, y: lm.y * height });

      // Draw Skeleton
      if (window.drawConnectors) {
          window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
              color: '#06b6d4', // Cyan 500
              lineWidth: 1
          });
      }

      // Draw Joint Nodes
      landmarks.forEach((lm) => {
          const p = toPixel(lm);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#22d3ee'; // Cyan 400
          ctx.fill();
      });

      // Calculate Bounding Box
      let minX = width, minY = height, maxX = 0, maxY = 0;
      landmarks.forEach(lm => {
          const p = toPixel(lm);
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
      });

      // Add padding
      const pad = 20;
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;

      // Draw Tech Bounding Box
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Top Left Corner
      ctx.moveTo(minX, minY + 20); ctx.lineTo(minX, minY); ctx.lineTo(minX + 20, minY);
      // Top Right Corner
      ctx.moveTo(maxX - 20, minY); ctx.lineTo(maxX, minY); ctx.lineTo(maxX, minY + 20);
      // Bottom Right Corner
      ctx.moveTo(maxX, maxY - 20); ctx.lineTo(maxX, maxY); ctx.lineTo(maxX - 20, maxY);
      // Bottom Left Corner
      ctx.moveTo(minX + 20, maxY); ctx.lineTo(minX, maxY); ctx.lineTo(minX, maxY - 20);
      
      ctx.stroke();

      // Label
      ctx.fillStyle = '#22d3ee';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText('TRACKING ID: 0x' + Math.floor(Math.random()*9999), minX, minY - 8);
  };

  const detectGesture = (landmarks: any[]) => {
      // 0=Wrist, 9=MiddleMCP (Knuckle)
      // Calculate "Palm Size" as the reference ruler
      const wrist = landmarks[0];
      const middleMCP = landmarks[9];
      const palmSize = Math.sqrt(
          Math.pow(middleMCP.x - wrist.x, 2) + 
          Math.pow(middleMCP.y - wrist.y, 2)
      );

      let foldedFingers = 0;
      
      // Check 4 fingers (Index, Middle, Ring, Pinky)
      // Tips: 8, 12, 16, 20
      const tips = [8, 12, 16, 20];
      
      tips.forEach(tipIdx => {
          const tip = landmarks[tipIdx];
          const distToWrist = Math.sqrt(
              Math.pow(tip.x - wrist.x, 2) + 
              Math.pow(tip.y - wrist.y, 2)
          );
          
          // If the tip is closer to the wrist than 1.6x the palm size, it's considered folded.
          // (An open finger is usually > 2.0x palm size)
          if (distToWrist < palmSize * 1.6) {
              foldedFingers++;
          }
      });

      // Check Thumb (Tip 4) - Thumbs are shorter, use smaller ratio
      const thumbTip = landmarks[4];
      const thumbDist = Math.sqrt(
          Math.pow(thumbTip.x - wrist.x, 2) + 
          Math.pow(thumbTip.y - wrist.y, 2)
      );
      if (thumbDist < palmSize * 1.3) {
          foldedFingers++;
      }

      // Determine State
      let newState: 'OPEN' | 'CLOSED' | 'NONE' = 'NONE';
      
      // 4 or 5 fingers folded = FIST
      if (foldedFingers >= 4) {
          newState = 'CLOSED';
      } 
      // 0 or 1 finger folded = OPEN HAND
      else if (foldedFingers <= 1) {
          newState = 'OPEN';
      }

      // Debounce logic to prevent flickering
      if (newState !== 'NONE' && newState !== handGesture) {
          // If we detect a definitive state, switch to it
          setHandGesture(newState);
      } else if (newState === 'NONE' && handGesture !== 'NONE') {
          // If state is ambiguous, hold previous state briefly (hysteresis) or reset
          // For now, let's reset if it persists, but we'll leave it as is to avoid flicker
      }
  };

  // --- 3. Interaction Logic ---
  useEffect(() => {
    if (handGesture === 'OPEN' && !selectedCapsule) {
        // Open hand selects the closest capsule regardless of distance (within scan range)
        if (capsules.length > 0) {
            const sorted = [...capsules].sort((a, b) => {
                return calculateDistance(userLocation, a.coordinates) - calculateDistance(userLocation, b.coordinates);
            });
            // Select the nearest one
            setSelectedCapsule(sorted[0]);
        }
    } else if (handGesture === 'CLOSED' && selectedCapsule) {
        // Closed fist closes the modal
        setSelectedCapsule(null);
    }
  }, [handGesture, capsules, userLocation, selectedCapsule]);

  // --- 4. Canvas Resizing ---
  useEffect(() => {
      const handleResize = () => {
          if (handCanvasRef.current) {
              handCanvasRef.current.width = window.innerWidth;
              handCanvasRef.current.height = window.innerHeight;
          }
      };
      window.addEventListener('resize', handleResize);
      handleResize(); 
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 5. Three.js Scene Setup (The "Cool" Part) ---
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current, 
        alpha: true, 
        antialias: true 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); 
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x22d3ee, 2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    let animationId: number;
    let time = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      time += 0.015;

      // Animate all capsules
      capsulesRef.current.forEach(({ group, core, ring1, ring2 }) => {
        // Floating effect (Bobbing up and down)
        group.position.y = Math.sin(time) * 0.5;

        // Core Pulse
        const scale = 1 + Math.sin(time * 3) * 0.1;
        core.scale.set(scale, scale, scale);

        // Rotation
        group.rotation.y += 0.005; // Whole group slow rotate
        core.rotation.y -= 0.02;   // Core spin
        core.rotation.z += 0.01;
        
        ring1.rotation.x += 0.02;  // Vertical Ring
        ring1.rotation.y += 0.01;
        
        ring2.rotation.z -= 0.03;  // Horizontal/Angled Ring
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      renderer.dispose();
    };
  }, []);

  // --- 6. Capsule Object Creation ---
  useEffect(() => {
    if (!sceneRef.current || !userLocation) return;
    const scene = sceneRef.current;

    // Clear old meshes
    capsulesRef.current.forEach(({ group }) => scene.remove(group));
    capsulesRef.current = [];

    capsules.forEach(capsule => {
      const distance = calculateDistance(userLocation, capsule.coordinates);
      const bearing = calculateBearing(userLocation, capsule.coordinates);
      
      const angleRad = (90 - bearing) * (Math.PI / 180);
      const visualDistance = Math.max(5, Math.min(distance / 5, 50));
      
      const x = Math.cos(angleRad) * visualDistance;
      const z = -Math.sin(angleRad) * visualDistance;
      
      const group = new THREE.Group();
      group.position.set(x, 0, z); 
      
      const isUnlockable = distance < 50;
      const mainColor = isUnlockable ? 0x22d3ee : 0xff0055; // Cyan or Red
      const secondaryColor = isUnlockable ? 0xccffff : 0xffaaaa;

      // 1. THE CORE (Glowing center)
      const coreGeo = new THREE.IcosahedronGeometry(0.6, 1);
      const coreMat = new THREE.MeshStandardMaterial({
        color: mainColor,
        emissive: mainColor,
        emissiveIntensity: 1.5,
        roughness: 0.1,
        metalness: 0.8,
        wireframe: false
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // 2. OUTER SHELL (Wireframe cage)
      const shellGeo = new THREE.OctahedronGeometry(1.2, 0);
      const shellMat = new THREE.MeshBasicMaterial({
        color: secondaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      const shell = new THREE.Mesh(shellGeo, shellMat);
      group.add(shell);

      // 3. RING 1 (Vertical)
      const ringGeo = new THREE.TorusGeometry(1.8, 0.03, 16, 50);
      const ringMat = new THREE.MeshBasicMaterial({ color: mainColor, transparent: true, opacity: 0.6 });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring1);

      // 4. RING 2 (Larger, Angled)
      const ring2Geo = new THREE.TorusGeometry(2.2, 0.02, 16, 50);
      const ring2 = new THREE.Mesh(ring2Geo, ringMat);
      ring2.rotation.x = Math.PI / 2;
      group.add(ring2);
      
      scene.add(group);
      capsulesRef.current.push({ group, core, ring1, ring2, id: capsule.id });
    });

  }, [capsules, userLocation]);

  // --- 7. Orientation Handling ---
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!cameraRef.current) return;
      const alpha = event.alpha ? THREE.MathUtils.degToRad(event.alpha) : 0;
      const heading = (event as any).webkitCompassHeading 
        ? THREE.MathUtils.degToRad((event as any).webkitCompassHeading) 
        : alpha;
      const rotation = (event as any).webkitCompassHeading ? -heading : heading;
      cameraRef.current.rotation.y = rotation;
    };
    if (permissionGranted) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permissionGranted]);

  const handleManualPlay = () => {
     if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.play()
             .then(() => {
                 setError(null);
                 setStreamActive(true);
             })
             .catch(e => setError("MANUAL START FAILED"));
     }
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!cameraRef.current || !sceneRef.current) return;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    if (intersects.length > 0) {
      // Traverse up to find the group
      let obj = intersects[0].object;
      while(obj.parent && obj.parent.type !== 'Scene') {
          obj = obj.parent;
      }
      
      const capsuleRef = capsulesRef.current.find(c => c.group === obj);
      if (capsuleRef) {
        const capsule = capsules.find(c => c.id === capsuleRef.id);
        if (capsule) setSelectedCapsule(capsule);
      }
    }
  };

  const requestOrientationPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') setPermissionGranted(true);
      } catch (e) { console.error(e); }
    } else {
      setPermissionGranted(true);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
        {/* Layer 1: Live Video */}
        <video 
            ref={videoRef}
            playsInline
            webkit-playsinline="true"
            muted
            autoPlay
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-80"
        />
        
        {/* Layer 2: 3D Capsules */}
        <canvas 
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="absolute inset-0 w-full h-full z-10"
        />

        {/* Layer 3: Hand Tracking Visuals (Skeleton) */}
        <canvas 
            ref={handCanvasRef}
            className="absolute inset-0 w-full h-full z-20 pointer-events-none opacity-90"
        />

        {/* Layer 4: Cyberpunk HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4">
            
            {/* Top Bar */}
            <div className="flex justify-between items-start">
                {/* Status Box */}
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-tr-2xl rounded-bl-2xl border-l-2 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.2)] max-w-[200px]">
                    <div className="flex items-center gap-2 mb-1">
                        <Camera className={`w-4 h-4 ${streamActive ? 'text-green-400' : 'text-red-400'}`} />
                        <span className="text-cyan-100 font-display font-bold text-xs tracking-wider">
                            OPTICAL FEED
                        </span>
                    </div>
                    
                    {/* Dynamic Status Text */}
                    <div className="font-mono text-[10px] text-cyan-400 mb-2">
                        {debugStatus}
                    </div>

                    {/* Hand Status Indicator */}
                    <div className={`flex items-center gap-2 border-t pt-2 transition-colors duration-300 ${handGesture === 'CLOSED' ? 'border-red-500 bg-red-900/20' : 'border-cyan-900/50'}`}>
                        <Hand className={`w-4 h-4 ${handGesture === 'CLOSED' ? 'text-red-400' : (handGesture === 'OPEN' ? 'text-green-400' : 'text-slate-600')}`} />
                        <div className="flex flex-col">
                            <span className={`text-[9px] font-bold ${handGesture === 'CLOSED' ? 'text-red-300' : (handGesture === 'OPEN' ? 'text-green-300' : 'text-slate-500')}`}>
                                {handDetected ? `GESTURE: ${handGesture}` : 'NO HAND SIGNAL'}
                            </span>
                        </div>
                    </div>
                </div>

                <button onClick={onBack} className="pointer-events-auto bg-black/60 backdrop-blur p-2 rounded border border-red-500/50 text-red-400 hover:bg-red-900/40">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Center Reticle (Hidden when capsule selected) */}
            {!selectedCapsule && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-60">
                    <div className="w-64 h-64 border border-cyan-500/20 rounded-full absolute animate-[ping_3s_infinite]"></div>
                    <div className="w-16 h-16 border-t-2 border-b-2 border-cyan-400 rounded-lg absolute"></div>
                    <div className="w-1 h-4 bg-cyan-400 absolute top-[-20px]"></div>
                    <div className="w-1 h-4 bg-cyan-400 absolute bottom-[-20px]"></div>
                    <div className="w-4 h-1 bg-cyan-400 absolute left-[-20px]"></div>
                    <div className="w-4 h-1 bg-cyan-400 absolute right-[-20px]"></div>
                    {/* Dynamic Center Dot */}
                    <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${handGesture === 'OPEN' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : (handGesture === 'CLOSED' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-cyan-500')}`}></div>
                </div>
            )}

            {/* Bottom Controls */}
            <div className="w-full flex flex-col items-center gap-4 mb-4">
                 {!streamActive && !error && (
                    <button 
                        onClick={handleManualPlay}
                        className="pointer-events-auto bg-yellow-600/90 text-white px-6 py-3 rounded-full font-bold animate-pulse"
                    >
                        INITIALIZE VIDEO LINK
                    </button>
                 )}
                {!permissionGranted && !error && streamActive && (
                    <button 
                        onClick={requestOrientationPermission}
                        className="pointer-events-auto bg-cyan-900/80 backdrop-blur text-cyan-100 font-bold px-6 py-2 rounded-none border-b-2 border-cyan-400 font-display uppercase hover:bg-cyan-800 flex items-center gap-2"
                    >
                        <Compass className="w-4 h-4" />
                        Calibrate Compass
                    </button>
                )}
                {handDetected && (
                     <div className="bg-black/80 px-4 py-2 rounded-full border border-purple-500/50 text-purple-300 font-mono text-[10px] animate-pulse">
                        COMMANDS: OPEN HAND = INTERACT | FIST = CLOSE
                     </div>
                )}
            </div>
        </div>

        {/* Selected Capsule Details Panel */}
        {selectedCapsule && (
            <div className="absolute bottom-0 left-0 w-full p-6 z-40 bg-gradient-to-t from-black via-black/95 to-transparent pt-12 animate-[slideUp_0.3s_ease-out]">
                {/* Decorative Tech Lines */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-cyan-400 font-display text-2xl tracking-wider uppercase glitch-text" data-text="DATA FRAGMENT">
                            DATA FRAGMENT
                        </h3>
                        <div className="h-1 w-12 bg-cyan-500 mt-1"></div>
                    </div>
                    <button onClick={() => setSelectedCapsule(null)} className="text-slate-400 pointer-events-auto hover:text-white border border-slate-700 p-1 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {calculateDistance(userLocation, selectedCapsule.coordinates) < 50 ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="flex gap-4 text-xs font-mono text-cyan-600/80 uppercase">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedCapsule.locationName || "Unknown Sector"}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedCapsule.timestamp).toLocaleDateString()}</span>
                        </div>

                        <div className="relative bg-cyan-950/20 p-5 border-l-2 border-r-2 border-cyan-500/50 rounded-sm">
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400"></div>
                            <p className="text-cyan-50 font-mono text-base leading-relaxed drop-shadow-[0_0_5px_rgba(34,211,238,0.5)] whitespace-pre-wrap">
                                "{selectedCapsule.content}"
                            </p>
                            
                            {/* Image Display */}
                            {selectedCapsule.image && (
                                <div className="mt-4 relative rounded border border-cyan-900/50 overflow-hidden">
                                    <img src={selectedCapsule.image} alt="Trace Visual" className="w-full h-auto object-cover opacity-90" />
                                    <div className="absolute bottom-1 right-2 text-[8px] bg-black/60 px-1 text-cyan-400 font-mono">IMG_DATA_RESTORED</div>
                                </div>
                            )}

                             {/* Video Display */}
                             {selectedCapsule.video && (
                                <div className="mt-4 relative rounded border border-cyan-900/50 overflow-hidden">
                                    <video src={selectedCapsule.video} controls className="w-full h-auto max-h-48 opacity-90" />
                                    <div className="absolute top-1 right-2 text-[8px] bg-black/60 px-1 text-cyan-400 font-mono">VIDEO_FEED</div>
                                </div>
                            )}

                            {/* Audio Display */}
                            {selectedCapsule.audio && (
                                <div className="mt-4">
                                    <div className="flex items-center gap-2 mb-1 text-xs text-cyan-400 font-mono">
                                        <Mic className="w-3 h-3" /> AUDIO LOG RECOVERED
                                    </div>
                                    <audio controls src={selectedCapsule.audio} className="w-full h-8 opacity-80" />
                                </div>
                            )}
                        </div>
                        
                        {selectedCapsule.aiAnalysis && (
                            <div className="flex items-start gap-3 bg-purple-900/10 p-3 rounded border border-purple-500/20">
                                <Zap className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                                <div className="font-mono text-xs">
                                    <span className="text-purple-400 font-bold block mb-1">AI NEURAL ANALYSIS:</span>
                                    <span className="text-purple-200/80 italic">{selectedCapsule.aiAnalysis}</span>
                                </div>
                            </div>
                        )}
                        <div className="text-[10px] text-slate-500 font-mono text-center pt-2">
                            [ MAKE A FIST TO CLOSE WINDOW ]
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-6 border border-red-900/50 bg-red-950/10 rounded relative overflow-hidden">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(220,38,38,0.05)_10px,rgba(220,38,38,0.05)_20px)]"></div>
                        <AlertTriangle className="w-10 h-10 text-red-500 mb-3 animate-pulse" />
                        <p className="text-red-400 font-display font-bold text-lg">ENCRYPTED SIGNAL</p>
                        <p className="text-red-300/60 font-mono text-sm mt-1 mb-4">
                            Proximity Alert: {Math.round(calculateDistance(userLocation, selectedCapsule.coordinates))}m to target
                        </p>
                        <div className="w-full bg-red-900/30 h-1 rounded-full overflow-hidden">
                             <div className="h-full bg-red-500 animate-[radar_2s_infinite]" style={{ width: '20%' }}></div>
                        </div>
                        
                        {/* Preview Icons for Locked State */}
                         {(selectedCapsule.image || selectedCapsule.video || selectedCapsule.audio) && (
                            <div className="flex gap-4 mt-4 opacity-50">
                                {selectedCapsule.image && <div className="flex flex-col items-center"><ImageIcon className="w-4 h-4 text-red-400" /><span className="text-[8px] text-red-500">IMG</span></div>}
                                {selectedCapsule.video && <div className="flex flex-col items-center"><VideoIcon className="w-4 h-4 text-red-400" /><span className="text-[8px] text-red-500">VID</span></div>}
                                {selectedCapsule.audio && <div className="flex flex-col items-center"><Mic className="w-4 h-4 text-red-400" /><span className="text-[8px] text-red-500">AUD</span></div>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
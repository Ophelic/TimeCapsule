import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050510'); // Deep dark blue/black
    scene.fog = new THREE.FogExp2(0x050510, 0.025);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // --- LOGO: Glass Sphere ---
    const sphereGeo = new THREE.IcosahedronGeometry(1.5, 2);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee, // Cyan tint
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.9, // Glass-like
      thickness: 1.5,
      transparent: true,
      opacity: 0.8,
      wireframe: true
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // --- LOGO: Inner Core ---
    const coreGeo = new THREE.OctahedronGeometry(0.6, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // --- LOGO: Rotating Ring ---
    const ringGeo = new THREE.TorusGeometry(2.5, 0.02, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2; // Flat ring
    scene.add(ring);

    // --- PARTICLES: Stardust (Deep Blue -> Purple) ---
    const particlesGeo = new THREE.BufferGeometry();
    const pCount = 1200;
    const pPos = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    
    const color1 = new THREE.Color(0x3b82f6); // Blue
    const color2 = new THREE.Color(0x9333ea); // Purple

    for(let i=0; i<pCount; i++) {
        pPos[i*3] = (Math.random() - 0.5) * 40;
        pPos[i*3+1] = (Math.random() - 0.5) * 40;
        pPos[i*3+2] = (Math.random() - 0.5) * 40;

        // Gradient mix
        const mixedColor = color1.clone().lerp(color2, Math.random());
        pColors[i*3] = mixedColor.r;
        pColors[i*3+1] = mixedColor.g;
        pColors[i*3+2] = mixedColor.b;
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const particlesMat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const starField = new THREE.Points(particlesGeo, particlesMat);
    scene.add(starField);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const blueLight = new THREE.PointLight(0x3b82f6, 2, 20);
    blueLight.position.set(-5, 2, 5);
    scene.add(blueLight);

    const purpleLight = new THREE.PointLight(0x9333ea, 2, 20);
    purpleLight.position.set(5, -2, 5);
    scene.add(purpleLight);

    // --- ANIMATION ---
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Sphere rotation
      sphere.rotation.y = time * 0.3;
      sphere.rotation.x = Math.sin(time * 0.5) * 0.2;

      // Core pulsing
      const scale = 1 + Math.sin(time * 3) * 0.15;
      core.scale.set(scale, scale, scale);
      core.rotation.y -= 0.02;

      // Ring Wobble
      ring.rotation.x = Math.PI/2 + Math.sin(time) * 0.1;
      ring.rotation.y = time * 0.2;

      // Particle Float
      starField.rotation.y = time * 0.05;
      starField.rotation.z = time * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Transition out
    const timer = setTimeout(() => {
        onComplete();
    }, 4000); // 4 seconds splash

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        clearTimeout(timer);
        if (mountRef.current && renderer.domElement) {
             mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        geometry_cleanup(sphereGeo, coreGeo, ringGeo, particlesGeo);
        material_cleanup(sphereMat, coreMat, ringMat, particlesMat);
    };
  }, [onComplete]);

  // Helper to cleanup Three.js resources
  const geometry_cleanup = (...geos: THREE.BufferGeometry[]) => geos.forEach(g => g.dispose());
  const material_cleanup = (...mats: THREE.Material[]) => mats.forEach(m => m.dispose());

  return (
    <div className="fixed inset-0 z-[100] bg-[#050510] flex flex-col items-center justify-center">
        {/* 3D Canvas */}
        <div ref={mountRef} className="absolute inset-0" />
        
        {/* UI Overlay */}
        <div className="z-10 flex flex-col items-center mt-48 sm:mt-64 pointer-events-none select-none">
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 glitch-text opacity-90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" data-text="TIME CAPSULE">
                TIME CAPSULE
            </h1>
            <div className="mt-12 flex flex-col items-center gap-3">
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
                </div>
                <p className="text-cyan-500/80 font-mono text-xs tracking-[0.3em] uppercase animate-pulse">
                    Loading...
                </p>
            </div>
        </div>
    </div>
  );
};
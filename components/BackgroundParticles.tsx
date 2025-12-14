import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const BackgroundParticles = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002); // Dark fog for depth

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Particle Geometry
    const geometry = new THREE.BufferGeometry();
    const count = 1500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const color1 = new THREE.Color(0x22d3ee); // Cyan
    const color2 = new THREE.Color(0x06b6d4); // Dark Cyan
    const color3 = new THREE.Color(0xff00ff); // Magenta accent

    for (let i = 0; i < count; i++) {
        // Position: Spread widely
        positions[i * 3] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

        // Color mix
        const choice = Math.random();
        const c = choice > 0.95 ? color3 : (choice > 0.5 ? color1 : color2);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        // Random sizes
        sizes[i] = Math.random() * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Material with additive blending for glowing effect
    const material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Animation Loop
    let frameId: number;
    let time = 0;
    const animate = () => {
        frameId = requestAnimationFrame(animate);
        time += 0.001;
        
        // Rotate entire system slowly
        particles.rotation.y = time * 0.1;
        particles.rotation.x = time * 0.05;
        
        // Gentle undulating movement for camera
        camera.position.x = Math.sin(time * 0.5) * 2;
        camera.position.y = Math.cos(time * 0.5) * 2;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        if (containerRef.current) {
            containerRef.current.removeChild(renderer.domElement);
        }
        geometry.dispose();
        material.dispose();
        renderer.dispose();
    };
  }, []);

  return (
    <div 
        ref={containerRef} 
        className="fixed inset-0 pointer-events-none" 
        style={{ zIndex: 0 }}
    />
  );
};
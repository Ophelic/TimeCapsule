// Simple synth engine for generating cyberpunk UI sounds and musical signals
// No external assets required.

class SynthEngine {
    ctx: AudioContext | null = null;
    masterGain: GainNode | null = null;

    constructor() {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.ctx.destination);
    }

    private ensureContext() {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 1. Heavy Kick (Impact)
    playKick(time: number) {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);

        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    // 2. Glitch Snare (Noise burst)
    playSnare(time: number) {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        const bufferSize = this.ctx.sampleRate * 0.1; // 100ms
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(time);
    }

    // 3. Hi-Hat (Metallic click)
    playHiHat(time: number) {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        // Using high freq square wave for metallic sound
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 8000;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.05);
    }

    // 4. Bass Drone (Dark saw)
    playBass(time: number) {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65.41, time); // C2

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, time);
        filter.frequency.linearRampToValueAtTime(100, time + 0.2);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.3);
    }

    // 5. Data Bleep (High sine)
    playBleep(time: number) {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, time);
        osc.frequency.linearRampToValueAtTime(800, time + 0.1);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.1);
    }

    // 6. Synth Stab (Futuristic Chord)
    playStab(time: number) {
        this.ensureContext();
        if (!this.ctx || !this.masterGain) return;

        // Minor Chord Cm (C, Eb, G)
        const freqs = [261.63, 311.13, 392.00];

        freqs.forEach(freq => {
            const osc = this.ctx!.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            const gain = this.ctx!.createGain();
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.start(time);
            osc.stop(time + 0.4);
        });
    }

    playSound(index: number, timeOffset: number = 0) {
        if (!this.ctx) return;
        const time = this.ctx.currentTime + timeOffset;

        switch(index) {
            case 0: this.playKick(time); break;
            case 1: this.playSnare(time); break;
            case 2: this.playHiHat(time); break;
            case 3: this.playBass(time); break;
            case 4: this.playBleep(time); break;
            case 5: this.playStab(time); break;
        }
    }
}

export const synth = new SynthEngine();
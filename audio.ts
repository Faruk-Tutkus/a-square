
class AudioEngineClass {
    private ctx: AudioContext | null = null;
    private musicNodes: {
        oscillators: OscillatorNode[];
        gain: GainNode;
        filter: BiquadFilterNode;
        lfo: OscillatorNode;
    } | null = null;

    private masterGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private musicGain: GainNode | null = null;

    private settings = {
        musicVolume: 0.25, 
        sfxVolume: 0.75, 
        muted: false
    };

    constructor() {
        // Lazy init to handle browser autoplay policies
    }

    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.settings.musicVolume;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.settings.sfxVolume;
        this.sfxGain.connect(this.masterGain);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolumes(music: number, sfx: number) {
        this.settings.musicVolume = music;
        this.settings.sfxVolume = sfx;
        if (this.musicGain) this.musicGain.gain.setTargetAtTime(music, this.ctx!.currentTime, 0.1);
        if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(sfx, this.ctx!.currentTime, 0.1);
    }

    startMusic() {
        if (!this.ctx) this.init(); // Ensure init
        if (this.musicNodes) return; // Already playing

        this.resume();

        // Dark Atmospheric Drone Generator
        const now = this.ctx!.currentTime;
        
        // 1. Bass Drone (Sawtooth detuned)
        const osc1 = this.ctx!.createOscillator();
        const osc2 = this.ctx!.createOscillator();
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.value = 55; // A1
        osc2.frequency.value = 55.5; // Slight detune

        // Filter to make it dark/ambient
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        // LFO to modulate filter (breathing effect)
        const lfo = this.ctx!.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // Very slow
        const lfoGain = this.ctx!.createGain();
        lfoGain.gain.value = 200;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const gain = this.ctx!.createGain();
        gain.gain.value = 0.3;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc1.start(now);
        osc2.start(now);
        lfo.start(now);

        this.musicNodes = {
            oscillators: [osc1, osc2],
            gain,
            filter,
            lfo
        };
    }

    stopMusic() {
        if (this.musicNodes) {
            this.musicNodes.oscillators.forEach(o => o.stop());
            this.musicNodes.lfo.stop();
            this.musicNodes = null;
        }
    }

    playSound(type: 'jump' | 'shoot' | 'hit_basic' | 'hit_heavy' | 'enemy_die' | 'player_die' | 'key' | 'portal' | 'step' | 'land' | 'button' | 'door' | 'alert_heavy' | 'alert_hunter' | 'alert_generic') {
        if (!this.ctx) this.init();
        if (!this.sfxGain) return;
        this.resume();
        
        const t = this.ctx!.currentTime;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.connect(gain);
        gain.connect(this.sfxGain);

        switch (type) {
            case 'jump':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'shoot':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                osc.start(t);
                osc.stop(t + 0.15);
                break;

            case 'hit_basic':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, t);
                osc.frequency.linearRampToValueAtTime(100, t + 0.1);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'hit_heavy':
                // Low metallic thud
                osc.type = 'square';
                osc.frequency.setValueAtTime(80, t);
                osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
                gain.gain.setValueAtTime(0.4, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'enemy_die':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
                osc.start(t);
                osc.stop(t + 0.4);
                break;

            case 'player_die':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.exponentialRampToValueAtTime(50, t + 1.0);
                
                const lfo = this.ctx!.createOscillator();
                lfo.frequency.value = 20;
                const lfoGain = this.ctx!.createGain();
                lfoGain.gain.value = 50;
                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);
                lfo.start(t);
                lfo.stop(t + 1.0);

                gain.gain.setValueAtTime(0.5, t);
                gain.gain.linearRampToValueAtTime(0, t + 1.0);
                osc.start(t);
                osc.stop(t + 1.0);
                break;

            case 'key':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, t);
                osc.frequency.setValueAtTime(1760, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0.4, t + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
                osc.start(t);
                osc.stop(t + 0.6);
                break;

            case 'portal':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, t);
                osc.frequency.linearRampToValueAtTime(880, t + 1.5);
                gain.gain.setValueAtTime(0.01, t);
                gain.gain.linearRampToValueAtTime(0.3, t + 0.5);
                gain.gain.linearRampToValueAtTime(0, t + 1.5);
                osc.start(t);
                osc.stop(t + 1.5);
                break;
            
            case 'button':
                osc.type = 'square';
                osc.frequency.setValueAtTime(440, t);
                gain.gain.setValueAtTime(0.05, t); 
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08); 
                osc.start(t);
                osc.stop(t + 0.08);
                break;

            case 'door':
                // Heavy sliding mechanical sound
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(60, t);
                osc.frequency.linearRampToValueAtTime(40, t + 0.5); // Pitch down friction
                
                // Add a lowpass filter sweep to simulate heavy material moving
                const doorFilter = this.ctx!.createBiquadFilter();
                doorFilter.type = 'lowpass';
                doorFilter.frequency.setValueAtTime(800, t);
                doorFilter.frequency.exponentialRampToValueAtTime(100, t + 0.5);
                
                osc.disconnect();
                osc.connect(doorFilter);
                doorFilter.connect(gain);

                gain.gain.setValueAtTime(0.3, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.5);
                
                osc.start(t);
                osc.stop(t + 0.5);
                break;

            case 'alert_heavy':
                // Robotic low frequency modulation (Growl)
                osc.type = 'square';
                osc.frequency.setValueAtTime(50, t);
                
                const mod = this.ctx!.createOscillator();
                mod.type = 'sawtooth';
                mod.frequency.value = 25; // Fast rough modulation
                const modGain = this.ctx!.createGain();
                modGain.gain.value = 500;
                
                mod.connect(modGain);
                modGain.connect(osc.frequency);
                
                mod.start(t);
                mod.stop(t + 0.6);

                gain.gain.setValueAtTime(0.4, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
                osc.start(t);
                osc.stop(t + 0.6);
                break;

            case 'alert_hunter':
                // Sharp chirp/screech
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1); // Quick zip up
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

            case 'alert_generic':
                // Digital blip
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.setValueAtTime(300, t + 0.1);
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.start(t);
                osc.stop(t + 0.2);
                break;

             case 'land':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(100, t);
                osc.frequency.exponentialRampToValueAtTime(50, t + 0.05);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
                osc.start(t);
                osc.stop(t + 0.05);
                break;
        }
    }
}

export const AudioEngine = new AudioEngineClass();

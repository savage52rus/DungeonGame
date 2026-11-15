// ========== ЗВУК ЧЕРЕЗ WebAudio API ==========
const Audio = {
    ctx: null,
    enabled: true,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { this.enabled = false; }
    },

    // Универсальный тон
    playTone(freq, duration, type = 'sine', volume = 0.15) {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    hit() { this.playTone(220, 0.08, 'square', 0.1); },
    kill() { this.playTone(180, 0.15, 'sawtooth', 0.12); },
    pickup() { this.playTone(880, 0.1, 'sine', 0.08); this.playTone(1320, 0.08, 'sine', 0.06); },
    levelUp() {
        this.playTone(523, 0.15, 'sine', 0.15);
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.15), 100);
        setTimeout(() => this.playTone(784, 0.3, 'sine', 0.15), 200);
    },
    skill() { this.playTone(440, 0.2, 'triangle', 0.12); },
    hurt() { this.playTone(110, 0.2, 'sawtooth', 0.15); },
    door() { this.playTone(160, 0.15, 'square', 0.1); },
    boss() { this.playTone(80, 0.5, 'sawtooth', 0.2); },
    ladder() {
        this.playTone(392, 0.2, 'sine', 0.12);
        setTimeout(() => this.playTone(523, 0.2, 'sine', 0.12), 150);
        setTimeout(() => this.playTone(784, 0.4, 'sine', 0.12), 300);
    },
};

// Инициализация при первом клике
document.addEventListener('click', () => {
    if (!Audio.ctx) Audio.init();
}, { once: true });
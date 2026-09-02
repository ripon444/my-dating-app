// Real-time Web Audio API sound generator for Calling (WhatsApp / Messenger style)

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private outgoingRingTimer: any = null;
  private isOutgoingRinging = false;

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return null;

    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public unlock() {
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  // Outgoing Ringtone (Caller hears this while waiting for receiver to answer)
  public startOutgoingRingtone() {
    if (this.isOutgoingRinging) return;
    this.isOutgoingRinging = true;
    this.unlock();

    const playBurst = () => {
      if (!this.isOutgoingRinging) return;
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // WhatsApp / European PBX dual tone: 425Hz & 450Hz (or standard 440Hz & 480Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(425, now);
        osc2.frequency.setValueAtTime(450, now);

        // Pulse 1: 0.4s tone
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 0.4);
        gain.gain.linearRampToValueAtTime(0, now + 0.45);

        // Pulse 2: 0.4s tone
        gain.gain.setValueAtTime(0, now + 0.65);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.7);
        gain.gain.setValueAtTime(0.12, now + 1.1);
        gain.gain.linearRampToValueAtTime(0, now + 1.15);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } catch (err) {
        console.warn('Outgoing ring error:', err);
      }
    };

    playBurst();
    this.outgoingRingTimer = setInterval(playBurst, 3200);
  }

  public stopOutgoingRingtone() {
    this.isOutgoingRinging = false;
    if (this.outgoingRingTimer) {
      clearInterval(this.outgoingRingTimer);
      this.outgoingRingTimer = null;
    }
  }

  // Connected Ding / Harp Chime
  public playConnectedChime() {
    try {
      this.stopOutgoingRingtone();
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch (e) {}
  }

  // Call Ended Descent Tone
  public playEndTone() {
    try {
      this.stopOutgoingRingtone();
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      [440, 330, 220].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch (e) {}
  }
}

export const soundManager = new SoundManager();

/**
 * ==============================================================================
 * SOUND & HAPTIC FEEDBACK HELPER
 * ==============================================================================
 */

class SoundHelper {
  constructor() {
    this.enabled = true;
    this.shutterAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3');
    this.popAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playShutter() {
    if (!this.enabled) return;
    this.shutterAudio.currentTime = 0;
    this.shutterAudio.play().catch(() => {});
    if (navigator.vibrate) navigator.vibrate(50);
  }

  playPop() {
    if (!this.enabled) return;
    this.popAudio.currentTime = 0;
    this.popAudio.play().catch(() => {});
    if (navigator.vibrate) navigator.vibrate(30);
  }
}

export const soundHelper = new SoundHelper();

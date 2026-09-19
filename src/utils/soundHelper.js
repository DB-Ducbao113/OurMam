/**
 * ==============================================================================
 * SOUND HELPER (MUTED / SILENT NO-OP)
 * All audio playback completely removed as requested
 * ==============================================================================
 */

class SoundHelper {
  constructor() {
    this.enabled = false;
  }

  isEnabled() {
    return false;
  }

  setEnabled() {
    this.enabled = false;
    return false;
  }

  toggle() {
    return false;
  }

  playShutter() {
    // Sound completely disabled
  }

  playPop() {
    // Sound completely disabled
  }
}

export const soundHelper = new SoundHelper();

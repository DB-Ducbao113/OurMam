/**
 * ==============================================================================
 * WEBRTC CAMERA HELPER
 * Controls live video stream, lens switching & flash simulation
 * ==============================================================================
 */

export class CameraHelper {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.stream = null;
    this.facingMode = 'environment'; // 'user' | 'environment'
  }

  async start(facingMode = this.facingMode) {
    this.facingMode = facingMode;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API not supported in this browser environment");
    }

    this.stop();

    const constraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    };

    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (this.videoElement) {
      this.videoElement.srcObject = this.stream;
    }
    return this.stream;
  }

  flip() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    return this.start(this.facingMode);
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  triggerFlash() {
    const flash = document.createElement('div');
    flash.className = 'flash-effect';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }
}

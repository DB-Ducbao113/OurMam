/**
 * ==============================================================================
 * CAMERA VIEW COMPONENT (MEAL SNAPPER & VIEWFINDER)
 * ==============================================================================
 */

import { CameraHelper } from '../utils/cameraHelper.js';
import { captureVideoFrame, compressImageFile, dataUrlToBlob } from '../utils/imageCompressor.js';
import { soundHelper } from '../utils/soundHelper.js';

export class CameraViewComponent {
  constructor(onPublishMeal) {
    this.videoEl = document.getElementById('camera-video');
    this.previewImgEl = document.getElementById('camera-captured-preview');
    this.reticleEl = document.getElementById('camera-reticle');
    this.hintEl = document.getElementById('camera-hint');
    this.btnShutter = document.getElementById('btn-shutter');
    this.shutterIcon = document.getElementById('shutter-icon');
    this.btnFlip = document.getElementById('btn-flip-camera');
    this.btnFlash = document.getElementById('btn-flash');
    this.btnRetake = document.getElementById('btn-retake');
    this.fileGallery = document.getElementById('file-input-gallery');
    this.inputCaption = document.getElementById('input-meal-caption');
    this.tagButtons = document.querySelectorAll('.meal-tag-btn');
    this.sectionTitle = document.getElementById('camera-section-title');

    this.cameraHelper = new CameraHelper(this.videoEl);
    this.selectedTag = 'lunch';
    this.capturedDataUrl = null;
    this.onPublishMeal = onPublishMeal;

    this.bindEvents();
    this.initCamera();
  }

  async initCamera() {
    try {
      await this.cameraHelper.start();
    } catch (e) {
      this.hintEl.textContent = "Nhấn 'Chọn từ thư viện' để gửi ảnh 📸";
    }
  }

  bindEvents() {
    this.tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.tagButtons.forEach(b => {
          b.classList.remove('active', 'bg-surface-container-lowest', 'text-primary', 'shadow-sm', 'font-bold');
          b.classList.add('text-tertiary');
        });
        btn.classList.add('active', 'bg-surface-container-lowest', 'text-primary', 'shadow-sm', 'font-bold');
        btn.classList.remove('text-tertiary');
        this.selectedTag = btn.dataset.tag;
      });
    });

    this.btnShutter.addEventListener('click', () => this.handleShutter());
    this.btnFlip.addEventListener('click', () => this.cameraHelper.flip().catch(() => {}));
    this.btnFlash.addEventListener('click', () => this.cameraHelper.triggerFlash());
    this.btnRetake.addEventListener('click', () => this.resetView());

    this.fileGallery.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const dataUrl = await compressImageFile(file);
      this.setPreview(dataUrl);
    });
  }

  handleShutter() {
    if (this.capturedDataUrl) {
      // Publish state
      const caption = this.inputCaption.value.trim();
      const blob = dataUrlToBlob(this.capturedDataUrl);
      this.onPublishMeal({
        photoUrl: this.capturedDataUrl,
        blob: blob,
        tag: this.selectedTag,
        caption: caption
      });
      this.resetView();
      return;
    }

    this.cameraHelper.triggerFlash();
    soundHelper.playShutter();

    if (this.videoEl.srcObject && !this.videoEl.classList.contains('hidden')) {
      const dataUrl = captureVideoFrame(this.videoEl);
      this.setPreview(dataUrl);
    } else {
      this.fileGallery.click();
    }
  }

  setPreview(dataUrl) {
    this.capturedDataUrl = dataUrl;
    this.previewImgEl.src = dataUrl;
    this.previewImgEl.classList.remove('hidden');
    this.videoEl.classList.add('hidden');
    this.btnRetake.classList.remove('hidden');
    this.reticleEl.classList.add('hidden');
    this.shutterIcon.textContent = 'send';
    this.hintEl.textContent = 'Nhập lời nhắn và bấm nút gửi ngay! 💕';
  }

  resetView() {
    this.capturedDataUrl = null;
    this.previewImgEl.classList.add('hidden');
    this.videoEl.classList.remove('hidden');
    this.btnRetake.classList.add('hidden');
    this.reticleEl.classList.remove('hidden');
    this.shutterIcon.textContent = 'photo_camera';
    this.hintEl.textContent = 'Chạm vào đĩa thức ăn để lấy nét 🍲';
    this.inputCaption.value = '';
  }

  updatePartnerTitle(partnerName) {
    if (this.sectionTitle) {
      this.sectionTitle.textContent = `Gửi món cho ${partnerName}`;
    }
  }
}

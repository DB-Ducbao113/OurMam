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
    this.inputCalories = document.getElementById('input-meal-calories');
    this.inputLocation = document.getElementById('input-meal-location');
    this.btnGetLocation = document.getElementById('btn-get-location');
    this.tagButtons = document.querySelectorAll('.meal-tag-btn');
    this.sectionTitle = document.getElementById('camera-section-title');

    this.cameraHelper = new CameraHelper(this.videoEl);
    this.selectedTag = this.getTimeBasedTag();
    this.capturedDataUrl = null;
    this.onPublishMeal = onPublishMeal;

    // Camera Permission UI Elements
    this.promptPermissionEl = document.getElementById('camera-permission-prompt');
    this.btnRequestPerm = document.getElementById('btn-request-camera-perm');
    this.btnOpenGuide = document.getElementById('btn-open-camera-guide');
    this.modalPermGuide = document.getElementById('camera-permission-modal');
    this.btnClosePermModal = document.getElementById('btn-close-camera-perm-modal');
    this.btnConfirmPerm = document.getElementById('btn-confirm-camera-perm');

    this.bindEvents();
    this.initCamera();
    
    // Auto fetch location after 1 second if possible
    if (this.btnGetLocation) {
      this.btnGetLocation.addEventListener('click', () => this.fetchLocation());
      setTimeout(() => this.fetchLocation(), 1000);
    }
  }

  fetchLocation() {
    if (!this.inputLocation) return;
    this.inputLocation.placeholder = 'Đang tìm vị trí...';
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14`);
            const data = await res.json();
            if (data && data.address) {
              const loc = data.address.city || data.address.town || data.address.suburb || data.address.state || 'Gần bạn';
              this.inputLocation.value = loc;
              this.inputLocation.placeholder = 'Đã tự động lấy vị trí';
            } else {
              this.inputLocation.placeholder = 'Không tìm thấy tên đường, vui lòng tự nhập';
            }
          } catch (e) {
            this.inputLocation.placeholder = 'Lỗi kết nối, vui lòng tự nhập';
          }
        },
        (err) => {
          this.inputLocation.placeholder = 'Vui lòng cho phép định vị hoặc tự nhập';
        },
        { timeout: 5000 }
      );
    } else {
      this.inputLocation.placeholder = 'Trình duyệt không hỗ trợ định vị';
    }
  }

  async initCamera() {
    const preferredSource = localStorage.getItem('ourmam_setting_camera_source') || 'camera';
    if (preferredSource === 'gallery') {
      if (this.videoEl) this.videoEl.classList.add('hidden');
      if (this.promptPermissionEl) {
        this.promptPermissionEl.classList.add('hidden');
        this.promptPermissionEl.classList.remove('flex');
      }
      if (this.hintEl) this.hintEl.textContent = "Chế độ thư viện: Bấm nút chụp để tải ảnh 🖼️";
      return;
    }

    try {
      await this.cameraHelper.start();
      if (this.videoEl) this.videoEl.classList.remove('hidden');
      if (this.promptPermissionEl) {
        this.promptPermissionEl.classList.add('hidden');
        this.promptPermissionEl.classList.remove('flex');
      }
      if (this.hintEl) this.hintEl.textContent = "Chạm để lấy nét món ăn 🍲";
    } catch (e) {
      console.warn("Camera access not granted or unavailable:", e);
      if (this.promptPermissionEl) {
        this.promptPermissionEl.classList.remove('hidden');
        this.promptPermissionEl.classList.add('flex');
      }
      if (this.hintEl) this.hintEl.textContent = "Nhấn 'Chọn từ thư viện' hoặc Cấp quyền Camera 📸";
    }
  }

  bindEvents() {
    this.tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectTag(btn.dataset.tag);
      });
    });

    this.selectTag(this.selectedTag);

    this.btnShutter.addEventListener('click', () => this.handleShutter());
    this.btnFlip.addEventListener('click', () => this.cameraHelper.flip().catch(() => {}));
    this.btnFlash.addEventListener('click', () => this.cameraHelper.triggerFlash());
    this.btnRetake.addEventListener('click', () => this.resetView());

    // Permission Prompt Events
    if (this.btnRequestPerm) {
      this.btnRequestPerm.addEventListener('click', async () => {
        soundHelper.playPop();
        await this.initCamera();
      });
    }

    if (this.btnOpenGuide && this.modalPermGuide) {
      this.btnOpenGuide.addEventListener('click', () => {
        soundHelper.playPop();
        this.modalPermGuide.classList.remove('hidden');
        this.modalPermGuide.classList.add('flex');
      });
    }

    if (this.btnClosePermModal && this.modalPermGuide) {
      this.btnClosePermModal.addEventListener('click', () => {
        this.modalPermGuide.classList.add('hidden');
        this.modalPermGuide.classList.remove('flex');
      });
    }

    if (this.btnConfirmPerm && this.modalPermGuide) {
      this.btnConfirmPerm.addEventListener('click', async () => {
        this.modalPermGuide.classList.add('hidden');
        this.modalPermGuide.classList.remove('flex');
        await this.initCamera();
      });
    }

    if (this.modalPermGuide) {
      this.modalPermGuide.addEventListener('click', (e) => {
        if (e.target === this.modalPermGuide) {
          this.modalPermGuide.classList.add('hidden');
          this.modalPermGuide.classList.remove('flex');
        }
      });
    }

    this.fileGallery.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const dataUrl = await compressImageFile(file);
      this.setPreview(dataUrl);
    });
  }

  getTimeBasedTag(date = new Date()) {
    const hour = date.getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 17 && hour < 22) return 'dinner';
    return 'snack';
  }

  selectTag(tag) {
    const validTags = new Set([...this.tagButtons].map(button => button.dataset.tag));
    if (!validTags.has(tag)) return;
    this.tagButtons.forEach(button => {
      const isSelected = button.dataset.tag === tag;
      button.classList.toggle('active', isSelected);
      button.classList.toggle('bg-surface-container-lowest', isSelected);
      button.classList.toggle('text-primary', isSelected);
      button.classList.toggle('shadow-sm', isSelected);
      button.classList.toggle('font-bold', isSelected);
      button.classList.toggle('text-tertiary', !isSelected);
    });
    this.selectedTag = tag;
  }

  selectDefaultTagForCurrentTime() {
    this.selectTag(this.getTimeBasedTag());
  }

  handleShutter() {
    if (this.capturedDataUrl) {
      // Publish state
      const caption = this.inputCaption ? this.inputCaption.value.trim() : '';
      
      let parsedCals = null;
      if (this.inputCalories && this.inputCalories.value.trim()) {
        parsedCals = parseInt(this.inputCalories.value.trim(), 10);
        if (isNaN(parsedCals) || parsedCals < 0) parsedCals = Math.abs(parsedCals) || 0;
      }
      const calories = parsedCals !== null ? parsedCals + ' kcal' : null;
      
      const location = this.inputLocation && this.inputLocation.value.trim() ? this.inputLocation.value.trim() : null;

      const blob = dataUrlToBlob(this.capturedDataUrl);
      this.onPublishMeal({
        photoUrl: this.capturedDataUrl,
        blob: blob,
        tag: this.selectedTag,
        caption: caption,
        calories: calories,
        location: location
      });
      this.resetView();
      return;
    }

    const preferredSource = localStorage.getItem('ourmam_setting_camera_source') || 'camera';
    if (preferredSource === 'gallery' || !this.videoEl.srcObject || this.videoEl.classList.contains('hidden')) {
      soundHelper.playPop();
      this.fileGallery.click();
      return;
    }

    this.cameraHelper.triggerFlash();
    soundHelper.playShutter();

    const dataUrl = captureVideoFrame(this.videoEl);
    this.setPreview(dataUrl);
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
    if (this.inputCaption) this.inputCaption.value = '';
    if (this.inputCalories) this.inputCalories.value = '';
    if (this.inputLocation) this.inputLocation.value = '';
  }

  updatePartnerTitle(partnerName) {
    if (this.sectionTitle) {
      this.sectionTitle.textContent = `Gửi món cho ${partnerName}`;
    }
  }
}

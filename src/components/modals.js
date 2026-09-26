/**
 * ==============================================================================
 * MODALS COMPONENT (SETTINGS & ACCOUNT, USER CODE, CONNECTIONS & PHOTO DETAIL)
 * ==============================================================================
 */

import { formatMealTime } from '../utils/dateHelper.js';
import { soundHelper } from '../utils/soundHelper.js';
import { getUserAvatar } from '../utils/avatarHelper.js';
import { SCRIPTABLE_WIDGET_CODE } from '../utils/scriptableWidgetCode.js';

export class ModalsComponent {
  constructor(onAddConnection, onUpdateStatus, onLogout, onUpdateProfile, onUpdateAvatar, onUpdatePassword, onDeleteMeal, onRemoveCouple, onDeleteAccount, onRespondConnectionRequest, onUpdateMeal) {
    // Profile & Settings Modal
    this.profileModal = document.getElementById('profile-modal');
    this.btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
    this.profilesContainer = document.getElementById('profiles-list-container');

    // Photo Detail Modal
    this.photoModal = document.getElementById('photo-detail-modal');
    this.btnClosePhotoModal = document.getElementById('btn-close-photo-modal');
    this.detailImg = document.getElementById('detail-modal-img');
    this.detailAvatar = document.getElementById('detail-modal-avatar');
    this.detailAuthor = document.getElementById('detail-modal-author');
    this.detailTime = document.getElementById('detail-modal-time');
    this.detailTag = document.getElementById('detail-modal-tag');
    this.detailCaption = document.getElementById('detail-modal-caption');

    this.onAddConnection = onAddConnection;
    this.onUpdateStatus = onUpdateStatus;
    this.onLogout = onLogout;
    this.onUpdateProfile = onUpdateProfile;
    this.onUpdateAvatar = onUpdateAvatar;
    this.onUpdatePassword = onUpdatePassword;
    this.onDeleteMeal = onDeleteMeal;
    this.onRemoveCouple = onRemoveCouple;
    this.onDeleteAccount = onDeleteAccount;
    this.onRespondConnectionRequest = onRespondConnectionRequest;
    this.onUpdateMeal = onUpdateMeal;
    this.currentUser = null;

    this.currentPhotoMeal = null;
    this.selectedRelType = 'couple'; // default couple
    this.isEditingProfile = false;
    this.isChangePwdOpen = false;

    this.bindEvents();
  }

  bindEvents() {
    if (this.btnCloseProfileModal) {
      this.btnCloseProfileModal.addEventListener('click', () => this.closeProfileModal());
    }
    if (this.profileModal) {
      this.profileModal.addEventListener('click', (e) => {
        if (e.target === this.profileModal) this.closeProfileModal();
      });
    }

    // Helper Modals (Widget Installation Guide, Settings Help, Privacy Info)
    const modalWidgetGuide = document.getElementById('widget-guide-modal');
    const modalSettingsHelp = document.getElementById('settings-help-modal');
    const modalPrivacyInfo = document.getElementById('privacy-info-modal');

    const btnOpenHelp = document.getElementById('btn-open-settings-help');
    if (btnOpenHelp && modalSettingsHelp) {
      btnOpenHelp.addEventListener('click', () => modalSettingsHelp.classList.remove('hidden'));
    }

    const bindClose = (btnId, modalEl) => {
      const btn = document.getElementById(btnId);
      if (btn && modalEl) {
        btn.addEventListener('click', () => modalEl.classList.add('hidden'));
      }
    };

    bindClose('btn-close-widget-guide', modalWidgetGuide);
    bindClose('btn-confirm-widget-guide', modalWidgetGuide);
    bindClose('btn-close-settings-help', modalSettingsHelp);
    bindClose('btn-confirm-settings-help', modalSettingsHelp);
    bindClose('btn-close-privacy-info', modalPrivacyInfo);
    bindClose('btn-confirm-privacy-info', modalPrivacyInfo);

    // Scriptable Widget Copy Script Buttons
    const btnCopyScript = document.getElementById('btn-copy-widget-script');
    if (btnCopyScript) {
      btnCopyScript.addEventListener('click', () => {
        this.copyScriptableWidgetCode(btnCopyScript);
      });
    }

    const btnActionCopyAndClose = document.getElementById('btn-action-copy-and-close');
    if (btnActionCopyAndClose) {
      btnActionCopyAndClose.addEventListener('click', () => {
        this.copyScriptableWidgetCode(btnActionCopyAndClose);
        setTimeout(() => {
          if (modalWidgetGuide) {
            modalWidgetGuide.classList.add('hidden');
            modalWidgetGuide.classList.remove('flex');
          }
        }, 800);
      });
    }

    const widgetPreview = document.getElementById('widget-code-preview');
    if (widgetPreview) {
      widgetPreview.addEventListener('click', () => {
        this.copyScriptableWidgetCode(btnCopyScript);
      });
    }

    if (this.btnClosePhotoModal) {
      this.btnClosePhotoModal.addEventListener('click', () => this.closePhotoModal());
    }
    if (this.photoModal) {
      this.photoModal.addEventListener('click', (e) => {
        if (e.target === this.photoModal) this.closePhotoModal();
      });
    }

    // Photo Delete & Confirmation Bindings
    const modalDeleteConfirm = document.getElementById('delete-confirm-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete-modal');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete-modal');
    const btnDeletePhotoTop = document.getElementById('btn-delete-photo-modal');
    const btnDeletePhotoAction = document.getElementById('btn-delete-photo-action');
    const btnEditPhoto = document.getElementById('btn-edit-photo');
    const photoEditForm = document.getElementById('photo-edit-form');
    const btnCancelPhotoEdit = document.getElementById('btn-cancel-photo-edit');

    const promptDeleteMeal = () => {
      if (!this.currentPhotoMeal) return;
      soundHelper.playPop();
      if (modalDeleteConfirm) {
        modalDeleteConfirm.classList.remove('hidden');
        modalDeleteConfirm.classList.add('flex');
      }
    };

    if (btnDeletePhotoTop) btnDeletePhotoTop.addEventListener('click', promptDeleteMeal);
    if (btnDeletePhotoAction) btnDeletePhotoAction.addEventListener('click', promptDeleteMeal);

    if (btnEditPhoto && photoEditForm) {
      btnEditPhoto.addEventListener('click', () => {
        photoEditForm.classList.remove('hidden');
        btnEditPhoto.classList.add('hidden');
      });
    }
    if (btnCancelPhotoEdit && photoEditForm && btnEditPhoto) {
      btnCancelPhotoEdit.addEventListener('click', () => {
        photoEditForm.classList.add('hidden');
        btnEditPhoto.classList.remove('hidden');
      });
    }
    const editTagButtons = photoEditForm?.querySelectorAll('.photo-edit-tag-btn');
    const inputEditMealType = photoEditForm?.querySelector('#photo-edit-meal-type');
    if (editTagButtons && inputEditMealType) {
      editTagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const tag = btn.dataset.tag;
          inputEditMealType.value = tag;
          editTagButtons.forEach(b => {
            const isMatch = b.dataset.tag === tag;
            b.classList.toggle('active', isMatch);
            b.classList.toggle('bg-[#FF6433]', isMatch);
            b.classList.toggle('text-white', isMatch);
            b.classList.toggle('font-bold', isMatch);
            b.classList.toggle('shadow-xs', isMatch);
            b.classList.toggle('text-stone-500', !isMatch);
            b.classList.toggle('font-semibold', !isMatch);
          });
        });
      });
    }

    if (photoEditForm) {
      photoEditForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!this.currentPhotoMeal || !this.onUpdateMeal) return;
        const saveButton = photoEditForm.querySelector('#btn-save-photo-edit');
        const dishName = photoEditForm.querySelector('#photo-edit-dish')?.value.trim() || '';
        const details = {
          dish_name: dishName,
          caption: `“${dishName}”`,
          meal_type: inputEditMealType?.value || 'lunch',
          location: photoEditForm.querySelector('#photo-edit-location')?.value.trim() || '',
          calories: photoEditForm.querySelector('#photo-edit-calories')?.value.trim() || ''
        };
        saveButton.disabled = true;
        saveButton.textContent = 'Đang lưu…';
        try {
          await this.onUpdateMeal(this.currentPhotoMeal, details);
          photoEditForm.classList.add('hidden');
          btnEditPhoto?.classList.remove('hidden');
        } catch (error) {
          alert(error.message || 'Không thể lưu thông tin ảnh.');
        } finally {
          saveButton.disabled = false;
          saveButton.textContent = 'Lưu thông tin';
        }
      });
    }

    if (btnCancelDelete && modalDeleteConfirm) {
      btnCancelDelete.addEventListener('click', () => {
        soundHelper.playPop();
        modalDeleteConfirm.classList.add('hidden');
        modalDeleteConfirm.classList.remove('flex');
      });
    }

    if (modalDeleteConfirm) {
      modalDeleteConfirm.addEventListener('click', (e) => {
        if (e.target === modalDeleteConfirm) {
          modalDeleteConfirm.classList.add('hidden');
          modalDeleteConfirm.classList.remove('flex');
        }
      });
    }

    if (btnConfirmDelete && modalDeleteConfirm) {
      btnConfirmDelete.addEventListener('click', async () => {
        if (this.currentPhotoMeal && this.onDeleteMeal) {
          const mealToDelete = this.currentPhotoMeal;
          modalDeleteConfirm.classList.add('hidden');
          modalDeleteConfirm.classList.remove('flex');
          this.closePhotoModal();
          await this.onDeleteMeal(mealToDelete.id);
        }
      });
    }

    // Nickname Modal Bindings
    const modalNickname = document.getElementById('nickname-modal');
    const btnCloseNick = document.getElementById('btn-close-nickname-modal');
    const btnCancelNick = document.getElementById('btn-cancel-nickname');
    const btnSaveNick = document.getElementById('btn-save-nickname');
    const btnDeleteNick = document.getElementById('btn-delete-nickname');
    const inputNick = document.getElementById('input-nickname-text');

    if (btnCloseNick) btnCloseNick.addEventListener('click', () => this.closeNicknameModal());
    if (btnCancelNick) btnCancelNick.addEventListener('click', () => this.closeNicknameModal());
    if (modalNickname) {
      modalNickname.addEventListener('click', (e) => {
        if (e.target === modalNickname) this.closeNicknameModal();
      });
    }

    // Suggestion chips
    const chips = document.querySelectorAll('.chip-nickname');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        soundHelper.playPop();
        const val = chip.dataset.val || chip.textContent.trim();
        if (inputNick) {
          inputNick.value = val;
          inputNick.focus();
        }
      });
    });

    if (btnSaveNick && inputNick) {
      btnSaveNick.addEventListener('click', () => {
        const val = inputNick.value.trim();
        if (this._onSaveNicknameCallback) {
          this._onSaveNicknameCallback(val || null);
        }
        this.closeNicknameModal();
      });
    }

    if (btnDeleteNick) {
      btnDeleteNick.addEventListener('click', () => {
        if (this._onSaveNicknameCallback) {
          this._onSaveNicknameCallback(null);
        }
        this.closeNicknameModal();
      });
    }

    if (inputNick) {
      inputNick.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (btnSaveNick) btnSaveNick.click();
        }
      });
    }

    // Edit Name Modal Bindings
    const modalEditName = document.getElementById('edit-name-modal');
    const btnCloseEditName = document.getElementById('btn-close-edit-name-modal');
    const btnCancelEditName = document.getElementById('btn-cancel-edit-name-modal');
    const btnSaveEditName = document.getElementById('btn-save-edit-name-modal');
    const inputEditNameModal = document.getElementById('input-edit-name-modal-text');

    if (btnCloseEditName) btnCloseEditName.addEventListener('click', () => this.closeEditNameModal(true));
    if (btnCancelEditName) btnCancelEditName.addEventListener('click', () => this.closeEditNameModal(true));
    if (modalEditName) {
      modalEditName.addEventListener('click', (e) => {
        if (e.target === modalEditName) this.closeEditNameModal(true);
      });
    }

    if (btnSaveEditName && inputEditNameModal) {
      btnSaveEditName.addEventListener('click', async () => {
        const newName = inputEditNameModal.value.trim();
        if (!newName) {
          alert('Tên hiển thị không được để trống!');
          return;
        }
        btnSaveEditName.disabled = true;
        const origContent = btnSaveEditName.innerHTML;
        btnSaveEditName.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Đang lưu...</span>';
        try {
          if (this.onUpdateProfile) {
            await this.onUpdateProfile(newName);
          }
          if (this.currentUser) {
            this.currentUser.display_name = newName;
          }
          this.isEditingProfile = false;
          this.closeEditNameModal(true);
        } catch (err) {
          console.error('Error updating name:', err);
          alert('Lỗi cập nhật tên. Vui lòng thử lại!');
        } finally {
          btnSaveEditName.disabled = false;
          btnSaveEditName.innerHTML = origContent;
        }
      });
    }

    if (inputEditNameModal) {
      inputEditNameModal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (btnSaveEditName) btnSaveEditName.click();
        }
      });
    }
  }

  openEditNameModal(currentName, avatarUrl, returnToProfile = true) {
    // 1. Lưu lại cờ trạng thái profile để khôi phục khi hoàn tất/hủy
    this._returnToProfileAfterEditName = returnToProfile && !this.profileModal?.classList.contains('hidden');
    
    // 2. Tắt hoàn toàn màn hình profile để tránh giao diện đè chồng chéo
    this.closeProfileModal();

    const modal = document.getElementById('edit-name-modal');
    if (!modal) return;

    const avatarEl = document.getElementById('edit-name-avatar-preview');
    const currentTextEl = document.getElementById('edit-name-current-text');
    const inputEl = document.getElementById('input-edit-name-modal-text');

    if (avatarEl) avatarEl.src = avatarUrl || getUserAvatar(null, currentName);
    if (currentTextEl) currentTextEl.textContent = currentName || 'Bạn';
    if (inputEl) {
      inputEl.value = currentName || '';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (inputEl) {
      setTimeout(() => {
        inputEl.focus();
        inputEl.select();
      }, 80);
    }
  }

  closeEditNameModal(reopenProfile = false) {
    const modal = document.getElementById('edit-name-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    // Khôi phục lại màn hình Profile với dữ liệu mới đã được cập nhật
    if (reopenProfile && this._returnToProfileAfterEditName) {
      this.openProfileModal(this.currentUser, this.connections, this.meals);
    }
  }

  openProfileModal(currentUser, connections = [], meals = []) {
    this.currentUser = currentUser;
    this.connections = connections;
    this.meals = meals;
    this.isEditingProfile = false;
    this.renderProfileModalContent(currentUser, connections, meals);
    this.profileModal.classList.remove('hidden');
    this.profileModal.classList.add('flex');
  }

  closeProfileModal() {
    this.profileModal.classList.add('hidden');
    this.profileModal.classList.remove('flex');
  }

  openNicknameModal(partner, onSave) {
    const modal = document.getElementById('nickname-modal');
    if (!modal || !partner) return;

    const isCouple = partner.relationship_type === 'couple';
    const realName = partner.display_name || (isCouple ? 'Người yêu' : 'Bạn bè');
    const currentNick = partner.custom_nickname || partner.nickname || '';
    const avatarUrl = getUserAvatar(partner.avatar_url, realName);

    const avatarEl = document.getElementById('nickname-modal-avatar');
    const realnameEl = document.getElementById('nickname-modal-realname');
    const badgeEl = document.getElementById('nickname-modal-badge');
    const currentEl = document.getElementById('nickname-modal-current');
    const inputEl = document.getElementById('input-nickname-text');
    const btnDelete = document.getElementById('btn-delete-nickname');

    if (avatarEl) avatarEl.src = avatarUrl;
    if (realnameEl) realnameEl.textContent = realName;
    if (badgeEl) {
      badgeEl.textContent = isCouple ? '💕 Người yêu' : '🥑 Bạn bè';
      badgeEl.className = `text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isCouple ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`;
    }
    if (currentEl) {
      currentEl.textContent = currentNick ? `Biệt danh: ${currentNick}` : 'Chưa có biệt danh';
    }
    if (inputEl) {
      inputEl.value = currentNick;
    }
    if (btnDelete) {
      btnDelete.style.display = currentNick ? 'block' : 'none';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if (inputEl) {
      setTimeout(() => {
        inputEl.focus();
        inputEl.select();
      }, 80);
    }

    this._onSaveNicknameCallback = onSave;
    this._currentNicknamePartner = partner;
  }

  closeNicknameModal() {
    const modal = document.getElementById('nickname-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  renderProfileModalContent(currentUser, connections = [], meals = []) {
    if (!this.profilesContainer) return;

    const userCode = currentUser?.user_code || "MAM888";
    const displayName = currentUser?.display_name || "Bạn 🌸";
    const avatarUrl = getUserAvatar(currentUser?.avatar_url, displayName);
    const userStreak = currentUser?.streak_count || 0;
    const accountIdentity = currentUser?.email || currentUser?.display_name || "Tài khoản OurMam";
    const totalMeals = meals?.length || 0;

    // Determine partner connection
    const acceptedConnections = connections.filter(c => !c.status || c.status === 'accepted');
    const coupleConn = acceptedConnections.find(c => c.relationship_type === 'couple');
    const friendConn = acceptedConnections.find(c => c.relationship_type === 'friend');
    const primaryConn = coupleConn || friendConn;
    const isConnected = !!primaryConn;
    const partner = primaryConn?.friend || {};
    const partnerName = partner.display_name || (primaryConn?.relationship_type === 'couple' ? 'Người yêu' : 'Bạn bè');
    const partnerAvatar = getUserAvatar(partner.avatar_url, partnerName);

    // Local preferences
    const preferredCameraSource = localStorage.getItem('ourmam_setting_camera_source') || 'camera';

    this.profilesContainer.innerHTML = `
      <!-- 1. Hero Card: Ghép Đôi & Người Thương -->
      <section class="shrink-0 relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#FFF8F5] to-[#FFEBE4] border border-orange-200/70 p-4 sm:p-5 shadow-sm flex flex-col gap-4">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl pointer-events-none"></div>

        <!-- Top Status Bar: Connection status & Streak (Redesigned) -->
        <div class="w-full shrink-0 bg-white/90 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 border border-orange-200/80 shadow-xs flex items-center justify-between gap-2">
          <!-- Connection Status -->
          <div class="flex items-center gap-2 min-w-0">
            ${isConnected ? `
              <div class="w-7 h-7 rounded-xl bg-emerald-100/90 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div class="min-w-0">
                <span class="block text-[9px] uppercase tracking-wider text-emerald-700 font-bold leading-tight">Đang kết nối</span>
                <span class="text-xs font-extrabold text-stone-900 truncate block mt-0.5 max-w-[130px] sm:max-w-[180px]" title="Cùng ${partnerName}">Cùng ${partnerName}</span>
              </div>
            ` : `
              <div class="w-7 h-7 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center shrink-0 shadow-2xs">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              </div>
              <div class="min-w-0">
                <span class="block text-[9px] uppercase tracking-wider text-stone-400 font-bold leading-tight">Trạng thái</span>
                <span class="text-xs font-bold text-stone-700 truncate block mt-0.5">Chưa ghép đôi</span>
              </div>
            `}
          </div>

          <!-- Subtle Divider -->
          <div class="h-6 w-px bg-orange-200/60 shrink-0"></div>

          <!-- Streak Pill / Badge -->
          <div class="flex items-center gap-1.5 shrink-0 bg-gradient-to-r from-orange-50 to-amber-50 px-2.5 py-1 rounded-xl border border-orange-200/70 shadow-2xs">
            <span class="material-symbols-outlined text-[#FF6433] text-base leading-none">local_fire_department</span>
            <div class="flex items-baseline gap-1">
              <span class="text-xs font-black text-[#FF6433] font-mono leading-none">${userStreak}</span>
              <span class="text-[10px] font-bold text-stone-600 leading-none">ngày măm</span>
            </div>
          </div>
        </div>

        <!-- Avatars: Current User + Partner / Invite Slot -->
        <div class="py-2 flex flex-col items-center justify-center">
          <div class="relative flex items-center justify-center gap-4 sm:gap-6 my-1">
            
            <!-- Current User (Me) -->
            <div class="flex flex-col items-center text-center">
              <div class="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-[#FE8D52] to-[#FF6433] shadow-md group">
                <img id="profile-avatar-preview" class="w-full h-full object-cover rounded-full bg-white" src="${avatarUrl}" alt="${displayName}">
                <label for="input-profile-avatar" class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#FF6433] hover:bg-[#eb5828] text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer active:scale-90 transition-all" title="Đổi ảnh đại diện">
                  <span class="material-symbols-outlined text-[13px]">photo_camera</span>
                </label>
                <input type="file" id="input-profile-avatar" accept="image/*" class="hidden">
              </div>
              <div class="mt-2 flex flex-col items-center gap-1">
                <span id="profile-display-name-text" class="text-xs sm:text-sm font-bold text-stone-900 truncate max-w-[170px] sm:max-w-[200px]" title="${displayName}">${displayName}</span>
                <button id="btn-toggle-edit-profile" type="button" class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 hover:bg-orange-100 text-[#FF6433] text-[11px] font-bold border border-orange-200/80 cursor-pointer active:scale-95 transition-all shadow-2xs" title="Bấm để đổi tên hiển thị">
                  <span class="material-symbols-outlined text-xs">edit</span>
                  <span>Đổi tên</span>
                </button>
              </div>
              <span class="text-[10px] text-stone-500 font-medium">Chủ tài khoản</span>
            </div>

            <!-- Heart Locket Center Piece -->
            <div class="relative flex flex-col items-center justify-center z-10 -mx-1 sm:-mx-2">
              <div class="w-11 h-11 rounded-full bg-white shadow-xs flex items-center justify-center border-2 border-dashed border-[#FF6433]/70">
                <span class="material-symbols-outlined text-[#FF6433] text-xl animate-pulse">favorite</span>
              </div>
              <span class="mt-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold">${totalMeals} bữa</span>
            </div>

            <!-- Partner Slot (Connected or Invite) -->
            <div class="flex flex-col items-center text-center">
              ${isConnected ? `
                <div class="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr ${primaryConn.relationship_type === 'couple' ? 'from-rose-400 to-rose-600' : 'from-emerald-400 to-emerald-600'} shadow-md">
                  <img class="w-full h-full object-cover rounded-full bg-white" src="${partnerAvatar}" alt="${partnerName}">
                  <span class="absolute bottom-0 right-0 text-sm shadow-2xs">${primaryConn.relationship_type === 'couple' ? '💕' : '🥑'}</span>
                </div>
                <span class="mt-2 text-xs sm:text-sm font-bold text-stone-900 truncate max-w-[100px]">${partnerName}</span>
                <span class="text-[10px] ${primaryConn.relationship_type === 'couple' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}">
                  ${primaryConn.relationship_type === 'couple' ? '💕 Người yêu' : '🥑 Bạn bè'}
                </span>
              ` : `
                <button id="btn-slot-invite" type="button" class="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[#FF6433] bg-orange-50/70 hover:bg-orange-100/70 transition-colors flex flex-col items-center justify-center text-[#FF6433] group active:scale-95 cursor-pointer">
                  <span class="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">person_add</span>
                  <span class="text-[9px] font-bold mt-0.5">Mời ngay</span>
                </button>
                <span class="mt-2 text-xs sm:text-sm font-semibold text-stone-500">Người yêu</span>
                <span class="text-[10px] text-[#FF6433] font-medium">Chờ kết nối...</span>
              `}
            </div>
          </div>

          <p class="mt-2 text-center text-xs text-stone-600 max-w-xs leading-relaxed">
            Mời một nửa của bạn tham gia để cùng chia sẻ từng bữa ăn hàng ngày cùng nhau nhé! 💕
          </p>
        </div>

        <!-- Inline Edit Display Name Form (Spacious & Clean) -->
        <div id="profile-edit-form" class="${this.isEditingProfile ? 'flex' : 'hidden'} flex-col gap-3 p-4 sm:p-5 bg-white/95 rounded-2xl border-2 border-orange-200/90 shadow-sm animate-fade-in my-2">
          <div>
            <label class="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Tên hiển thị mới (Tối đa 30 ký tự)
            </label>
            <input id="input-edit-display-name" type="text" value="${displayName}" maxlength="30" class="w-full h-11 bg-white px-3.5 py-2.5 text-sm font-bold text-stone-900 rounded-xl border border-orange-300 focus:outline-none focus:border-[#FF6433] focus:ring-2 focus:ring-orange-100 transition-all" placeholder="Nhập tên của bạn...">
          </div>
          <div class="flex items-center justify-end gap-2.5 pt-1">
            <button id="btn-cancel-edit-profile" type="button" class="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold active:scale-95 cursor-pointer transition-all">
              Hủy
            </button>
            <button id="btn-save-edit-profile" type="button" class="px-5 py-2 rounded-xl bg-[#FF6433] hover:bg-[#eb5828] text-white text-xs sm:text-sm font-bold shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer transition-all">
              <span class="material-symbols-outlined text-sm">save</span>
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>

        <!-- Couple Code Sharing Section -->
        <div class="bg-white/95 backdrop-blur-xs rounded-2xl p-3 border border-orange-200/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-orange-100/80 flex items-center justify-center text-[#FF6433] shrink-0">
              <span class="material-symbols-outlined text-lg">key</span>
            </div>
            <div class="truncate">
              <p class="text-[10px] text-stone-500 font-medium">Mã ghép đôi của bạn</p>
              <p class="text-sm tracking-wider font-extrabold text-[#FF6433] font-mono">${userCode}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button id="btn-copy-code" type="button" class="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer" title="Sao chép mã">
              <span class="material-symbols-outlined text-sm">content_copy</span>
              <span>Sao chép mã</span>
            </button>
            <button id="btn-share-invite" type="button" class="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#FF6433] hover:bg-[#eb5828] text-white text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer" title="Gửi link mời">
              <span class="material-symbols-outlined text-sm">share</span>
              <span>Gửi link mời</span>
            </button>
          </div>
        </div>

        <!-- Connection Input Box (Enter Partner's Code) -->
        <div id="connect-partner-box" class="pt-2 border-t border-orange-200/40">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span class="text-xs font-bold text-stone-800 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm text-[#FF6433]">person_add</span>
              <span>Nhập mã kết nối bạn bè / người thương:</span>
            </span>
            <!-- Relationship Selector -->
            <div class="inline-flex items-center gap-1 bg-white p-0.5 rounded-xl border border-stone-200/70 shadow-2xs self-start sm:self-auto">
              <button id="type-couple-btn" type="button" class="py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer ${this.selectedRelType === 'couple' ? 'bg-[#FF6433] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}">
                <span>💕 Người yêu</span>
              </button>
              <button id="type-friend-btn" type="button" class="py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer ${this.selectedRelType === 'friend' ? 'bg-[#FF6433] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}">
                <span>🥑 Bạn bè</span>
              </button>
            </div>
          </div>

          <div class="flex gap-2">
            <input id="input-target-code" type="text" placeholder="Nhập mã (VD: MAM922)" maxlength="10" class="flex-1 uppercase font-mono px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:border-[#FF6433]">
            <button type="button" id="btn-submit-connect" class="px-4 py-2 bg-[#FF6433] hover:bg-[#eb5828] text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer shrink-0">
              Kết nối
            </button>
          </div>
        </div>

        <!-- Connected Circle Stream (If Multiple Connections) -->
        ${connections.length > 0 ? `
          <div class="pt-2 border-t border-orange-200/40">
            <p class="text-[11px] font-bold text-stone-700 mb-2 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-[#FF6433]">favorite</span>
              <span>Kết nối & lời mời (${connections.length})</span>
            </p>
            <div class="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              ${connections.map(c => {
                const f = c.friend || {};
                const isPending = c.status === 'pending';
                const isC = c.relationship_type === 'couple';
                const cName = f.display_name || (isC ? 'Người yêu' : 'Bạn bè');
                const cAvatar = getUserAvatar(f.avatar_url, cName);
                return `
                  <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl ${isPending ? 'bg-amber-50 border border-amber-200' : (isC ? 'bg-rose-50/70 border border-rose-200/70' : 'bg-white border border-stone-200/70')}">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img class="w-8 h-8 rounded-full object-cover ring-1 ${isC ? 'ring-rose-400' : 'ring-emerald-400'}" src="${cAvatar}" alt="${cName}">
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-stone-900 truncate">${cName}</p>
                        <p class="text-[10px] text-stone-500 font-medium">🔥 ${f.streak_count || 1} ngày cùng nhau</p>
                      </div>
                    </div>
                    <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${isPending ? 'bg-amber-200 text-amber-900' : (isC ? 'bg-rose-200 text-rose-800' : 'bg-emerald-100 text-emerald-800')}">
                      ${isPending ? 'Đang chờ bạn đồng ý' : (isC ? '💕 Người yêu' : '🥑 Bạn bè')}
                    </span>
                    ${isPending ? `
                      <div class="flex gap-1 shrink-0">
                        <button type="button" data-approve-connection="${f.id}" class="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">Đồng ý</button>
                        <button type="button" data-decline-connection="${f.id}" class="px-2 py-1 rounded-lg border border-stone-200 bg-white text-stone-600 text-[10px] font-bold">Từ chối</button>
                      </div>
                    ` : ''}
                    ${isC && !isPending ? `
                      <button type="button" data-remove-couple="${f.id}" class="ml-2 shrink-0 px-2 py-1 rounded-lg border border-rose-200 bg-white text-rose-600 text-[10px] font-bold hover:bg-rose-100">
                        Hủy ghép đôi
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </section>

      <!-- 2. iOS Scriptable Widget & Camera Preferences (Tiện Ích & Tùy Chọn) -->
      <section class="shrink-0 bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col gap-3">
        <div class="flex items-center justify-between pb-2 border-b border-stone-100">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#FF6433] text-xl">tune</span>
            <div>
              <h3 class="text-xs sm:text-sm font-bold text-stone-900">Tùy Chọn & Tiện Ích</h3>
              <p class="text-[10px] text-stone-500">Widget màn hình chính iOS và cài đặt camera</p>
            </div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6433] font-bold">Tiện ích</span>
        </div>

        <!-- Scriptable iOS Home Screen Widget Banner (Locket Style) -->
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50/90 via-[#FFF8F3] to-amber-50/80 border border-orange-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div class="flex items-start sm:items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FF6433] to-[#FE8D52] text-white flex items-center justify-center shrink-0 shadow-xs">
              <span class="material-symbols-outlined text-2xl">widgets</span>
            </div>
            <div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <p class="text-xs sm:text-sm font-bold text-stone-900">Widget Màn Hình Chính (iOS)</p>
                <span class="px-2 py-0.5 rounded-full bg-[#FF6433] text-white text-[9px] font-black uppercase tracking-wider">Scriptable • Locket</span>
              </div>
              <p class="text-[11px] text-stone-600 mt-1 leading-relaxed">
                Đưa ảnh măm măm của người ấy ra trực tiếp màn hình chính iPhone. Tự động cập nhật & chạm mở app tức thì!
              </p>
            </div>
          </div>
          <button id="btn-open-widget-guide" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-white hover:bg-orange-50 text-[#FF6433] text-xs font-bold border border-orange-200 shadow-2xs active:scale-95 transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer" type="button">
            <span class="material-symbols-outlined text-base">code</span>
            <span>Lấy mã Script & Cài đặt</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <!-- Camera Source Preference & Permission Guide -->
        <div class="pt-1 flex flex-col gap-2">
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-stone-50 rounded-2xl border border-stone-200/60">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6433] shrink-0">
                <span class="material-symbols-outlined text-base">photo_camera</span>
              </div>
              <div>
                <p class="text-xs font-bold text-stone-800">Nguồn ảnh chụp</p>
                <p class="text-[10px] text-stone-500">Chọn chế độ ưu tiên khi mở giao diện chụp</p>
              </div>
            </div>

            <div class="flex items-center gap-2 self-end sm:self-auto">
              <select id="select-camera-preferred-source" class="px-2.5 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:border-[#FF6433] focus:outline-none cursor-pointer shadow-2xs">
                <option value="camera" ${preferredCameraSource === 'camera' ? 'selected' : ''}>📸 Camera trực tiếp</option>
                <option value="gallery" ${preferredCameraSource === 'gallery' ? 'selected' : ''}>🖼️ Chọn từ thư viện</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between px-1 text-xs">
            <span class="text-[11px] text-stone-500">Gặp khó khăn khi mở máy ảnh?</span>
            <button id="btn-settings-open-camera-guide" type="button" class="text-[11px] text-[#FF6433] hover:underline font-bold flex items-center gap-0.5 cursor-pointer">
              <span class="material-symbols-outlined text-xs">help_outline</span>
              <span>Cách bật "Luôn cho phép"</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 3. Account & Help (Tài Khoản & Trợ Giúp) -->
      <section class="shrink-0 bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-xs flex flex-col gap-3">
        <div class="flex items-center gap-2 pb-2 border-b border-stone-100">
          <span class="material-symbols-outlined text-[#FF6433] text-xl">manage_accounts</span>
          <h3 class="text-xs sm:text-sm font-bold text-stone-900">Tài Khoản & Trợ Giúp</h3>
        </div>

        <div class="flex flex-col divide-y divide-stone-100">
          <!-- Linked Account Identity -->
          <div class="py-2.5 flex items-center justify-between">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-[#FF6433] shrink-0">
                <span class="material-symbols-outlined text-base">mail</span>
              </div>
              <div class="min-w-0 truncate">
                <p class="text-xs font-bold text-stone-800">Tài khoản đăng nhập</p>
                <p class="text-[11px] text-stone-500 truncate">${accountIdentity}</p>
              </div>
            </div>
            <span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg shrink-0">Đã bảo vệ</span>
          </div>

          <!-- Edit Display Name -->
          <div id="row-open-edit-name" class="py-2.5 flex items-center justify-between cursor-pointer group hover:bg-orange-50/40 rounded-xl px-1 transition-colors">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6433] shrink-0">
                <span class="material-symbols-outlined text-base">badge</span>
              </div>
              <div class="min-w-0 truncate">
                <p class="text-xs font-bold text-stone-800 group-hover:text-[#FF6433] transition-colors">Đổi tên hiển thị tài khoản</p>
                <p class="text-[10px] text-stone-500 truncate">Hiện tại: <span class="font-bold text-[#FF6433]">${displayName}</span></p>
              </div>
            </div>
            <button type="button" class="px-2.5 py-1 rounded-xl bg-orange-50 text-[#FF6433] text-[11px] font-bold border border-orange-200/60 group-hover:bg-[#FF6433] group-hover:text-white transition-all pointer-events-none">
              Đổi tên
            </button>
          </div>

          <!-- Security & Change Password (Accordion) -->
          <div class="py-2.5 flex flex-col gap-2">
            <div class="flex items-center justify-between cursor-pointer" id="row-toggle-change-pwd">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6433] shrink-0">
                  <span class="material-symbols-outlined text-base">lock_reset</span>
                </div>
                <div>
                  <p class="text-xs font-bold text-stone-800">Bảo mật & Đổi mật khẩu</p>
                  <p class="text-[10px] text-stone-500">Cập nhật mật khẩu mới an toàn cho tài khoản</p>
                </div>
              </div>
              <button id="btn-toggle-change-pwd-box" type="button" class="text-stone-400 hover:text-[#FF6433] p-1 cursor-pointer">
                <span class="material-symbols-outlined text-lg" id="icon-toggle-pwd">${this.isChangePwdOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
            </div>

            <!-- Change Password Form -->
            <div id="change-pwd-box" class="${this.isChangePwdOpen ? 'flex' : 'hidden'} flex-col gap-2 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 animate-fade-in mt-1">
              <div id="pwd-change-msg" class="hidden p-2 text-[11px] rounded-xl font-medium"></div>

              <div class="relative">
                <input id="input-new-app-pwd" type="password" placeholder="Mật khẩu mới (tối thiểu 8 ký tự)" class="w-full pl-3 pr-9 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-[#FF6433]">
                <button type="button" id="btn-peek-new-pwd" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 flex items-center justify-center cursor-pointer">
                  <span class="material-symbols-outlined text-[17px]" id="icon-peek-new">visibility</span>
                </button>
              </div>

              <div class="relative">
                <input id="input-confirm-app-pwd" type="password" placeholder="Xác nhận mật khẩu mới" class="w-full pl-3 pr-9 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:border-[#FF6433]">
                <button type="button" id="btn-peek-confirm-pwd" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 flex items-center justify-center cursor-pointer">
                  <span class="material-symbols-outlined text-[17px]" id="icon-peek-confirm">visibility</span>
                </button>
              </div>

              <p class="text-[10px] text-stone-500">
                💡 Gồm tối thiểu 8 ký tự, có đủ chữ thường, chữ HOA, số và ký tự đặc biệt (!@#...).
              </p>

              <div class="flex justify-end gap-2 pt-1">
                <button type="button" id="btn-cancel-change-pwd" class="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 font-medium cursor-pointer">Hủy</button>
                <button type="button" id="btn-submit-change-pwd" class="px-4 py-1.5 bg-[#FF6433] hover:bg-[#eb5828] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer">Lưu mật khẩu mới</button>
              </div>
            </div>
          </div>

          <!-- Help / New user guide -->
          <div id="row-open-guide" class="py-2.5 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6433] shrink-0">
                <span class="material-symbols-outlined text-base">menu_book</span>
              </div>
              <div>
                <p class="text-xs font-bold text-stone-800 group-hover:text-[#FF6433] transition-colors">Hướng dẫn sử dụng cho người mới</p>
                <p class="text-[10px] text-stone-500">Cách chụp món, gửi locket và tạo thói quen cùng người ấy</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-stone-400 text-lg group-hover:text-[#FF6433] group-hover:translate-x-0.5 transition-all">chevron_right</span>
          </div>

          <!-- Privacy & Security -->
          <div id="row-open-privacy" class="py-2.5 flex items-center justify-between cursor-pointer group">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6433] shrink-0">
                <span class="material-symbols-outlined text-base">lock</span>
              </div>
              <div>
                <p class="text-xs font-bold text-stone-800 group-hover:text-[#FF6433] transition-colors">Quyền riêng tư đôi</p>
                <p class="text-[10px] text-stone-500">Chỉ bạn và người ấy xem được những bữa ăn này</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-stone-400 text-lg group-hover:text-[#FF6433] group-hover:translate-x-0.5 transition-all">chevron_right</span>
          </div>
        </div>

        <!-- Cache clear & Force update -->
        <div class="pt-2">
          <button id="btn-force-refresh-app" type="button" class="w-full py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 text-[#FF6433] text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-orange-200">
            <span class="material-symbols-outlined text-base">refresh</span>
            <span>Xóa cache & Cập nhật code mới</span>
          </button>
        </div>

        <!-- Log out button -->
        <div class="pt-1">
          <button id="btn-logout-action" type="button" class="w-full py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-200/50">
            <span class="material-symbols-outlined text-base text-[#FF6433]">logout</span>
            <span>Đăng xuất tài khoản</span>
          </button>
          <button id="btn-delete-account" type="button" class="w-full mt-2 py-2.5 rounded-2xl bg-white hover:bg-red-50 text-red-600 text-xs font-bold transition-all border border-red-200">
            Xóa tài khoản và dữ liệu
          </button>
        </div>
      </section>

      <!-- 4. Footer with Brand Icon & Version -->
      <footer class="flex flex-col items-center justify-center pt-2 pb-4 text-center gap-1.5">
        <div class="w-10 h-10 rounded-2xl p-1 bg-white shadow-xs border border-orange-100 flex items-center justify-center">
          <span class="text-2xl">🍱</span>
        </div>
        <h4 class="text-xs font-extrabold text-stone-900 tracking-tight">OurMam</h4>
        <p class="text-[10px] text-stone-500 font-medium">Couple Food Diary & Locket • Bản cập nhật 26/09/2026</p>
        <p class="text-[11px] text-stone-600 flex items-center gap-1 justify-center">
          Được làm với <span class="text-[#FF6433]">❤️</span> cho tình yêu và những bữa ăn ngon
        </p>
      </footer>
    `;

    // --------------------------------------------------------------------------
    // Event Bindings
    // --------------------------------------------------------------------------

    // 1. Edit Profile Form & Modal
    const btnToggleEdit = this.profilesContainer.querySelector('#btn-toggle-edit-profile');
    const formEdit = this.profilesContainer.querySelector('#profile-edit-form');
    const btnCancelEdit = this.profilesContainer.querySelector('#btn-cancel-edit-profile');
    const btnSaveEdit = this.profilesContainer.querySelector('#btn-save-edit-profile');
    const inputEditName = this.profilesContainer.querySelector('#input-edit-display-name');

    if (btnToggleEdit) {
      btnToggleEdit.addEventListener('click', () => {
        soundHelper.playPop();
        this.openEditNameModal(displayName, avatarUrl);
      });
    }

    const rowOpenEditName = this.profilesContainer.querySelector('#row-open-edit-name');
    if (rowOpenEditName) {
      rowOpenEditName.addEventListener('click', () => {
        soundHelper.playPop();
        this.openEditNameModal(displayName, avatarUrl);
      });
    }

    if (btnCancelEdit && formEdit) {
      btnCancelEdit.addEventListener('click', () => {
        this.isEditingProfile = false;
        formEdit.classList.add('hidden');
        formEdit.classList.remove('flex');
      });
    }

    if (btnSaveEdit && inputEditName) {
      btnSaveEdit.addEventListener('click', async () => {
        const newName = inputEditName.value.trim();
        if (!newName) {
          alert('Tên hiển thị không được để trống!');
          return;
        }
        btnSaveEdit.disabled = true;
        btnSaveEdit.textContent = 'Đang lưu...';
        if (this.onUpdateProfile) {
          await this.onUpdateProfile(newName);
        }
        this.isEditingProfile = false;
        this.renderProfileModalContent(currentUser, connections, meals);
      });
    }

    // 2. Avatar File Upload
    const inputAvatarFile = this.profilesContainer.querySelector('#input-profile-avatar');
    if (inputAvatarFile) {
      inputAvatarFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (this.onUpdateAvatar) {
          await this.onUpdateAvatar(file);
          this.renderProfileModalContent(currentUser, connections, meals);
        }
      });
    }

    // 3. Copy Code
    const btnCopy = this.profilesContainer.querySelector('#btn-copy-code');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(userCode);
        soundHelper.playPop();
        alert(`Đã sao chép mã ghép đôi: ${userCode} vào bộ nhớ tạm!`);
      });
    }

    // 4. Share Invite Link
    const btnShare = this.profilesContainer.querySelector('#btn-share-invite');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        soundHelper.playPop();
        const shareText = `Cùng chia sẻ bữa ăn mỗi ngày với mình qua OurMam nhé! 🍱❤️\nMã ghép đôi của mình là: ${userCode}\nVào app tại: ${window.location.origin}`;
        if (navigator.share) {
          navigator.share({
            title: 'OurMam - Food Locket',
            text: shareText,
            url: window.location.href
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareText);
          alert(`Đã copy lời mời kèm mã ${userCode} vào bộ nhớ tạm! Bạn có thể gửi cho người ấy ngay 💕`);
        }
      });
    }

    // 5. Slot Invite Click (Scroll & Focus connect input)
    const btnSlotInvite = this.profilesContainer.querySelector('#btn-slot-invite');
    const inputTarget = this.profilesContainer.querySelector('#input-target-code');
    if (btnSlotInvite && inputTarget) {
      btnSlotInvite.addEventListener('click', () => {
        inputTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputTarget.focus();
      });
    }

    // 6. Relationship Type Switcher
    const coupleBtn = this.profilesContainer.querySelector('#type-couple-btn');
    const friendBtn = this.profilesContainer.querySelector('#type-friend-btn');
    if (coupleBtn && friendBtn) {
      coupleBtn.addEventListener('click', () => {
        this.selectedRelType = 'couple';
        coupleBtn.className = 'py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer bg-[#FF6433] text-white shadow-2xs';
        friendBtn.className = 'py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer text-stone-600 hover:text-stone-900';
      });

      friendBtn.addEventListener('click', () => {
        this.selectedRelType = 'friend';
        friendBtn.className = 'py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer bg-[#FF6433] text-white shadow-2xs';
        coupleBtn.className = 'py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-0.5 cursor-pointer text-stone-600 hover:text-stone-900';
      });
    }

    // 7. Submit Connection
    const btnConnect = this.profilesContainer.querySelector('#btn-submit-connect');
    if (btnConnect && inputTarget) {
      btnConnect.addEventListener('click', async () => {
        const code = inputTarget.value.trim();
        if (!code) {
          alert('Vui lòng nhập mã của người bạn muốn kết nối!');
          return;
        }
        btnConnect.disabled = true;
        btnConnect.textContent = '...';
        await this.onAddConnection(code, this.selectedRelType);
        inputTarget.value = '';
        btnConnect.disabled = false;
        btnConnect.textContent = 'Kết nối';
      });
    }

    this.profilesContainer.querySelectorAll('[data-remove-couple]').forEach(button => {
      button.addEventListener('click', async () => {
        if (!window.confirm('Hủy ghép đôi với người này?')) return;
        button.disabled = true;
        button.textContent = 'Đang hủy…';
        try {
          await this.onRemoveCouple?.(button.dataset.removeCouple);
        } finally {
          button.disabled = false;
          button.textContent = 'Hủy ghép đôi';
        }
      });
    });

    this.profilesContainer.querySelectorAll('[data-approve-connection], [data-decline-connection]').forEach(button => {
      button.addEventListener('click', async () => {
        const approve = button.hasAttribute('data-approve-connection');
        const requesterId = button.dataset.approveConnection || button.dataset.declineConnection;
        button.disabled = true;
        button.textContent = approve ? 'Đang đồng ý…' : 'Đang từ chối…';
        await this.onRespondConnectionRequest?.(requesterId, approve);
      });
    });

    const btnDeleteAccount = this.profilesContainer.querySelector('#btn-delete-account');
    if (btnDeleteAccount) {
      btnDeleteAccount.addEventListener('click', async () => {
        const confirmed = window.confirm(
          'Xóa vĩnh viễn tài khoản, ảnh đã tải lên và dữ liệu gắn với tài khoản này? Thao tác này không thể hoàn tác.'
        );
        if (!confirmed) return;
        btnDeleteAccount.disabled = true;
        btnDeleteAccount.textContent = 'Đang xóa tài khoản…';
        try {
          await this.onDeleteAccount?.();
        } finally {
          btnDeleteAccount.disabled = false;
          btnDeleteAccount.textContent = 'Xóa tài khoản và dữ liệu';
        }
      });
    }

    // 8. Widget Installation Guide Trigger
    const btnOpenWidget = this.profilesContainer.querySelector('#btn-open-widget-guide');
    const modalWidget = document.getElementById('widget-guide-modal');
    if (btnOpenWidget && modalWidget) {
      btnOpenWidget.addEventListener('click', () => {
        soundHelper.playPop();
        const previewCodeEl = document.getElementById('widget-code-preview');
        if (previewCodeEl && (!previewCodeEl.textContent || previewCodeEl.textContent.trim().length === 0)) {
          previewCodeEl.textContent = SCRIPTABLE_WIDGET_CODE;
        }
        modalWidget.classList.remove('hidden');
        modalWidget.classList.add('flex');
      });
    }

    // 9. Camera Source & Permission Guide
    const selectCamSource = this.profilesContainer.querySelector('#select-camera-preferred-source');
    if (selectCamSource) {
      selectCamSource.addEventListener('change', (e) => {
        soundHelper.playPop();
        localStorage.setItem('ourmam_setting_camera_source', e.target.value);
      });
    }

    const btnSettingsCamGuide = this.profilesContainer.querySelector('#btn-settings-open-camera-guide');
    if (btnSettingsCamGuide) {
      btnSettingsCamGuide.addEventListener('click', () => {
        soundHelper.playPop();
        const modal = document.getElementById('camera-permission-modal');
        if (modal) {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
        }
      });
    }

    // 10. Help & Privacy Modals
    const rowOpenGuide = this.profilesContainer.querySelector('#row-open-guide');
    const modalHelp = document.getElementById('settings-help-modal');
    if (rowOpenGuide && modalHelp) {
      rowOpenGuide.addEventListener('click', () => {
        soundHelper.playPop();
        modalHelp.classList.remove('hidden');
      });
    }

    const rowOpenPrivacy = this.profilesContainer.querySelector('#row-open-privacy');
    const modalPrivacy = document.getElementById('privacy-info-modal');
    if (rowOpenPrivacy && modalPrivacy) {
      rowOpenPrivacy.addEventListener('click', () => {
        soundHelper.playPop();
        modalPrivacy.classList.remove('hidden');
      });
    }

    // 11. Change Password Accordion & Form
    const rowTogglePwd = this.profilesContainer.querySelector('#row-toggle-change-pwd');
    const btnTogglePwd = this.profilesContainer.querySelector('#btn-toggle-change-pwd-box');
    const boxPwd = this.profilesContainer.querySelector('#change-pwd-box');
    const iconTogglePwd = this.profilesContainer.querySelector('#icon-toggle-pwd');
    const btnCancelPwd = this.profilesContainer.querySelector('#btn-cancel-change-pwd');
    const btnSubmitPwd = this.profilesContainer.querySelector('#btn-submit-change-pwd');
    const inputNewPwd = this.profilesContainer.querySelector('#input-new-app-pwd');
    const inputConfirmPwd = this.profilesContainer.querySelector('#input-confirm-app-pwd');
    const msgPwd = this.profilesContainer.querySelector('#pwd-change-msg');
    const btnPeekNew = this.profilesContainer.querySelector('#btn-peek-new-pwd');
    const btnPeekConfirm = this.profilesContainer.querySelector('#btn-peek-confirm-pwd');

    const togglePwdBox = () => {
      this.isChangePwdOpen = !this.isChangePwdOpen;
      if (boxPwd) {
        boxPwd.classList.toggle('hidden', !this.isChangePwdOpen);
        boxPwd.classList.toggle('flex', this.isChangePwdOpen);
      }
      if (iconTogglePwd) iconTogglePwd.textContent = this.isChangePwdOpen ? 'expand_less' : 'expand_more';
    };

    if (rowTogglePwd) rowTogglePwd.addEventListener('click', (e) => {
      if (e.target.closest('#btn-toggle-change-pwd-box')) return;
      togglePwdBox();
    });
    if (btnTogglePwd) btnTogglePwd.addEventListener('click', togglePwdBox);

    if (btnCancelPwd && boxPwd) {
      btnCancelPwd.addEventListener('click', () => {
        this.isChangePwdOpen = false;
        boxPwd.classList.add('hidden');
        boxPwd.classList.remove('flex');
        if (iconTogglePwd) iconTogglePwd.textContent = 'expand_more';
        if (msgPwd) msgPwd.classList.add('hidden');
      });
    }

    const toggleVisibility = (input, icon) => {
      if (!input || !icon) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      icon.textContent = isPassword ? 'visibility_off' : 'visibility';
    };

    if (btnPeekNew) {
      btnPeekNew.addEventListener('click', () => {
        const icon = this.profilesContainer.querySelector('#icon-peek-new');
        toggleVisibility(inputNewPwd, icon);
      });
    }

    if (btnPeekConfirm) {
      btnPeekConfirm.addEventListener('click', () => {
        const icon = this.profilesContainer.querySelector('#icon-peek-confirm');
        toggleVisibility(inputConfirmPwd, icon);
      });
    }

    if (btnSubmitPwd && inputNewPwd && inputConfirmPwd) {
      btnSubmitPwd.addEventListener('click', async () => {
        const newPwd = inputNewPwd.value;
        const confirmPwd = inputConfirmPwd.value;

        const showMsg = (text, isError = true) => {
          if (!msgPwd) return;
          msgPwd.className = isError 
            ? 'p-2 text-[11px] rounded-xl font-medium bg-red-50 text-red-600 border border-red-200 block'
            : 'p-2 text-[11px] rounded-xl font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 block';
          msgPwd.textContent = text;
          msgPwd.classList.remove('hidden');
        };

        if (!newPwd || newPwd.length < 8) {
          showMsg('Mật khẩu mới phải có tối thiểu 8 ký tự!');
          return;
        }

        if (newPwd !== confirmPwd) {
          showMsg('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!');
          return;
        }

        btnSubmitPwd.disabled = true;
        btnSubmitPwd.textContent = 'Đang lưu...';
        if (msgPwd) msgPwd.classList.add('hidden');

        try {
          if (this.onUpdatePassword) {
            await this.onUpdatePassword(newPwd);
          }
          soundHelper.playPop();
          showMsg('Đã đổi mật khẩu thành công!', false);
          inputNewPwd.value = '';
          inputConfirmPwd.value = '';
          setTimeout(() => {
            this.isChangePwdOpen = false;
            if (boxPwd) {
              boxPwd.classList.add('hidden');
              boxPwd.classList.remove('flex');
            }
            if (iconTogglePwd) iconTogglePwd.textContent = 'expand_more';
          }, 2000);
        } catch (err) {
          console.error("Change pwd error:", err);
          showMsg(err.message || 'Không thể đổi mật khẩu. Vui lòng thử lại!');
        } finally {
          btnSubmitPwd.disabled = false;
          btnSubmitPwd.textContent = 'Lưu mật khẩu mới';
        }
      });
    }

    // 12. Force Refresh & Cache Clear Action
    const btnForceRefresh = this.profilesContainer.querySelector('#btn-force-refresh-app');
    if (btnForceRefresh) {
      btnForceRefresh.addEventListener('click', async () => {
        btnForceRefresh.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">refresh</span><span>Đang làm mới...</span>';
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.unregister();
        }
        localStorage.removeItem('ourmam_app_version');
        window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
      });
    }

    // 13. Logout Action
    const btnLogout = this.profilesContainer.querySelector('#btn-logout-action');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        this.closeProfileModal();
        this.onLogout();
      });
    }
  }

  openPhotoModal(meal, startEditing = false) {
    if (!this.photoModal || !meal) return;
    this.currentPhotoMeal = meal;
    this.detailImg.src = meal.photo_url;
    this.detailAvatar.src = getUserAvatar(meal.user_avatar, meal.user_name || "Người dùng");
    this.detailAuthor.textContent = meal.user_name || "Người thương";
    this.detailTime.textContent = formatMealTime(meal.created_at, meal.meal_type) + " • " + (meal.location || "Sài Gòn");
    this.detailTag.textContent = this.getTagLabel(meal.meal_type);
    this.detailCaption.textContent = meal.caption || `“${meal.dish_name || 'Món ngon'}”`;

    const canEdit = Boolean(this.currentUser?.id && meal.user_id === this.currentUser.id);
    const editButton = document.getElementById('btn-edit-photo');
    const editForm = document.getElementById('photo-edit-form');
    const btnDeletePhotoTop = document.getElementById('btn-delete-photo-modal');
    const btnDeletePhotoAction = document.getElementById('btn-delete-photo-action');

    // Only author can edit or delete this photo
    if (btnDeletePhotoTop) btnDeletePhotoTop.classList.toggle('hidden', !canEdit);
    if (btnDeletePhotoAction) btnDeletePhotoAction.classList.toggle('hidden', !canEdit);
    if (editButton) editButton.classList.toggle('hidden', !canEdit);

    if (editForm) {
      const dishInput = editForm.querySelector('#photo-edit-dish');
      const caloriesInput = editForm.querySelector('#photo-edit-calories');
      const locationInput = editForm.querySelector('#photo-edit-location');
      const typeInput = editForm.querySelector('#photo-edit-meal-type');
      const tagButtons = editForm.querySelectorAll('.photo-edit-tag-btn');

      if (dishInput) dishInput.value = meal.dish_name || (meal.caption ? meal.caption.replace(/^“|”$/g, '') : '');
      if (caloriesInput) caloriesInput.value = meal.calories || '';
      if (locationInput) locationInput.value = meal.location || '';
      const currentTag = meal.meal_type || 'lunch';
      if (typeInput) typeInput.value = currentTag;

      if (tagButtons) {
        tagButtons.forEach(b => {
          const isMatch = b.dataset.tag === currentTag;
          b.classList.toggle('active', isMatch);
          b.classList.toggle('bg-[#FF6433]', isMatch);
          b.classList.toggle('text-white', isMatch);
          b.classList.toggle('font-bold', isMatch);
          b.classList.toggle('shadow-xs', isMatch);
          b.classList.toggle('text-stone-500', !isMatch);
          b.classList.toggle('font-semibold', !isMatch);
        });
      }

      if (startEditing && canEdit) {
        editForm.classList.remove('hidden');
        if (editButton) editButton.classList.add('hidden');
        setTimeout(() => dishInput?.focus(), 200);
      } else {
        editForm.classList.add('hidden');
      }
    }
    this.photoModal.classList.remove('hidden');
    this.photoModal.classList.add('flex');
  }

  setCurrentUser(currentUser) {
    this.currentUser = currentUser;
  }

  closePhotoModal() {
    this.photoModal.classList.add('hidden');
    this.photoModal.classList.remove('flex');
    this.currentPhotoMeal = null;
  }

  openDeleteConfirm(meal) {
    if (!meal) return;
    if (this.currentUser?.id && meal.user_id !== this.currentUser.id) {
      alert('Bạn chỉ có quyền xoá ảnh do chính mình đăng.');
      return;
    }
    this.currentPhotoMeal = meal;
    const modalDeleteConfirm = document.getElementById('delete-confirm-modal');
    if (modalDeleteConfirm) {
      modalDeleteConfirm.classList.remove('hidden');
      modalDeleteConfirm.classList.add('flex');
    }
  }

  closeDeleteConfirm() {
    const modalDeleteConfirm = document.getElementById('delete-confirm-modal');
    if (modalDeleteConfirm) {
      modalDeleteConfirm.classList.add('hidden');
      modalDeleteConfirm.classList.remove('flex');
    }
  }

  getTagLabel(tag) {
    switch (tag) {
      case 'breakfast': return '☀️ Bữa Sáng';
      case 'dinner': return '🌙 Bữa Tối';
      case 'snack': return '🧋 Ăn Vặt';
      default: return '🍱 Bữa Trưa';
    }
  }

  copyScriptableWidgetCode(buttonEl) {
    soundHelper.playPop();
    const originalContent = buttonEl ? buttonEl.innerHTML : null;

    const onSuccess = () => {
      if (buttonEl) {
        buttonEl.innerHTML = `
          <span class="material-symbols-outlined text-base">check_circle</span>
          <span>Đã chép mã Script!</span>
        `;
        buttonEl.classList.add('!bg-emerald-600', 'hover:!bg-emerald-700');
        setTimeout(() => {
          if (originalContent) buttonEl.innerHTML = originalContent;
          buttonEl.classList.remove('!bg-emerald-600', 'hover:!bg-emerald-700');
        }, 2500);
      }
      this.showModalToast('✅ Đã sao chép mã Script OurMam! Mở Scriptable và dán vào nhé.');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SCRIPTABLE_WIDGET_CODE)
        .then(onSuccess)
        .catch(() => {
          this.fallbackCopyText(SCRIPTABLE_WIDGET_CODE);
          onSuccess();
        });
    } else {
      this.fallbackCopyText(SCRIPTABLE_WIDGET_CODE);
      onSuccess();
    }
  }

  fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.warn('Fallback copy failed', e);
    }
    document.body.removeChild(textArea);
  }

  showModalToast(message) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-stone-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20 transition-all duration-300';
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
}

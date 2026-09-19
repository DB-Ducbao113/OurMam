/**
 * ==============================================================================
 * HEADER COMPONENT (TOP APP BAR)
 * ==============================================================================
 */

import { getUserAvatar } from '../utils/avatarHelper.js';

export class HeaderComponent {
  constructor(onOpenProfileModal) {
    this.avatarEl = document.getElementById('current-user-avatar');
    this.nameEl = document.getElementById('current-user-name');
    this.streakEl = document.getElementById('header-streak-badge');
    this.switcherBtn = document.getElementById('profile-switcher-btn');
    this.btnShare = document.getElementById('btn-share-app');

    this.onOpenProfileModal = onOpenProfileModal;
    this.bindEvents();
  }

  bindEvents() {
    this.switcherBtn.addEventListener('click', () => this.onOpenProfileModal());

    if (this.btnShare) {
      this.btnShare.addEventListener('click', () => {
        if (navigator.share) {
          navigator.share({
            title: 'OurMam - Food Locket',
            text: 'Cùng chia sẻ bữa ăn mỗi ngày với anh/em nhé! 🍱❤️',
            url: window.location.href
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(window.location.href);
          alert('Đã copy link app vào bộ nhớ tạm! Gửi cho người thương ngay nhé 💕');
        }
      });
    }
  }

  render(currentUser) {
    if (!currentUser) return;
    const name = currentUser.display_name || 'Bạn';
    this.avatarEl.src = getUserAvatar(currentUser.avatar_url, name);
    this.nameEl.textContent = name;
    const streak = currentUser.streak_count ?? 0;
    this.streakEl.textContent = `🔥 ${streak}`;
  }
}


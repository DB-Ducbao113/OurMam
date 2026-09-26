/**
 * ==============================================================================
 * HEADER COMPONENT (TOP APP BAR WITH NOTIFICATIONS & STREAK)
 * ==============================================================================
 */

import { getUserAvatar } from '../utils/avatarHelper.js';
import { soundHelper } from '../utils/soundHelper.js';

export class HeaderComponent {
  constructor(onOpenProfileModal, onSelectMeal) {
    this.avatarEl = document.getElementById('current-user-avatar');
    this.nameEl = document.getElementById('current-user-name');
    this.streakEl = document.getElementById('header-streak-badge');
    this.switcherBtn = document.getElementById('profile-switcher-btn');
    this.btnShare = document.getElementById('btn-share-app');

    // Notifications elements
    this.btnNotif = document.getElementById('btn-notifications');
    this.notifBadge = document.getElementById('header-notif-badge');
    this.notifDropdown = document.getElementById('notif-dropdown');
    this.notifListContainer = document.getElementById('notif-list-container');
    this.btnClearNotifs = document.getElementById('btn-clear-notifs');

    this.onOpenProfileModal = onOpenProfileModal;
    this.onSelectMeal = onSelectMeal;
    this.notifications = [];
    this.hasUnread = false;

    this.bindEvents();
  }

  bindEvents() {
    this.switcherBtn?.addEventListener('click', () => this.onOpenProfileModal());

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

    // Toggle Notifications Dropdown
    if (this.btnNotif && this.notifDropdown) {
      this.btnNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        soundHelper.playPop();
        const isHidden = this.notifDropdown.classList.contains('hidden');
        if (isHidden) {
          this.notifDropdown.classList.remove('hidden');
          this.notifDropdown.classList.add('flex');
          this.clearBadge();
        } else {
          this.notifDropdown.classList.add('hidden');
          this.notifDropdown.classList.remove('flex');
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.notifDropdown.contains(e.target) && !this.btnNotif.contains(e.target)) {
          this.notifDropdown.classList.add('hidden');
          this.notifDropdown.classList.remove('flex');
        }
      });
    }

    if (this.btnClearNotifs) {
      this.btnClearNotifs.addEventListener('click', () => {
        this.notifications = [];
        localStorage.removeItem('ourmam_notifications');
        this.clearBadge();
        this.renderNotifications();
      });
    }
  }

  render(currentUser) {
    if (!currentUser) return;
    const name = currentUser.display_name || 'Bạn';
    if (this.avatarEl) this.avatarEl.src = getUserAvatar(currentUser.avatar_url, name);
    if (this.nameEl) this.nameEl.textContent = name;
    const streak = currentUser.streak_count ?? 0;
    if (this.streakEl) this.streakEl.textContent = `🔥 ${streak}`;
  }

  setNotifications(notifications = []) {
    this.notifications = Array.isArray(notifications) ? notifications : [];
    this.renderNotifications();
  }

  addNotification(notif) {
    if (!notif) return;
    this.notifications.unshift(notif);
    // Keep max 20 notifications
    if (this.notifications.length > 20) {
      this.notifications = this.notifications.slice(0, 20);
    }
    try {
      localStorage.setItem('ourmam_notifications', JSON.stringify(this.notifications));
    } catch (e) {}

    this.showBadge();
    this.renderNotifications();
  }

  showBadge() {
    this.hasUnread = true;
    if (this.notifBadge) {
      this.notifBadge.classList.remove('hidden');
    }
  }

  clearBadge() {
    this.hasUnread = false;
    if (this.notifBadge) {
      this.notifBadge.classList.add('hidden');
    }
  }

  renderNotifications() {
    if (!this.notifListContainer) return;
    if (!this.notifications || this.notifications.length === 0) {
      this.notifListContainer.innerHTML = `
        <p id="notif-empty-text" class="text-xs text-stone-400 text-center py-4">Chưa có thông báo mới nào 🔔</p>
      `;
      return;
    }

    this.notifListContainer.innerHTML = '';
    this.notifications.forEach(item => {
      const el = document.createElement('div');
      el.className = 'flex items-center gap-2.5 p-2 rounded-xl hover:bg-orange-50/60 active:scale-98 transition-all cursor-pointer border border-stone-100/80';
      const timeStr = item.time ? new Date(item.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
      
      el.innerHTML = `
        <img class="w-9 h-9 rounded-xl object-cover shrink-0 border border-orange-200" src="${item.photo_url || item.avatar || ''}" alt="Thumb">
        <div class="min-w-0 flex-1 text-left">
          <p class="text-xs font-bold text-stone-900 truncate">${item.title || 'Món mới'}</p>
          <p class="text-[10px] text-stone-500 truncate">${item.desc || ''} · ${timeStr}</p>
        </div>
        <span class="material-symbols-outlined text-stone-300 text-sm">chevron_right</span>
      `;

      el.addEventListener('click', () => {
        this.notifDropdown?.classList.add('hidden');
        this.notifDropdown?.classList.remove('flex');
        if (item.meal && this.onSelectMeal) {
          this.onSelectMeal(item.meal);
        }
      });

      this.notifListContainer.appendChild(el);
    });
  }
}

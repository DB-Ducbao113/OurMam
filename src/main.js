/**
 * ==============================================================================
 * OURMAM - APPLICATION ENTRY ORCHESTRATOR (SUPABASE AUTH & LIVE CIRCLE FEED)
 * ==============================================================================
 */

import { api } from './services/api.js?v=2026091999';
import { mealService } from './services/mealService.js?v=2026091999';
import { profileService } from './services/profileService.js?v=2026091999';
import { chatService } from './services/chatService.js?v=2026091999';
import { HeaderComponent } from './components/header.js?v=2026091999';
import { LocketFeedComponent } from './components/locketFeed.js?v=2026092107';
import { CameraViewComponent } from './components/cameraView.js?v=2026092107';
import { CalendarViewComponent } from './components/calendarView.js?v=2026091999';
import { ChatViewComponent } from './components/chatView.js?v=2026092102';
import { NavigationComponent } from './components/navigation.js?v=2026091999';
import { ModalsComponent } from './components/modals.js?v=2026092103';
import { AuthViewComponent } from './components/authView.js?v=2026092100';
import { soundHelper } from './utils/soundHelper.js?v=2026091999';
import { getUserAvatar } from './utils/avatarHelper.js?v=2026091999';
import { compressImageFile, dataUrlToBlob } from './utils/imageCompressor.js?v=2026091660';
import { getCurrentLocationName } from './utils/locationHelper.js?v=2026091660';

class App {
  constructor() {
    this.currentUser = profileService.getCurrentUser();
    this.connections = [];
    this.meals = [];
    this.messages = [];
    this.session = null;
    this.currentLocketTab = 'auto';

    this.cleanOAuthUrl();
    this.initAuth();
    this.initComponents();
    this.initRealtime();
    this.registerServiceWorker();
  }

  cleanOAuthUrl() {
    // If returning from Google OAuth, clean access tokens from URL
    if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token'))) {
      setTimeout(() => {
        window.history.replaceState(null, document.title, window.location.pathname);
      }, 500);
    }
  }

  async start() {
    try {
      if (api.client) {
        // 1. Direct validation with Supabase Auth session
        const session = await api.getSession();

        if (!session || !session.user) {
          await this.handleLogout(false);
          return;
        }

        // 2. Direct validation with Supabase Profiles table (with auto-ensure fallback)
        let profile = await profileService.fetchProfile(session.user.id);
        if (!profile) {
          profile = await profileService.ensureProfile(session.user);
        }

        if (!profile) {
          console.warn("Profile row could not be loaded or created. Logging out...");
          await this.handleLogout(false);
          return;
        }

        // User & Profile verified!
        this.session = session;
        this.currentUser = profile;
        await this.loadUserData(session.user.id);
        this.authView.hide();
        this.render();
        return;
      }

      // Local / Offline fallback mode (when api.client is not configured)
      const isLocalAuth = localStorage.getItem('ourmam_auth') === 'true';
      if (isLocalAuth) {
        this.currentUser = profileService.getCurrentUser();
        if (this.currentUser) {
          this.authView.hide();
          this.meals = await mealService.getMeals();
          this.messages = await chatService.getMessages();
          this.render();
        } else {
          this.authView.show();
        }
      } else {
        this.authView.show();
      }
    } catch (err) {
      console.error("App start error:", err);
      await this.handleLogout(false);
    }
  }

  async loadUserData(userId) {
    // 1. Fetch Profile
    const profile = await profileService.fetchProfile(userId);
    if (profile) {
      this.currentUser = profile;
    }

    // 2. Fetch Connections (Friends & Couple)
    this.connections = await profileService.getConnections(userId);
    this.renderPartnerFeed();

    // 3. Fetch Meals & Chat
    this.meals = await mealService.getMeals();
    this.messages = await chatService.getMessages();
    this.renderPartnerFeed();
  }

  initAuth() {
    this.authView = new AuthViewComponent(async (user, customDisplayName) => {
      localStorage.setItem('ourmam_auth', 'true');

      if (user && user.id) {
        await this.loadUserData(user.id);
        if (customDisplayName && this.currentUser) {
          this.currentUser.display_name = customDisplayName;
          await profileService.updateDisplayName(user.id, customDisplayName);
        }
      }

      this.authView.hide();
      this.render();
      if (this.currentUser) {
        this.showToast(`Chào mừng ${this.currentUser.display_name}! 💕`);
      }
    });

    // Listen to Supabase auth state change (e.g. Google OAuth redirect return or signout)
    if (api.client) {
      api.client.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          let profile = await profileService.fetchProfile(session.user.id);
          if (!profile) {
            profile = await profileService.ensureProfile(session.user);
          }
          if (profile) {
            this.session = session;
            this.currentUser = profile;
            localStorage.setItem('ourmam_auth', 'true');
            await this.loadUserData(session.user.id);
            this.authView.hide();
            this.render();
            this.cleanOAuthUrl();
          } else {
            await this.handleLogout(false);
          }
        } else if (event === 'SIGNED_OUT') {
          this.session = null;
          this.currentUser = null;
          if (this.authView) this.authView.show();
        }
      });
    }
  }

  initComponents() {
    // 1. Modals
    this.modals = new ModalsComponent(
      (code, relType) => this.handleAddConnection(code, relType),
      (status) => this.handleUpdateStatus(status),
      () => this.handleLogout(true),
      (newName) => this.handleUpdateProfile(newName),
      (file) => this.handleUpdateAvatar(file),
      (newPassword) => this.handleUpdatePassword(newPassword),
      (mealId) => this.handleDeleteMeal(mealId)
    );

    // 2. Header
    this.header = new HeaderComponent(() => this.openProfileModal());

    // 3. Locket Feed
    this.locketFeed = new LocketFeedComponent(
      (meal) => this.modals.openPhotoModal(meal),
      (meal, emoji, label) => this.handleReaction(meal, emoji, label),
      (meal, text) => this.handleQuickReply(meal, text),
      () => this.handleFocusCamera(),
      () => this.openProfileModal(),
      (meal) => this.modals.openDeleteConfirm(meal),
      () => this.navigation.switchTab('tab-calendar')
    );

    // 4. Camera View
    this.cameraView = new CameraViewComponent(
      (payload) => this.handlePublishMeal(payload)
    );

    // 5. Calendar View
    this.calendarView = new CalendarViewComponent(
      (meal) => this.modals.openPhotoModal(meal),
      (meal) => this.modals.openDeleteConfirm(meal)
    );

    // 6. Chat View
    this.chatView = new ChatViewComponent(
      (payload) => this.handleChatMessage(payload),
      () => this.openProfileModal(),
      (meal) => this.modals.openPhotoModal(meal),
      (partner) => this.openNicknameModal(partner)
    );

    this.navigation = new NavigationComponent((tabId) => {
      if (tabId === 'tab-calendar') this.calendarView.setMeals(this.meals);
      if (tabId === 'tab-chat') {
        if (this.chatView.onTabOpened) {
          this.chatView.onTabOpened();
        }
        this.chatView.render(this.messages, this.currentUser ? this.currentUser.id : null, this.connections, this.currentUser);
        // Instant background sync on opening chat tab
        chatService.getRecentMessages(25).then(recents => {
          if (Array.isArray(recents)) {
            recents.forEach(msg => {
              if (!this.messages.some(m => m.id === msg.id)) {
                this.handleIncomingMessage(msg);
              }
            });
          }
        }).catch(() => {});
      }
    });

    // Peek timeline button link
    const btnPeek = document.getElementById('btn-peek-timeline');
    if (btnPeek) {
      btnPeek.addEventListener('click', () => {
        this.navigation.switchTab('tab-calendar');
      });
    }

    // Calendar Add Partner Button
    const btnCalAdd = document.getElementById('btn-cal-add-partner');
    if (btnCalAdd) {
      btnCalAdd.addEventListener('click', () => this.openProfileModal());
    }
  }

  render() {
    if (!this.currentUser) return;
    this.header.render(this.currentUser);
    this.renderPartnerFeed();
    this.calendarView.setMeals(this.meals);
    this.chatView.render(this.messages, this.currentUser.id, this.connections, this.currentUser);

    const partner = this.getPartnerProfile();
    if (partner) {
      this.cameraView.updatePartnerTitle(partner.display_name);
    } else {
      this.cameraView.updatePartnerTitle("Bạn bè");
    }

    // Update Calendar Header Elements
    const streakEl = document.getElementById('cal-streak-text');
    const totalMealsEl = document.getElementById('cal-total-meals');
    const peekBadgeEl = document.getElementById('peek-badge');
    const peekBtn = document.getElementById('btn-peek-timeline');
    const calTitleEl = document.getElementById('cal-header-title');
    const calPartnerAvatarWrapper = document.getElementById('cal-partner-avatar-wrapper');
    const calPartnerAvatar = document.getElementById('cal-partner-avatar');
    const calUserAvatar = document.getElementById('cal-user-avatar');
    const btnCalAdd = document.getElementById('btn-cal-add-partner');

    if (calUserAvatar && this.currentUser) {
      calUserAvatar.src = getUserAvatar(this.currentUser.avatar_url, this.currentUser.display_name || 'Bạn');
    }

    if (partner) {
      if (calPartnerAvatarWrapper) calPartnerAvatarWrapper.classList.remove('hidden');
      if (calPartnerAvatar) calPartnerAvatar.src = getUserAvatar(partner.avatar_url, partner.display_name || 'Bạn bè');
      if (btnCalAdd) btnCalAdd.classList.add('hidden');
      if (calTitleEl) calTitleEl.textContent = "Nhật Ký Bữa Ăn Đôi";
    } else {
      if (calPartnerAvatarWrapper) calPartnerAvatarWrapper.classList.add('hidden');
      if (btnCalAdd) btnCalAdd.classList.remove('hidden');
      if (calTitleEl) calTitleEl.textContent = "Nhật Ký Bữa Ăn";
    }

    if (streakEl) streakEl.textContent = this.currentUser.streak_count || 0;
    if (totalMealsEl) totalMealsEl.textContent = `${this.meals.length} món`;
    if (peekBadgeEl) peekBadgeEl.textContent = Math.max(0, this.meals.length - 1);
    if (peekBtn) {
      if (this.meals.length > 1) {
        peekBtn.classList.remove('hidden');
        peekBtn.classList.add('flex');
      } else {
        peekBtn.classList.add('hidden');
        peekBtn.classList.remove('flex');
      }
    }
  }

  getPartnerProfile() {
    let conns = this.connections;
    if (!conns || conns.length === 0) {
      conns = api.getLocal('ourmam_connections', []);
    }
    if (conns && conns.length > 0) {
      const coupleConn = conns.find(c => c.relationship_type === 'couple');
      if (coupleConn?.friend) {
        const customNick = coupleConn.friend.custom_nickname || coupleConn.nickname || null;
        return {
          ...coupleConn.friend,
          display_name: customNick || coupleConn.friend.display_name,
          raw_display_name: coupleConn.friend.display_name,
          custom_nickname: customNick,
          relationship_type: 'couple'
        };
      }
      if (conns[0]?.friend) {
        const customNick = conns[0].friend.custom_nickname || conns[0].nickname || null;
        return {
          ...conns[0].friend,
          display_name: customNick || conns[0].friend.display_name,
          raw_display_name: conns[0].friend.display_name,
          custom_nickname: customNick,
          relationship_type: conns[0].relationship_type || 'friend'
        };
      }
    }
    return null;
  }

  openNicknameModal(partner) {
    if (!partner) return;
    this.modals.openNicknameModal(partner, (newNickname) => {
      this.handleUpdateNickname(partner.id, newNickname);
    });
  }

  async handleUpdateNickname(friendId, newNickname) {
    if (!this.currentUser) return;
    await profileService.updateNickname(this.currentUser.id, friendId, newNickname);

    // Refresh connections in memory
    this.connections = await profileService.getConnections(this.currentUser.id);

    // Re-render feeds
    this.renderPartnerFeed();
    this.chatView.render(this.messages, this.currentUser.id, this.connections, this.currentUser);

    soundHelper.playPop();
    if (newNickname) {
      this.showToast(`✨ Đã đặt biệt danh: "${newNickname}"!`);
    } else {
      this.showToast(`Đã xóa biệt danh.`);
    }
  }

  renderPartnerFeed() {
    const partner = this.getPartnerProfile();
    this.locketFeed.render(this.meals, partner, this.currentUser);
  }

  handleFocusCamera() {
    const cameraSection = document.getElementById('camera-section-title') || document.getElementById('camera-video');
    if (cameraSection) {
      cameraSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const input = document.getElementById('input-meal-caption');
    if (input) {
      setTimeout(() => input.focus(), 300);
    }
  }

  async openProfileModal() {
    const uid = this.currentUser?.id || this.session?.user?.id;
    if (uid) {
      try {
        this.connections = await profileService.getConnections(uid);
      } catch (e) {}
    }
    this.modals.openProfileModal(this.currentUser, this.connections, this.meals);
  }

  async handleAddConnection(code, relType) {
    const res = await profileService.addConnection(code, relType);
    if (res.success) {
      soundHelper.playPop();
      this.showToast(res.message);
      const uid = this.currentUser?.id || this.session?.user?.id;
      if (uid) {
        this.connections = await profileService.getConnections(uid);
      }
      this.render();
      this.modals.openProfileModal(this.currentUser, this.connections, this.meals);
    } else {
      alert(res.message || "Không thể kết nối. Vui lòng kiểm tra lại mã!");
    }
  }

  async handleUpdateStatus(statusText) {
    const targetUid = this.currentUser?.id || this.session?.user?.id;
    if (targetUid) {
      await profileService.updateStatus(targetUid, statusText);
    }
    this.currentUser.status_text = statusText;
    this.render();
  }

  async handleUpdateProfile(newName) {
    if (!this.currentUser) return;
    this.currentUser.display_name = newName;

    const targetUid = this.currentUser?.id || this.session?.user?.id;
    if (targetUid) {
      await profileService.updateDisplayName(targetUid, newName);
    } else {
      profileService.setCurrentUser(this.currentUser);
    }

    this.render();
    soundHelper.playPop();
    this.showToast(`Đã đổi tên thành: ${newName} ✨`);
  }

  async handleUpdateAvatar(file) {
    if (!this.currentUser || !file) return;
    try {
      this.showToast("Đang tải ảnh đại diện lên... ⏳");
      const dataUrl = await compressImageFile(file, 400, 0.85, true);
      const blob = dataUrlToBlob(dataUrl);
      
      let uploadedUrl = null;
      if (this.session?.user?.id && api.client) {
        uploadedUrl = await api.uploadPhoto(blob);
      }

      const finalAvatar = uploadedUrl || dataUrl;
      this.currentUser.avatar_url = finalAvatar;

      const targetUid = this.currentUser?.id || this.session?.user?.id;
      if (targetUid) {
        await profileService.updateAvatar(targetUid, finalAvatar);
      } else {
        profileService.setCurrentUser(this.currentUser);
      }

      this.render();
      soundHelper.playPop();
      this.showToast("Đã cập nhật ảnh đại diện mới! 📸✨");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Không thể tải ảnh lên. Vui lòng thử lại!");
    }
  }

  async handleUpdatePassword(newPassword) {
    const res = await api.updateUserPassword(newPassword);
    this.showToast("Mật khẩu đã được cập nhật an toàn! 🔒✨");
    return res;
  }

  async handlePublishMeal({ photoUrl, tag, caption, blob, calories, location }) {
    const defaultCaption = this.getDefaultCaption(tag);
    const finalCaption = caption ? `“${caption}”` : `“${defaultCaption}”`;
    const dishName = caption || "Món ngon hôm nay";
    
    // Use user inputted location if provided, otherwise fallback to auto-fetch
    const userLocation = location || await getCurrentLocationName();

    const tempId = 'temp-' + Date.now();
    const optimisticMeal = {
      id: tempId,
      user_id: this.currentUser.id,
      user_name: this.currentUser.display_name || "Bạn 🌸",
      user_avatar: this.currentUser.avatar_url,
      photo_url: photoUrl,
      dish_name: dishName,
      caption: finalCaption,
      meal_type: tag,
      location: userLocation,
      calories: calories || null,
      rating: null,
      audience: "all",
      created_at: new Date().toISOString(),
      reactions: [],
      isUploading: true
    };

    // Optimistic UI update
    this.meals.unshift(optimisticMeal);
    this.render();
    soundHelper.playPop();

    try {
      const newMeal = await mealService.createMeal({
        user_id: optimisticMeal.user_id,
        user_name: optimisticMeal.user_name,
        user_avatar: optimisticMeal.user_avatar,
        photo_url: photoUrl,
        dish_name: optimisticMeal.dish_name,
        caption: optimisticMeal.caption,
        meal_type: optimisticMeal.meal_type,
        location: optimisticMeal.location,
        calories: optimisticMeal.calories,
        rating: null,
        audience: "all"
      }, blob);

      // Replace temp meal with real one
      const idx = this.meals.findIndex(m => m.id === tempId);
      if (idx !== -1) {
        this.meals[idx] = newMeal;
      }
      this.render();
      this.showToast("Đã gửi món ngon lên Locket! 💕");

      // Automated chat notification
      await this.handleChatMessage({
        text: `Vừa gửi đĩa ăn mới: ${dishName} 🍱`,
        photoUrl: newMeal.photo_url
      });
    } catch (err) {
      console.error("Publish error:", err);
      this.meals = this.meals.filter(m => m.id !== tempId);
      this.render();
      alert("Lỗi mạng khi tải ảnh lên, vui lòng thử lại!");
    }
  }

  async handleChatMessage({ text, photoUrl, receiverId }) {
    if (!this.currentUser) return;
    const partner = receiverId 
      ? this.connections.find(c => c.friend?.id === receiverId)?.friend 
      : this.getPartnerProfile();

    const tempId = "temp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const optimisticMsg = {
      id: tempId,
      sender_id: this.currentUser.id,
      receiver_id: partner?.id || null,
      sender_name: this.currentUser.display_name || "Bạn",
      sender_avatar: this.currentUser.avatar_url,
      text: text,
      photo_url: photoUrl || null,
      created_at: new Date().toISOString(),
      _status: 'sending'
    };

    // ⚡ 1. INSTANT LOCAL UPDATE (0ms lag - bubble appears immediately)
    this.messages.push(optimisticMsg);
    this.chatView.appendOrUpdateMessage(optimisticMsg);
    soundHelper.playPop();

    // ⚡ 2. INSTANT PEER BROADCAST (<50ms via active WebSocket)
    chatService.broadcast(optimisticMsg);

    // ⚡ 3. ASYNC DATABASE PERSISTENCE (Non-blocking)
    chatService.sendMessage({
      sender_id: this.currentUser.id,
      receiver_id: partner?.id || null,
      sender_name: this.currentUser.display_name || "Bạn",
      sender_avatar: this.currentUser.avatar_url,
      text: text,
      photo_url: photoUrl || null
    }).then(newMsg => {
      if (newMsg && newMsg.id) {
        const idx = this.messages.findIndex(m => m.id === tempId);
        if (idx !== -1) {
          this.messages[idx] = { ...newMsg, _status: 'sent' };
          this.chatView.appendOrUpdateMessage(this.messages[idx], tempId);
        }
      }
    }).catch(err => {
      console.warn("Save message error:", err);
      const idx = this.messages.findIndex(m => m.id === tempId);
      if (idx !== -1) {
        this.messages[idx]._status = 'sent';
        this.chatView.appendOrUpdateMessage(this.messages[idx], tempId);
      }
    });
  }

  handleIncomingMessage(newMsg) {
    if (!newMsg || !newMsg.id) return;

    // Deduplicate: If it's a message sent by this user matching in-flight optimistic bubble
    const existingIdx = this.messages.findIndex(m => 
      m.id === newMsg.id || 
      (m._status === 'sending' && m.sender_id === newMsg.sender_id && m.text === newMsg.text)
    );

    if (existingIdx !== -1) {
      const existing = this.messages[existingIdx];
      this.messages[existingIdx] = { ...newMsg, _status: 'sent' };
      this.chatView.appendOrUpdateMessage(this.messages[existingIdx], existing.id);
      return;
    }

    // New incoming message from partner
    this.messages.push(newMsg);
    this.chatView.appendOrUpdateMessage(newMsg);

    const isMe = newMsg.sender_id === this.currentUser?.id;
    if (!isMe) {
      soundHelper.playPop();
      const isChatActive = document.querySelector('#tab-chat')?.classList.contains('active');
      if (!isChatActive) {
        this.showToast(`💬 ${newMsg.sender_name || 'Tin nhắn mới'}: ${newMsg.text || 'Đã gửi 1 ảnh'}`);
      }
    }
  }

  async handleReaction(meal, emoji = '❤️', label = 'Yêu thích') {
    this.showToast(`${emoji} ${label}`);
    const targetMeal = meal || (this.meals && this.meals[0]);
    if (targetMeal && targetMeal.id) {
      try {
        await mealService.addReaction(
          targetMeal.id,
          this.currentUser.id,
          this.currentUser.display_name,
          emoji,
          label
        );
      } catch (e) {}
    }
    const receiverId = targetMeal?.user_id && targetMeal.user_id !== this.currentUser.id ? targetMeal.user_id : null;
    this.handleChatMessage({
      text: `${this.currentUser.display_name || 'Bạn'} đã thả ${emoji} cho ảnh món ăn!`,
      receiverId
    });
  }

  handleQuickReply(meal, text) {
    const receiverId = meal?.user_id && meal.user_id !== this.currentUser.id ? meal.user_id : null;
    this.handleChatMessage({ text: text, receiverId });
    this.showToast('Đã gửi tin nhắn! 💬');
  }

  async handleLogout(showToast = true) {
    if (this._isLoggingOut) return;
    this._isLoggingOut = true;
    try {
      await api.signOut();
      this.session = null;
      this.currentUser = null;
      this.meals = [];
      this.messages = [];
      this.connections = [];
      localStorage.removeItem('ourmam_auth');
      this.authView.show();
      if (showToast) this.showToast('Đã đăng xuất tài khoản.');
    } catch (e) {
      console.error("Logout error:", e);
      localStorage.removeItem('ourmam_auth');
      this.authView.show();
    } finally {
      this._isLoggingOut = false;
    }
  }

  async handleDeleteMeal(mealId) {
    if (!mealId) return;
    try {
      soundHelper.playPop();
      const success = await mealService.deleteMeal(mealId);
      if (success) {
        this.meals = this.meals.filter(m => m.id !== mealId);
        this.renderPartnerFeed();
        this.calendarView.setMeals(this.meals);
        this.render();
        this.showToast('Đã xoá khoảnh khắc bữa ăn 🗑️');
      } else {
        this.showToast('Không thể xoá ảnh. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error("handleDeleteMeal error:", err);
      this.showToast('Đã có lỗi xảy ra khi xoá ảnh');
    }
  }

  getDefaultCaption(tag) {
    switch (tag) {
      case 'breakfast': return "Bữa sáng ấm áp cùng nhau ☀️";
      case 'lunch': return "Trưa nay ăn ngon xỉu anh/em ơi 🍱";
      case 'dinner': return "Cơm tối no nê ấm cúng 🌙";
      case 'snack': return "Thèm trà sữa quá đi 🧋";
      default: return "Bữa cơm hôm nay ❤️";
    }
  }

  showToast(message) {
    const existing = document.getElementById('app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-stone-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-white/10 transition-all duration-300';
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  initRealtime() {
    api.subscribeToMeals(
      (newMeal) => {
        if (!this.meals.some(m => m.id === newMeal.id)) {
          this.meals.unshift(newMeal);
          this.render();
          soundHelper.playPop();
          this.showToast("🎉 Món mới từ " + (newMeal.user_name || "bạn bè"));
        }
      },
      (deletedMeal) => {
        if (deletedMeal && deletedMeal.id) {
          this.meals = this.meals.filter(m => m.id !== deletedMeal.id);
          this.render();
        }
      }
    );

    // ⚡ High-speed WebSocket Realtime Subscription
    api.subscribeToMessages((newMsg) => {
      this.handleIncomingMessage(newMsg);
    });

    // ⚡ High-speed Smart Polling Fallback (Every 2.5s on Chat tab, every 10s otherwise)
    setInterval(async () => {
      if (!this.currentUser) return;
      const isChatActive = document.querySelector('#tab-chat')?.classList.contains('active');
      this._chatPollTick = (this._chatPollTick || 0) + 1;
      if (!isChatActive && this._chatPollTick % 4 !== 0) return;

      try {
        const recents = await chatService.getRecentMessages(15);
        if (Array.isArray(recents) && recents.length > 0) {
          recents.forEach(msg => {
            const exists = this.messages.some(m => m.id === msg.id || (m._status === 'sending' && m.text === msg.text));
            if (!exists) {
              this.handleIncomingMessage(msg);
            }
          });
        }
      } catch (e) {}
    }, 2500);

    api.subscribeToConnections(async () => {
      const uid = this.currentUser?.id || this.session?.user?.id;
      if (uid) {
        this.connections = await profileService.getConnections(uid);
        this.render();
      }
    });
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      // On local development, unregister any stale SWs and clear cache to avoid serving outdated assets
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        navigator.serviceWorker.getRegistrations().then(regs => {
          for (const reg of regs) {
            reg.unregister();
            console.log('Unregistered SW on dev:', reg.scope);
          }
        });
        if ('caches' in window) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }
      } else {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('OurMam PWA Service Worker Registered:', reg.scope))
          .catch(err => console.log('SW Registration failed:', err));
      }
    }
  }
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.start();
});

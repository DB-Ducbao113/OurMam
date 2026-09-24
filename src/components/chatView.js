/**
 * ==============================================================================
 * CHAT VIEW COMPONENT (DOMESTIC REMINDERS, CONVERSATION LIST & 1-ON-1 CHAT ROOM)
 * ==============================================================================
 * Flow:
 * 1. Empty State: Shown when user has 0 connections (with Code & Connect CTA).
 * 2. Conversation List (Hộp thư): Shows list of friends/partner with last message & time.
 * 3. Chat Room: Entered ONLY when user taps/opens a conversation with another user.
 * ==============================================================================
 */

import { compressImageFile } from '../utils/imageCompressor.js';
import { getUserAvatar } from '../utils/avatarHelper.js';
import { soundHelper } from '../utils/soundHelper.js';

function formatChatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } else if (diffHours < 48 && (now.getDate() - date.getDate() === 1 || diffHours < 36)) {
    return 'Hôm qua';
  } else {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }
}

export class ChatViewComponent {
  constructor(onSendMessage, onOpenConnectModal, onOpenPhotoModal, onOpenNicknameModal, onDeleteMessage) {
    this.container = document.getElementById('tab-chat');
    this.onSendMessage = onSendMessage;
    this.onOpenConnectModal = onOpenConnectModal;
    this.onOpenPhotoModal = onOpenPhotoModal;
    this.onOpenNicknameModal = onOpenNicknameModal;
    this.onDeleteMessage = onDeleteMessage;

    this.currentView = 'list'; // 'list' | 'room'
    this.activeFriendId = null;
    this.userBackedToList = false;
    this.messages = [];
    this.connections = [];
    this.currentUser = null;
    this.currentUserId = null;

    this.initDOM();
  }

  /**
   * Reset back flag when switching to chat tab from bottom nav
   */
  onTabOpened() {
    this.userBackedToList = false;
  }

  initDOM() {
    if (!this.container) return;
    this.container.innerHTML = `
      <!-- ============================================================
           1. EMPTY STATE CONTAINER (WHEN 0 CONNECTIONS)
           ============================================================ -->
      <div id="chat-empty-container" class="hidden w-full flex-col space-y-4 pt-1">
        <div class="w-full bg-gradient-to-br from-white via-surface-container-lowest to-[#FFF5ED] rounded-3xl p-6 border border-orange-200/70 soft-tactile-shadow flex flex-col items-center text-center space-y-3.5 relative overflow-hidden">
          
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl pointer-events-none"></div>

          <div class="w-full flex items-center justify-between text-[11px] font-semibold text-tertiary z-10">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span class="font-bold text-on-surface">Phòng Trò Chuyện</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-surface-container text-primary text-[10px] font-bold">Chưa kết nối</span>
          </div>

          <div class="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-100 to-amber-50 border border-orange-200/80 flex items-center justify-center text-4xl shadow-inner my-1 z-10 transform hover:scale-105 transition-transform">
            💌
          </div>

          <div class="z-10">
            <h3 class="text-base font-extrabold text-on-surface tracking-tight">Chưa Có Bạn Bè Hoặc Người Thương</h3>
            <p class="text-xs text-tertiary mt-1.5 max-w-[320px] leading-relaxed">
              Bạn cần kết nối với người thương hoặc bạn bè trước để mở phòng trò chuyện và cùng chia sẻ khoảnh khắc ăn uống mỗi ngày! 💕
            </p>
          </div>

          <!-- User Code Card -->
          <div class="w-full bg-white/95 rounded-2xl p-3 border border-orange-200/80 flex items-center justify-between gap-2 shadow-xs z-10">
            <div class="flex flex-col text-left">
              <span class="text-[10px] text-tertiary font-semibold uppercase tracking-wider">Mã kết nối của bạn</span>
              <span id="chat-empty-user-code" class="font-mono text-sm font-black text-primary tracking-wider select-all">MAM...</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button id="btn-chat-empty-copy" type="button" class="px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-primary-fixed text-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-all border border-outline-variant/30">
                <span class="material-symbols-outlined text-sm">content_copy</span>
                <span>Copy</span>
              </button>
              <button id="btn-chat-empty-connect" type="button" class="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs">
                <span class="material-symbols-outlined text-sm">person_add</span>
                <span>Ghép đôi ngay</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- ============================================================
           2. CONVERSATIONS LIST CONTAINER (HỘP THƯ BẠN BÈ)
           ============================================================ -->
      <div id="chat-list-container" class="hidden w-full flex-col space-y-2.5 pb-4">
        
        <!-- Streamlined Header & Add Friend Action -->
        <div class="flex items-center justify-between px-1 pt-1 pb-0.5">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-extrabold text-on-surface tracking-tight">Hộp thư</h3>
            <span id="chat-list-count" class="text-[11px] font-bold text-tertiary bg-surface-container-low px-2.5 py-0.5 rounded-full border border-outline-variant/20">0 bạn bè</span>
          </div>

          <button id="btn-chat-list-add-friend" type="button" class="w-8 h-8 rounded-full bg-surface-container hover:bg-orange-100 text-primary flex items-center justify-center active:scale-90 transition-all border border-outline-variant/20 shadow-2xs cursor-pointer" title="Thêm bạn / Ghép đôi">
            <span class="material-symbols-outlined text-lg">person_add</span>
          </button>
        </div>

        <!-- Conversations Stream -->
        <div id="chat-conversations-list" class="flex flex-col space-y-2">
          <!-- Rendered dynamically -->
        </div>

      </div>

      <!-- ============================================================
           3. CHAT ROOM CONTAINER (PHÒNG TRÒ CHUYỆN 1-ON-1)
           ============================================================ -->
      <div id="chat-room-container" class="hidden w-full flex-col space-y-3 pb-2">
        
        <!-- Chat Room Top Header with Back Button -->
        <div class="bg-surface-container-lowest rounded-2xl p-2.5 border border-outline-variant/30 soft-tactile-shadow flex items-center justify-between gap-2">
          
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <!-- Back to Conversations List Button -->
            <button id="btn-chat-room-back" type="button" class="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-tertiary hover:text-primary active:scale-90 transition-all shrink-0" title="Quay lại danh sách">
              <span class="material-symbols-outlined text-lg">arrow_back</span>
            </button>

            <!-- Partner Info -->
            <div class="flex items-center gap-2 text-left min-w-0 flex-1">
              <div class="relative shrink-0">
                <img id="chat-room-partner-avatar" class="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30" src="" alt="Avatar">
                <span class="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1">
                  <h4 id="chat-room-partner-name" class="text-xs font-bold text-on-surface truncate max-w-[120px]">Người thương</h4>
                  <span id="chat-room-partner-tag" class="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-600 shrink-0">💕</span>
                </div>
                <p id="chat-room-partner-sub" class="text-[10px] text-tertiary truncate">Đang hoạt động</p>
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Removed Edit Nickname Button per user request -->

            <!-- Quick Reminder Button -->
            <button id="btn-chat-room-reminder" type="button" class="px-2.5 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-primary text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer" title="Gửi nhắc ăn cơm">
              <span>🔔</span>
              <span>Nhắc ăn</span>
            </button>
          </div>
        </div>

        <!-- Chat Room Messages Stream -->
        <div id="chat-room-messages-list" class="flex flex-col space-y-3 overflow-y-auto max-h-[54vh] min-h-[220px] p-1">
          <!-- Rendered dynamically -->
        </div>

        <!-- Chat Room Input Form -->
        <form id="form-chat-room-send" class="flex items-center space-x-2 bg-surface-container-lowest rounded-full p-2 border border-outline-variant/30 soft-tactile-shadow">
          <label class="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary cursor-pointer active:scale-95 transition-transform hover:bg-orange-100" title="Gửi ảnh món ăn">
            <input type="file" id="file-chat-room-image" accept="image/*" class="hidden">
            <span class="material-symbols-outlined text-lg">add_photo_alternate</span>
          </label>
          <input id="input-chat-room-text" class="bg-transparent border-0 focus:ring-0 focus:outline-none text-xs text-on-surface placeholder:text-tertiary/70 flex-1 py-1" placeholder="Nhắn gì đó..." type="text">
          <button type="submit" id="btn-chat-room-send" class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center active:scale-95 transition-transform shadow-sm hover:bg-orange-700">
            <span class="material-symbols-outlined text-sm">send</span>
          </button>
        </form>

      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Send Message Form inside Chat Room
    const formEl = this.container.querySelector('#form-chat-room-send');
    const inputEl = this.container.querySelector('#input-chat-room-text');
    if (formEl && inputEl) {
      formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = inputEl.value.trim();
        inputEl.value = '';
        inputEl.focus();
        this.onSendMessage({ text: text, photoUrl: null, receiverId: this.activeFriendId });
      });
    }

    // 2. Send Image Attachment inside Chat Room
    const fileImgEl = this.container.querySelector('#file-chat-room-image');
    if (fileImgEl) {
      fileImgEl.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const dataUrl = await compressImageFile(file);
        this.onSendMessage({ text: "Đã gửi 1 ảnh bữa ăn 📸", photoUrl: dataUrl, receiverId: this.activeFriendId });
        fileImgEl.value = '';
      });
    }

    // 3. Quick Meal Reminder Button inside Chat Room
    const btnReminder = this.container.querySelector('#btn-chat-room-reminder');
    if (btnReminder) {
      btnReminder.addEventListener('click', () => {
        soundHelper.playPop();
        this.onSendMessage({ 
          text: "Bạn ơi, đến giờ ăn cơm rồi nè! 🍱❤️ Nhớ ăn no nê nhé!", 
          photoUrl: null, 
          receiverId: this.activeFriendId 
        });
      });
    }

    // 3.1 Edit Nickname Button inside Chat Room
    const btnEditNick = this.container.querySelector('#btn-chat-room-edit-nickname');
    if (btnEditNick) {
      btnEditNick.addEventListener('click', () => {
        soundHelper.playPop();
        const activeConn = this.connections.find(c => c.friend?.id === this.activeFriendId) || this.connections[0];
        if (activeConn && this.onOpenNicknameModal) {
          this.onOpenNicknameModal(activeConn.friend);
        }
      });
    }

    // 4. Back Button from Chat Room to Conversations List
    const btnBack = this.container.querySelector('#btn-chat-room-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        soundHelper.playPop();
        this.userBackedToList = true;
        this.currentView = 'list';
        this.activeFriendId = null;
        this.render(this.messages, this.currentUserId, this.connections, this.currentUser);
      });
    }

    // 5. Empty State Actions
    const btnEmptyCopy = this.container.querySelector('#btn-chat-empty-copy');
    if (btnEmptyCopy) {
      btnEmptyCopy.addEventListener('click', () => {
        const code = this.currentUser?.user_code || "MAM888";
        navigator.clipboard.writeText(code);
        soundHelper.playPop();
        alert(`Đã sao chép mã ${code} vào bộ nhớ tạm!`);
      });
    }

    const btnEmptyConnect = this.container.querySelector('#btn-chat-empty-connect');
    if (btnEmptyConnect && this.onOpenConnectModal) {
      btnEmptyConnect.addEventListener('click', () => {
        this.onOpenConnectModal();
      });
    }

    // 6. Add Friend Action in Conversations List
    const btnListAddFriend = this.container.querySelector('#btn-chat-list-add-friend');
    if (btnListAddFriend && this.onOpenConnectModal) {
      btnListAddFriend.addEventListener('click', () => {
        this.onOpenConnectModal();
      });
    }
  }

  /**
   * Helper to open chat room directly with a specific user
   */
  openChatWith(friendId) {
    this.userBackedToList = false;
    this.activeFriendId = friendId;
    this.currentView = 'room';
    this.render(this.messages, this.currentUserId, this.connections, this.currentUser);
  }

  /**
   * Helper to find the latest message with a specific friend
   */
  getLastMessageWith(friendId) {
    if (!this.messages || this.messages.length === 0) return null;
    const friendMsgs = this.messages.filter(msg => {
      const isWithFriend = 
        (msg.sender_id === this.currentUserId && msg.receiver_id === friendId) ||
        (msg.sender_id === friendId && msg.receiver_id === this.currentUserId) ||
        (!msg.receiver_id && (msg.sender_id === friendId || msg.sender_id === this.currentUserId));
      return isWithFriend;
    });
    return friendMsgs.length > 0 ? friendMsgs[friendMsgs.length - 1] : null;
  }

  render(messages, currentUserId, connections = [], currentUser = null) {
    this.messages = messages || [];
    this.currentUserId = currentUserId;
    this.connections = (connections || []).filter(connection => !connection.status || connection.status === 'accepted');
    this.currentUser = currentUser;

    const emptyContainer = this.container.querySelector('#chat-empty-container');
    const listContainer = this.container.querySelector('#chat-list-container');
    const roomContainer = this.container.querySelector('#chat-room-container');

    // Case 1: No connections yet -> Show Clean Empty State Card
    if (!this.connections || this.connections.length === 0) {
      if (emptyContainer) {
        emptyContainer.classList.remove('hidden');
        emptyContainer.classList.add('flex');
        const emptyUserCodeEl = this.container.querySelector('#chat-empty-user-code');
        if (emptyUserCodeEl && this.currentUser?.user_code) {
          emptyUserCodeEl.textContent = this.currentUser.user_code;
        }
      }
      if (listContainer) {
        listContainer.classList.add('hidden');
        listContainer.classList.remove('flex');
      }
      if (roomContainer) {
        roomContainer.classList.add('hidden');
        roomContainer.classList.remove('flex');
      }
      return;
    }

    // Hide Empty Container when connections exist
    if (emptyContainer) {
      emptyContainer.classList.add('hidden');
      emptyContainer.classList.remove('flex');
    }

    // Verify if activeFriendId still exists in connections
    if (this.activeFriendId && !this.connections.some(c => c.friend?.id === this.activeFriendId)) {
      this.activeFriendId = null;
      this.currentView = 'list';
    }

    // Auto-streamline removed per user request: always show friends list by default
    // if (this.connections.length === 1 && !this.userBackedToList) {
    //   this.activeFriendId = this.connections[0].friend?.id;
    //   this.currentView = 'room';
    // }

    // Case 2: View is Chat Room (User is in a chat room with a friend)
    if (this.currentView === 'room' && this.activeFriendId) {
      if (listContainer) {
        listContainer.classList.add('hidden');
        listContainer.classList.remove('flex');
      }
      if (roomContainer) {
        roomContainer.classList.remove('hidden');
        roomContainer.classList.add('flex');
      }

      this.renderChatRoom();
      return;
    }

    // Case 3: View is Conversations List (User has multiple friends or clicked Back)
    if (listContainer) {
      listContainer.classList.remove('hidden');
      listContainer.classList.add('flex');
    }
    if (roomContainer) {
      roomContainer.classList.add('hidden');
      roomContainer.classList.remove('flex');
    }

    this.renderConversationsList();
  }

  /**
   * Render Conversations List (Hộp thư danh sách)
   */
  renderConversationsList() {
    const listCountEl = this.container.querySelector('#chat-list-count');
    const convListEl = this.container.querySelector('#chat-conversations-list');
    if (!convListEl) return;

    if (listCountEl) {
      listCountEl.textContent = `${this.connections.length} bạn bè`;
    }

    convListEl.innerHTML = '';

    this.connections.forEach(conn => {
      const friend = conn.friend || {};
      const isCouple = conn.relationship_type === 'couple';
      const realName = friend.display_name || (isCouple ? 'Người yêu' : 'Bạn bè');
      const nickname = friend.custom_nickname || friend.nickname || conn.nickname || null;
      const effectiveName = nickname || realName;
      const friendAvatar = getUserAvatar(friend.avatar_url, realName);
      const lastMsg = this.getLastMessageWith(friend.id);

      let previewText = 'Chạm để bắt đầu trò chuyện & nhắc cơm ✨';
      let timeText = 'Mới';
      let isLastMsgMine = false;

      if (lastMsg) {
        isLastMsgMine = lastMsg.sender_id === this.currentUserId || lastMsg.user_id === this.currentUserId;
        timeText = formatChatTime(lastMsg.created_at);
        if (lastMsg.photo_url) {
          previewText = isLastMsgMine ? 'Bạn: 📸 Đã gửi 1 ảnh bữa ăn' : '📸 Đã gửi 1 ảnh bữa ăn';
        } else if (lastMsg.text) {
          previewText = isLastMsgMine ? `Bạn: ${lastMsg.text}` : lastMsg.text;
        }
      }

      const card = document.createElement('div');
      card.className = 'w-full bg-surface-container-lowest rounded-2xl p-3.5 border border-outline-variant/30 soft-tactile-shadow flex items-center justify-between gap-3 cursor-pointer hover:border-primary/50 hover:bg-[#FFFDFB] active:scale-[0.99] transition-all group';
      card.dataset.friendId = friend.id;

      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <div class="relative flex-shrink-0">
            <img class="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary transition-all" src="${friendAvatar}" alt="${realName}">
            <span class="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </div>

          <div class="flex flex-col min-w-0 flex-1 text-left">
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <div class="flex items-center gap-1.5 min-w-0">
                <h4 class="text-xs font-bold text-on-surface truncate">${effectiveName}</h4>
                ${nickname ? `<span class="text-[10px] text-stone-400 font-normal truncate">(${realName})</span>` : ''}
                <span class="text-[9px] px-1.5 py-0.2 rounded-full font-bold flex-shrink-0 ${isCouple ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}">
                  ${isCouple ? '💕 Người yêu' : '🥑 Bạn bè'}
                </span>
              </div>
              <span class="text-[10px] text-tertiary flex-shrink-0 font-medium">${timeText}</span>
            </div>

            <p class="text-xs ${lastMsg ? 'text-tertiary' : 'text-primary/80 italic'} truncate leading-snug">
              ${previewText}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-surface-container-low group-hover:bg-primary-fixed text-tertiary group-hover:text-primary transition-colors flex-shrink-0">
          <span class="material-symbols-outlined text-base">chevron_right</span>
        </div>
      `;

      card.addEventListener('click', () => {
        soundHelper.playPop();
        this.userBackedToList = false;
        this.activeFriendId = friend.id;
        this.currentView = 'room';
        this.render(this.messages, this.currentUserId, this.connections, this.currentUser);
      });

      convListEl.appendChild(card);
    });
  }

  /**
   * Render Chat Room (Màn hình trò chuyện chi tiết 1-on-1)
   */
  renderChatRoom() {
    const activeConn = this.connections.find(c => c.friend?.id === this.activeFriendId) || this.connections[0];
    if (!activeConn) {
      this.currentView = 'list';
      this.render(this.messages, this.currentUserId, this.connections, this.currentUser);
      return;
    }

    const partner = activeConn.friend || {};
    const isCouple = activeConn.relationship_type === 'couple';
    const realName = partner.display_name || (isCouple ? 'Người yêu' : 'Bạn bè');
    const nickname = partner.custom_nickname || partner.nickname || activeConn.nickname || null;
    const effectiveName = nickname || realName;
    const partnerName = effectiveName;
    const partnerAvatar = getUserAvatar(partner.avatar_url, realName);

    // Update Room Header
    const avatarEl = this.container.querySelector('#chat-room-partner-avatar');
    const nameEl = this.container.querySelector('#chat-room-partner-name');
    const subEl = this.container.querySelector('#chat-room-partner-sub');
    const tagEl = this.container.querySelector('#chat-room-partner-tag');
    const inputEl = this.container.querySelector('#input-chat-room-text');

    if (avatarEl) avatarEl.src = partnerAvatar;
    if (nameEl) nameEl.textContent = effectiveName;
    if (subEl) {
      if (nickname) {
        subEl.innerHTML = `<span class="text-stone-500 font-medium">(${realName})</span> • <span class="text-emerald-600 font-semibold">Online</span>`;
      } else {
        subEl.innerHTML = `<span class="text-emerald-600 font-semibold">Đang hoạt động</span>`;
      }
    }
    if (tagEl) {
      tagEl.textContent = isCouple ? '💕 Người yêu' : '🥑 Bạn bè';
      tagEl.className = `text-[9px] px-1.5 py-0.2 rounded-full font-bold ${isCouple ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`;
    }
    if (inputEl) {
      inputEl.placeholder = `Nhắn gì đó cho ${effectiveName}...`;
    }

    // Filter Messages between current user and this partner
    const messagesListEl = this.container.querySelector('#chat-room-messages-list');
    if (!messagesListEl) return;
    messagesListEl.innerHTML = '';

    const activeMessages = this.messages.filter(msg => {
      if (!msg.receiver_id && !msg.sender_id) return true;
      return (msg.sender_id === this.currentUserId && msg.receiver_id === partner.id) ||
             (msg.sender_id === partner.id && msg.receiver_id === this.currentUserId) ||
             (!msg.receiver_id);
    });

    if (activeMessages.length === 0) {
      messagesListEl.innerHTML = `
        <div class="w-full bg-surface-container-lowest/80 rounded-2xl p-5 border border-dashed border-outline-variant/40 text-center my-4">
          <span class="text-3xl">💌</span>
          <h4 class="text-xs font-bold text-on-surface mt-1.5">Trò chuyện cùng ${partnerName}</h4>
          <p class="text-[11px] text-tertiary mt-1">Chưa có tin nhắn nào. Hãy gửi lời nhắn đầu tiên hoặc bấm <b>"🔔 Nhắc ăn"</b> nhé! 💕</p>
        </div>
      `;
    } else {
      activeMessages.forEach(msg => {
        const msgEl = this.createMessageElement(msg, partnerName);
        messagesListEl.appendChild(msgEl);
      });
    }

    messagesListEl.scrollTop = messagesListEl.scrollHeight;
  }

  /**
   * Helper to create a single message DOM element
   */
  createMessageElement(msg, partnerName) {
    const isMe = (msg.sender_id && msg.sender_id === this.currentUserId) || (msg.user_id && msg.user_id === this.currentUserId);
    const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong';
    const name = msg.sender_name || msg.user_name || (isMe ? 'Bạn' : (partnerName || 'Đối phương'));
    const avatarUrl = getUserAvatar(msg.sender_avatar || msg.user_avatar, name);
    const isSending = msg._status === 'sending';

    const msgEl = document.createElement('div');
    msgEl.dataset.msgId = msg.id;
    msgEl.className = `flex items-start gap-2 max-w-[88%] transition-all animate-fade-in ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`;

    msgEl.innerHTML = `
      <img class="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1 border border-primary-fixed ring-1 ring-orange-200" src="${avatarUrl}" alt="${name}">
      <div class="space-y-1">
        <div class="bg-surface-container-lowest rounded-2xl ${isMe ? 'rounded-tr-sm bg-primary-fixed/30 border-orange-200' : 'rounded-tl-sm border-outline-variant/30'} p-2.5 border soft-tactile-shadow">
          ${msg.photo_url ? `
            <div class="relative rounded-xl overflow-hidden mb-2 border border-[rgba(44,36,32,0.06)] cursor-pointer group">
              <img class="w-full h-44 object-cover rounded-xl group-hover:scale-105 transition-transform" src="${msg.photo_url}" alt="Meal moment">
            </div>
          ` : ''}
          <p class="text-xs text-on-surface leading-snug px-1 font-medium select-text">${msg.text}</p>
          <div class="flex items-center justify-end gap-1 mt-1 pr-1 text-[10px] text-tertiary">
            <span>${timeStr}</span>
            ${isMe ? `
              <span class="chat-status-icon material-symbols-outlined text-[12px] ${isSending ? 'text-stone-400' : 'text-primary filled'}">
                ${isSending ? 'schedule' : 'done_all'}
              </span>
            ` : ''}
          </div>
        </div>
        ${isMe && !isSending && !String(msg.id || '').startsWith('temp-') ? `
          <button type="button" data-delete-message="${msg.id}" class="ml-1 px-1.5 py-0.5 text-[10px] text-stone-400 hover:text-rose-600" aria-label="Xóa tin nhắn của bạn">Xóa tin nhắn</button>
        ` : ''}
      </div>
    `;

    if (msg.photo_url && this.onOpenPhotoModal) {
      const imgWrap = msgEl.querySelector('img.object-cover');
      if (imgWrap) {
        imgWrap.addEventListener('click', () => {
          this.onOpenPhotoModal({
            photo_url: msg.photo_url,
            user_name: name,
            user_avatar: avatarUrl,
            dish_name: msg.text,
            created_at: msg.created_at,
            meal_type: 'snack'
          });
        });
      }
    }

    const deleteButton = msgEl.querySelector('[data-delete-message]');
    if (deleteButton) {
      deleteButton.addEventListener('click', async () => {
        if (!window.confirm('Xóa tin nhắn này cho cả hai người?')) return;
        deleteButton.disabled = true;
        deleteButton.textContent = 'Đang xóa…';
        const deleted = await this.onDeleteMessage?.(msg.id);
        if (!deleted) {
          deleteButton.disabled = false;
          deleteButton.textContent = 'Xóa tin nhắn';
        }
      });
    }

    return msgEl;
  }

  /**
   * Append a new message or update status of existing message with zero flicker
   */
  appendOrUpdateMessage(msg, replaceId = null) {
    if (!msg) return;

    // 1. Maintain local messages cache
    const existingIdx = this.messages.findIndex(m => m.id === (replaceId || msg.id));
    if (existingIdx !== -1) {
      this.messages[existingIdx] = { ...this.messages[existingIdx], ...msg };
    } else {
      this.messages.push(msg);
    }

    // 2. If user is currently in chat room
    if (this.currentView === 'room' && this.activeFriendId) {
      const activeConn = this.connections.find(c => c.friend?.id === this.activeFriendId);
      const partner = activeConn?.friend || {};
      const partnerName = partner.display_name || 'Đối phương';

      const isForThisRoom = 
        (!msg.receiver_id && !msg.sender_id) ||
        (msg.sender_id === this.currentUserId && (!msg.receiver_id || msg.receiver_id === partner.id)) ||
        (msg.sender_id === partner.id && (!msg.receiver_id || msg.receiver_id === this.currentUserId));

      if (isForThisRoom) {
        const messagesListEl = this.container.querySelector('#chat-room-messages-list');
        if (messagesListEl) {
          // Check if replacing an existing optimistic bubble
          const targetId = replaceId || msg.id;
          const existingEl = messagesListEl.querySelector(`[data-msg-id="${targetId}"]`);
          
          if (existingEl) {
            existingEl.dataset.msgId = msg.id;
            const statusIcon = existingEl.querySelector('.chat-status-icon');
            if (statusIcon) {
              const isSending = msg._status === 'sending';
              statusIcon.className = `chat-status-icon material-symbols-outlined text-[12px] ${isSending ? 'text-stone-400' : 'text-primary filled'}`;
              statusIcon.textContent = isSending ? 'schedule' : 'done_all';
            }
          } else {
            // Remove empty state placeholder if present
            const placeholder = messagesListEl.querySelector('.border-dashed');
            if (placeholder) placeholder.remove();

            // Append new message bubble
            const newEl = this.createMessageElement(msg, partnerName);
            messagesListEl.appendChild(newEl);

            // Auto-scroll to bottom smoothly
            messagesListEl.scrollTop = messagesListEl.scrollHeight;
          }
        }
      }
    }

    // 3. Update Conversation list snippet
    this.updateConversationCardPreview(msg);
  }

  /**
   * Update the preview text in conversation list
   */
  updateConversationCardPreview(msg) {
    const friendId = msg.sender_id === this.currentUserId ? msg.receiver_id : msg.sender_id;
    if (!friendId) return;

    const convListEl = this.container.querySelector('#chat-conversations-list');
    if (!convListEl) return;

    const card = convListEl.querySelector(`[data-friend-id="${friendId}"]`);
    if (card) {
      const isMe = msg.sender_id === this.currentUserId;
      let previewText = msg.photo_url ? (isMe ? 'Bạn: 📸 Đã gửi 1 ảnh bữa ăn' : '📸 Đã gửi 1 ảnh bữa ăn') : (isMe ? `Bạn: ${msg.text}` : msg.text);
      const previewP = card.querySelector('p');
      if (previewP) {
        previewP.className = 'text-xs text-stone-700 font-medium truncate leading-snug';
        previewP.textContent = previewText;
      }
      const timeSpan = card.querySelector('span.text-\\[10px\\]');
      if (timeSpan && msg.created_at) {
        timeSpan.textContent = formatChatTime(msg.created_at);
      }
    }
  }
}

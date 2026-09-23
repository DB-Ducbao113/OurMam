/**
 * ==============================================================================
 * LOCKET FEED COMPONENT
 * Real Locket-style vertical feed below camera with Person Filter (All / Partner / Me),
 * authentic photo display (no fake stars, no fake calories, no fabricated banners),
 * and clean heart & quick reply interactions.
 * ==============================================================================
 */

import { formatMealTime } from '../utils/dateHelper.js';
import { soundHelper } from '../utils/soundHelper.js';
import { getUserAvatar } from '../utils/avatarHelper.js';

export class LocketFeedComponent {
  constructor(onSelectMeal, onSendReaction, onQuickReply, onFocusCamera, onOpenConnect, onDeleteMealRequest, onOpenHistory) {
    this.cardsContainer = document.getElementById('locket-feed-cards');
    this.emptyStateEl = document.getElementById('locket-feed-empty');
    this.emptyTitleEl = document.getElementById('locket-empty-title');
    this.emptyDescEl = document.getElementById('locket-empty-desc');
    this.btnEmptyAction = document.getElementById('btn-feed-empty-action');
    this.titleEl = document.getElementById('locket-feed-title');
    this.historyFooterEl = document.getElementById('locket-feed-history-footer');
    this.btnViewAllHistory = document.getElementById('btn-feed-view-all-history');
    this.historyCountDescEl = document.getElementById('feed-history-count-desc');

    this.filterBtns = document.querySelectorAll('.feed-filter-btn');
    this.filterPartnerBtn = document.getElementById('filter-btn-partner');
    this.filterPartnerLabel = document.getElementById('filter-partner-label');

    this.onSelectMeal = onSelectMeal;
    this.onSendReaction = onSendReaction;
    this.onQuickReply = onQuickReply;
    this.onFocusCamera = onFocusCamera;
    this.onOpenConnect = onOpenConnect;
    this.onDeleteMealRequest = onDeleteMealRequest;
    this.onOpenHistory = onOpenHistory;

    this.meals = [];
    this.partner = null;
    this.currentUser = null;
    this.currentFilter = 'all'; // 'all' | 'partner' | 'me'

    this.bindEvents();
  }

  bindEvents() {
    // 1. Filter buttons click
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        if (!filter) return;
        soundHelper.playPop();
        this.setFilter(filter);
      });
    });

    // 2. Empty state snap meal button
    if (this.btnEmptyAction) {
      this.btnEmptyAction.addEventListener('click', () => {
        soundHelper.playPop();
        if (this.onFocusCamera) {
          this.onFocusCamera();
        }
      });
    }

    // 3. View all history button
    if (this.btnViewAllHistory) {
      this.btnViewAllHistory.addEventListener('click', () => {
        soundHelper.playPop();
        if (this.onOpenHistory) {
          this.onOpenHistory();
        }
      });
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;

    // Update filter buttons styling
    this.filterBtns.forEach(btn => {
      const isCurrent = btn.dataset.filter === filter;
      if (isCurrent) {
        btn.className = 'feed-filter-btn active px-3 py-1 rounded-full text-[11px] font-bold bg-white text-primary shadow-xs transition-all flex items-center gap-1';
      } else {
        btn.className = 'feed-filter-btn px-3 py-1 rounded-full text-[11px] font-semibold text-tertiary hover:text-on-surface transition-all flex items-center gap-1';
      }
    });

    this.renderFilteredCards();
  }

  render(meals = [], partner = null, currentUser = null) {
    this.meals = Array.isArray(meals) ? [...meals] : [];
    this.partner = partner;
    this.currentUser = currentUser;

    // Update partner button label
    if (this.filterPartnerLabel) {
      if (partner) {
        const icon = partner.relationship_type === 'couple' ? '💕' : '🥑';
        const name = partner.display_name || 'Người ấy';
        this.filterPartnerLabel.textContent = `${icon} ${name}`;
      } else {
        this.filterPartnerLabel.textContent = 'Người ấy';
      }
    }

    this.renderFilteredCards();
  }

  renderFilteredCards() {
    if (!this.cardsContainer) return;

    const todayStr = new Date().toDateString();

    // Filter meals according to current filter
    let pool = [];
    if (this.currentFilter === 'all') {
      pool = this.meals;
    } else if (this.currentFilter === 'partner') {
      if (this.partner) {
        pool = this.meals.filter(m => 
          m.user_id === this.partner.id || 
          (m.user_id && this.currentUser && m.user_id !== this.currentUser.id)
        );
      } else {
        pool = [];
      }
    } else if (this.currentFilter === 'me') {
      if (this.currentUser) {
        pool = this.meals.filter(m => m.user_id === this.currentUser.id);
      } else {
        pool = [];
      }
    }

    // Sort by created_at descending (latest first)
    pool.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // 1. Filter meals created today
    const todayMeals = pool.filter(m => {
      if (!m.created_at) return false;
      return new Date(m.created_at).toDateString() === todayStr;
    });

    let displayMeals = [];
    let isLatestFallback = false;

    if (todayMeals.length > 0) {
      // Keep the home feed as a short preview; the calendar is the full archive.
      displayMeals = todayMeals.slice(0, 2);
    } else if (pool.length > 0) {
      // Fallback: show the single most recent meal
      displayMeals = [pool[0]];
      isLatestFallback = true;
    }

    // CASE 1: EMPTY LIST (No meals at all for this filter)
    if (!displayMeals || displayMeals.length === 0) {
      this.cardsContainer.innerHTML = '';
      this.cardsContainer.classList.add('hidden');
      if (this.historyFooterEl) this.historyFooterEl.classList.add('hidden');

      if (this.titleEl) {
        this.titleEl.textContent = 'Khoảnh khắc hôm nay';
      }

      if (this.emptyStateEl) {
        this.emptyStateEl.classList.remove('hidden');
        this.emptyStateEl.classList.add('flex');

        if (this.currentFilter === 'partner') {
          const pName = this.partner?.display_name || 'Người ấy';
          if (this.emptyTitleEl) this.emptyTitleEl.textContent = `Chưa có ảnh từ ${pName}`;
          if (this.emptyDescEl) {
            this.emptyDescEl.textContent = this.partner
              ? `${pName} chưa gửi ảnh bữa ăn nào hôm nay. Hãy gửi một món ngon để mời ${pName} cùng chia sẻ nhé!`
              : 'Bạn chưa kết nối với ai. Hãy chia sẻ mã của bạn để bắt đầu!';
          }
        } else if (this.currentFilter === 'me') {
          if (this.emptyTitleEl) this.emptyTitleEl.textContent = 'Bạn chưa có ảnh nào hôm nay';
          if (this.emptyDescEl) this.emptyDescEl.textContent = 'Hãy dùng khung camera phía trên để chụp và chia sẻ món ăn của bạn!';
        } else {
          if (this.emptyTitleEl) this.emptyTitleEl.textContent = 'Chưa có khoảnh khắc nào hôm nay';
          if (this.emptyDescEl) this.emptyDescEl.textContent = 'Hãy chụp đĩa ăn đầu tiên của bạn ở camera phía trên để gửi lên Locket!';
        }
      }
      return;
    }

    // CASE 2: HAS MEALS TO DISPLAY
    if (this.emptyStateEl) {
      this.emptyStateEl.classList.add('hidden');
      this.emptyStateEl.classList.remove('flex');
    }
    this.cardsContainer.classList.remove('hidden');

    // Update section title dynamically
    if (this.titleEl) {
      if (!isLatestFallback) {
        this.titleEl.innerHTML = `Khoảnh khắc hôm nay <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed text-primary">${displayMeals.length} món</span>`;
      } else {
        this.titleEl.innerHTML = `Khoảnh khắc mới nhất <span class="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-tertiary">Gần nhất</span>`;
      }
    }

    this.cardsContainer.innerHTML = '';

    displayMeals.forEach((meal, idx) => {
      const cardEl = this.createMealCard(meal, idx, isLatestFallback);
      this.cardsContainer.appendChild(cardEl);
    });

    // Update History Footer Link
    if (this.historyFooterEl) {
      if (pool.length > displayMeals.length) {
        this.historyFooterEl.classList.remove('hidden');
        if (this.historyCountDescEl) {
          const remainingCount = pool.length - displayMeals.length;
          this.historyCountDescEl.textContent = `Còn ${remainingCount} khoảnh khắc trong Lịch sử`;
        }
      } else {
        this.historyFooterEl.classList.add('hidden');
      }
    }
  }

  createMealCard(meal, idx, isLatestFallback = false) {
    const card = document.createElement('article');
    card.className = 'relative w-full bg-surface-container-lowest rounded-3xl p-3.5 border border-outline-variant/30 shadow-xs flex flex-col space-y-3 transition-all';
    card.dataset.mealId = meal.id || idx;

    const isMe = this.currentUser && meal.user_id === this.currentUser.id;
    const isPartner = this.partner && meal.user_id === this.partner.id;

    // Display Name
    let authorName = meal.user_name || 'Bạn bè';
    if (isMe) {
      authorName = `${this.currentUser.display_name || 'Bạn'}`;
    } else if (isPartner) {
      authorName = this.partner.display_name || meal.user_name;
    }

    // Relationship badge
    let relBadgeHtml = '';
    if (isMe) {
      relBadgeHtml = `<span class="px-2 py-0.5 rounded-full bg-orange-100/70 text-primary text-[10px] font-bold">Tôi</span>`;
    } else if (isPartner) {
      const isCouple = this.partner.relationship_type === 'couple';
      relBadgeHtml = isCouple
        ? `<span class="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">💕 Người yêu</span>`
        : `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">🥑 Bạn bè</span>`;
    }

      // Date tag for the latest items
      let freshnessBadge = '';
      if (idx === 0) {
        const dateObj = new Date(meal.created_at);
        const dayStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        freshnessBadge = `<span class="px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200 text-[10px] font-bold">${dayStr}</span>`;
      }

    // Calories formatting: NO FAKE CALCULATIONS!
    // If not provided or previously auto-generated with '~', show '-- kcal'
    const hasRealCalories = meal.calories && !meal.calories.startsWith('~') && meal.calories.trim() !== '';
    const kcalDisplay = hasRealCalories ? meal.calories : '-- kcal';

    // Time & Location
    const timeDisplay = formatMealTime(meal.created_at, meal.meal_type);
    const locationDisplay = meal.location ? `<span class="text-tertiary">• ${meal.location}</span>` : '';

    // Caption
    const cleanCaption = meal.caption 
      ? meal.caption.replace(/[“”"]/g, '') 
      : (meal.dish_name || 'Món ngon hôm nay');

    const avatarUrl = getUserAvatar(meal.user_avatar, authorName);

    // Render Reactions (Floating emojis Locket-style)
    const reactions = meal.reactions || [];
    let reactionsHtml = '';
    if (reactions.length > 0) {
      // Show up to 4 most recent reactions
      const recentReactions = reactions.slice(-4);
      reactionsHtml = `
        <div class="absolute bottom-12 right-2.5 flex flex-col gap-1.5 items-end z-10 pointer-events-none">
          ${recentReactions.map((r, i) => `
            <div class="px-2 py-1 bg-black/30 backdrop-blur-md rounded-full shadow-sm border border-white/20 flex items-center justify-center animate-fade-in" style="animation-delay: ${i * 0.1}s">
              <span class="text-base drop-shadow-md">${r.emoji || '❤️'}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <!-- Card Header: Author Info & Calories -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2.5">
          <img class="w-9 h-9 rounded-full object-cover ring-2 ring-orange-100" src="${avatarUrl}" alt="${authorName}" loading="lazy">
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-bold text-on-surface">${authorName}</span>
              ${relBadgeHtml}
              ${freshnessBadge}
            </div>
            <div class="flex items-center gap-1 text-[11px] text-tertiary">
              <span>${timeDisplay}</span>
              ${locationDisplay}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <!-- Calories Pill: Real or -- kcal -->
          <div class="px-2.5 py-0.5 rounded-full bg-surface-container-low text-tertiary text-[11px] font-medium border border-outline-variant/30 flex items-center gap-1">
            <span>${kcalDisplay}</span>
          </div>

          <!-- Options / Share Button -->
          ${!meal.isUploading ? `
          <div class="relative btn-card-options-container">
            <button type="button" class="btn-card-options inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container-high text-tertiary border border-outline-variant/30 text-[11px] font-bold active:scale-95 transition-all cursor-pointer shadow-2xs" title="Tùy chọn">
              <span class="material-symbols-outlined text-[15px]">more_horiz</span>
            </button>
            
            <!-- Dropdown Menu -->
            <div class="dropdown-menu hidden absolute right-0 top-full mt-1.5 w-32 bg-white rounded-2xl shadow-lg border border-outline-variant/30 py-1.5 z-50 flex flex-col origin-top-right animate-fade-in">
              <button type="button" class="btn-card-save-meal flex items-center gap-2 px-3.5 py-2 w-full hover:bg-stone-50 text-stone-700 text-xs font-semibold text-left transition-colors">
                <span class="material-symbols-outlined text-[17px]">download</span>
                Lưu ảnh
              </button>
              ${isMe ? `
              <div class="w-full h-[1px] bg-outline-variant/30 my-0.5"></div>
              <button type="button" class="btn-card-delete-meal flex items-center gap-2 px-3.5 py-2 w-full hover:bg-rose-50 text-rose-600 text-xs font-semibold text-left transition-colors">
                <span class="material-symbols-outlined text-[17px]">delete</span>
                Xoá ảnh
              </button>
              ` : ''}
            </div>
          </div>
          ` : ''}
        </div>
      </div>



      <!-- Photo Display (Click to expand) -->
      <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center ${!meal.isUploading ? 'cursor-pointer group' : ''} shadow-inner">
        <img class="w-full h-full object-cover ${!meal.isUploading ? 'group-hover:scale-[1.02]' : ''} transition-transform duration-300 ${meal.isUploading ? 'opacity-80 scale-[1.05] blur-sm' : ''}" src="${meal.photo_url}" alt="${cleanCaption}" loading="lazy">
        
        ${meal.isUploading ? `
        <!-- Loading Overlay -->
        <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-20">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-white/20 border-t-white mb-2"></div>
          <span class="text-white text-xs font-medium">Đang tải lên...</span>
        </div>
        ` : `
        <!-- Quick Detail Overlay Button on Photo -->
        <button type="button" class="btn-card-photo-detail absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold backdrop-blur-md flex items-center gap-1 active:scale-90 transition-all shadow-md cursor-pointer" title="Xem chi tiết">
          <span class="material-symbols-outlined text-xs">info</span>
          <span>Chi tiết</span>
        </button>
        `}

        ${reactionsHtml}

        <!-- Clean Bottom Caption Overlay -->
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 flex items-end">
          <p class="text-white text-xs font-medium drop-shadow-sm line-clamp-2">
            “${cleanCaption}”
          </p>
        </div>
      </div>

      <!-- Card Action Footer: Quick Heart Reaction & Reply -->
      ${meal.isUploading ? '' : 
      (!isMe ? `
      <div class="flex items-center gap-2 pt-0.5">
        <!-- Quick Heart Reaction Button -->
        <div class="relative">
          <button type="button" class="btn-card-reactions p-2 rounded-full bg-surface-container-low hover:bg-rose-50 text-rose-500 active:scale-90 transition-all flex items-center justify-center border border-outline-variant/30" title="Thả cảm xúc cho ảnh này" aria-label="Thả cảm xúc">
            <span class="material-symbols-outlined text-xl">add_reaction</span>
          </button>
          <div class="reaction-picker hidden absolute bottom-full left-0 z-20 mb-2 p-2 rounded-2xl bg-white border border-outline-variant/40 shadow-lg flex gap-1" role="group" aria-label="Chọn cảm xúc">
            ${[
              ['❤️', 'Yêu thích'], ['😍', 'Đáng yêu'], ['😂', 'Vui quá'],
              ['🥰', 'Thương quá'], ['😋', 'Ngon quá'], ['👏', 'Tuyệt vời']
            ].map(([emoji, label]) => `<button type="button" class="btn-pick-reaction w-9 h-9 rounded-xl hover:bg-orange-50 text-xl active:scale-90" data-emoji="${emoji}" data-label="${label}" aria-label="${label}">${emoji}</button>`).join('')}
          </div>
        </div>

        <!-- Quick Reply Form -->
        <form class="form-card-reply flex-1 flex items-center gap-1.5 bg-surface-container-low rounded-full px-3 py-1.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-white transition-all">
          <input type="text" class="input-card-reply bg-transparent border-0 focus:ring-0 focus:outline-none text-xs text-on-surface placeholder:text-tertiary/60 w-full" placeholder="Gửi tin nhắn cho ${authorName.split(' ')[0]}..." autocomplete="off">
          <button type="submit" class="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform hover:bg-orange-700 shadow-2xs flex-shrink-0" title="Gửi">
            <span class="material-symbols-outlined text-xs">arrow_upward</span>
          </button>
        </form>
      </div>
      ` : `
      <div class="flex items-center justify-center pt-2 pb-1">
        <p class="text-[10px] text-stone-400 font-medium">Chỉ người ấy mới có thể thả tim và bình luận ảnh của bạn</p>
      </div>
      `)}
    `;

    // Bind Options Dropdown
    const optionsBtn = card.querySelector('.btn-card-options');
    const dropdown = card.querySelector('.dropdown-menu');
    
    if (optionsBtn && dropdown) {
      optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other open dropdowns first
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
          if (menu !== dropdown) menu.classList.add('hidden');
        });
        dropdown.classList.toggle('hidden');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!optionsBtn.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.add('hidden');
        }
      });
    }

    // Bind Save Image Button
    const saveBtn = card.querySelector('.btn-card-save-meal');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.add('hidden');
        fetch(meal.photo_url)
          .then(res => res.blob())
          .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `OurMam_${meal.dish_name || 'Photo'}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          })
          .catch(err => console.error("Download failed", err));
      });
    }

    // Bind Delete Buttons Click -> Open delete confirmation modal
    const deleteBtns = card.querySelectorAll('.btn-card-delete-meal');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown?.classList.add('hidden');
        if (this.onDeleteMealRequest) {
          this.onDeleteMealRequest(meal);
        } else if (this.onSelectMeal) {
          this.onSelectMeal(meal);
        }
      });
    });

    // Bind Photo Click -> Open Full View
    if (!meal.isUploading) {
      const photoEl = card.querySelector('img');
      const detailBtn = card.querySelector('.btn-card-photo-detail');
      
      const openDetail = () => {
        if (this.onSelectMeal) this.onSelectMeal(meal);
      };

      if (photoEl) {
        photoEl.addEventListener('click', openDetail);
      }
      if (detailBtn) {
        detailBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openDetail();
        });
      }
    }

    // Open the reaction picker, then send the selected reaction.
    const reactionBtn = card.querySelector('.btn-card-reactions');
    const reactionPicker = card.querySelector('.reaction-picker');
    if (reactionBtn && reactionPicker) {
      reactionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        reactionPicker.classList.toggle('hidden');
      });
      reactionPicker.querySelectorAll('.btn-pick-reaction').forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          soundHelper.playPop();
          reactionPicker.classList.add('hidden');
          this.onSendReaction?.(meal, button.dataset.emoji, button.dataset.label);
        });
      });
    }

    // Bind Quick Reply Form
    const replyForm = card.querySelector('.form-card-reply');
    const replyInput = card.querySelector('.input-card-reply');
    if (replyForm && replyInput) {
      replyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = replyInput.value.trim();
        if (!text) return;
        soundHelper.playPop();
        if (this.onQuickReply) {
          this.onQuickReply(meal, text);
        }
        replyInput.value = '';
      });
    }

    return card;
  }
}

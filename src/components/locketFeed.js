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
  constructor(onSelectMeal, onSendReaction, onQuickReply, onFocusCamera, onOpenConnect, onDeleteMealRequest) {
    this.cardsContainer = document.getElementById('locket-feed-cards');
    this.emptyStateEl = document.getElementById('locket-feed-empty');
    this.emptyTitleEl = document.getElementById('locket-empty-title');
    this.emptyDescEl = document.getElementById('locket-empty-desc');
    this.btnEmptyAction = document.getElementById('btn-feed-empty-action');

    this.filterBtns = document.querySelectorAll('.feed-filter-btn');
    this.filterPartnerBtn = document.getElementById('filter-btn-partner');
    this.filterPartnerLabel = document.getElementById('filter-partner-label');

    this.onSelectMeal = onSelectMeal;
    this.onSendReaction = onSendReaction;
    this.onQuickReply = onQuickReply;
    this.onFocusCamera = onFocusCamera;
    this.onOpenConnect = onOpenConnect;
    this.onDeleteMealRequest = onDeleteMealRequest;

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

    // Filter meals according to current filter
    let filtered = [];
    if (this.currentFilter === 'all') {
      filtered = this.meals;
    } else if (this.currentFilter === 'partner') {
      if (this.partner) {
        filtered = this.meals.filter(m => 
          m.user_id === this.partner.id || 
          (m.user_id && this.currentUser && m.user_id !== this.currentUser.id)
        );
      } else {
        filtered = [];
      }
    } else if (this.currentFilter === 'me') {
      if (this.currentUser) {
        filtered = this.meals.filter(m => m.user_id === this.currentUser.id);
      } else {
        filtered = [];
      }
    }

    // CASE 1: EMPTY LIST
    if (!filtered || filtered.length === 0) {
      this.cardsContainer.innerHTML = '';
      this.cardsContainer.classList.add('hidden');
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
          if (this.emptyTitleEl) this.emptyTitleEl.textContent = 'Bạn chưa có ảnh nào';
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

    this.cardsContainer.innerHTML = '';

    filtered.forEach((meal, idx) => {
      const cardEl = this.createMealCard(meal, idx);
      this.cardsContainer.appendChild(cardEl);
    });
  }

  createMealCard(meal, idx) {
    const card = document.createElement('article');
    card.className = 'w-full bg-surface-container-lowest rounded-3xl p-3.5 border border-outline-variant/30 shadow-xs flex flex-col space-y-3 transition-all';
    card.dataset.mealId = meal.id || idx;

    const isMe = this.currentUser && meal.user_id === this.currentUser.id;
    const isPartner = this.partner && meal.user_id === this.partner.id;

    // Display Name
    let authorName = meal.user_name || 'Bạn bè';
    if (isMe) {
      authorName = `${this.currentUser.display_name || 'Bạn'} (Tôi)`;
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

    card.innerHTML = `
      <!-- Card Header: Author Info & Calories -->
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-2.5">
          <img class="w-9 h-9 rounded-full object-cover ring-2 ring-orange-100" src="${avatarUrl}" alt="${authorName}" loading="lazy">
          <div class="flex flex-col">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-on-surface">${authorName}</span>
              ${relBadgeHtml}
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

          <!-- Prominent Delete Button -->
          <button type="button" class="btn-card-delete-meal inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 text-[11px] font-bold active:scale-95 transition-all cursor-pointer shadow-2xs" title="Xoá bài viết này">
            <span class="material-symbols-outlined text-[13px]">delete</span>
            <span>Xoá</span>
          </button>
        </div>
      </div>

      <!-- Photo Display (Click to expand) -->
      <div class="relative w-full aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center cursor-pointer group shadow-inner">
        <img class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" src="${meal.photo_url}" alt="${cleanCaption}" loading="lazy">
        
        <!-- Quick Delete Overlay Button on Photo -->
        <button type="button" class="btn-card-photo-delete absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full bg-black/60 hover:bg-rose-600 text-white text-[10px] font-bold backdrop-blur-md flex items-center gap-1 active:scale-90 transition-all shadow-md cursor-pointer" title="Xoá ảnh này">
          <span class="material-symbols-outlined text-xs">delete</span>
          <span>Xoá ảnh</span>
        </button>

        <!-- Clean Bottom Caption Overlay -->
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 flex items-end">
          <p class="text-white text-xs font-medium drop-shadow-sm line-clamp-2">
            “${cleanCaption}”
          </p>
        </div>
      </div>

      <!-- Card Action Footer: Quick Heart Reaction & Reply -->
      <div class="flex items-center gap-2 pt-0.5">
        <!-- Quick Heart Reaction Button -->
        <button type="button" class="btn-card-heart p-2 rounded-full bg-surface-container-low hover:bg-rose-50 text-rose-500 active:scale-90 transition-all flex items-center justify-center border border-outline-variant/30" title="Thả tim cho ảnh này">
          <span class="material-symbols-outlined text-xl filled text-rose-500">favorite</span>
        </button>

        <!-- Quick Reply Form -->
        <form class="form-card-reply flex-1 flex items-center gap-1.5 bg-surface-container-low rounded-full px-3 py-1.5 border border-outline-variant/30 focus-within:border-primary focus-within:bg-white transition-all">
          <input type="text" class="input-card-reply bg-transparent border-0 focus:ring-0 focus:outline-none text-xs text-on-surface placeholder:text-tertiary/60 w-full" placeholder="Gửi tin nhắn cho ${authorName.split(' ')[0]}..." autocomplete="off">
          <button type="submit" class="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform hover:bg-orange-700 shadow-2xs flex-shrink-0" title="Gửi">
            <span class="material-symbols-outlined text-xs">arrow_upward</span>
          </button>
        </form>
      </div>
    `;

    // Bind Delete Buttons Click -> Open delete confirmation modal
    const deleteBtns = card.querySelectorAll('.btn-card-delete-meal, .btn-card-photo-delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onDeleteMealRequest) {
          this.onDeleteMealRequest(meal);
        } else if (this.onSelectMeal) {
          this.onSelectMeal(meal);
        }
      });
    });

    // Bind Photo Click -> Open Full View
    const photoEl = card.querySelector('img.group-hover\\:scale-\\[1\\.02\\]') || card.querySelector('img');
    if (photoEl) {
      photoEl.addEventListener('click', () => {
        if (this.onSelectMeal) this.onSelectMeal(meal);
      });
    }

    // Bind Heart Button Click -> Send Heart
    const heartBtn = card.querySelector('.btn-card-heart');
    if (heartBtn) {
      heartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundHelper.playPop();

        // Little bounce animation
        heartBtn.classList.add('scale-125', 'bg-rose-100');
        setTimeout(() => heartBtn.classList.remove('scale-125', 'bg-rose-100'), 300);

        if (this.onSendReaction) {
          this.onSendReaction(meal, '❤️', 'Yêu thích');
        }
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

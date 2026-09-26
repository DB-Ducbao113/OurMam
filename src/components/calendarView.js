/**
 * ==============================================================================
 * CALENDAR VIEW COMPONENT (MEMORIES & STREAK GRID)
 * ==============================================================================
 */

import { getMonthNames, formatDayMonth } from '../utils/dateHelper.js';
import { getUserAvatar } from '../utils/avatarHelper.js';
import { soundHelper } from '../utils/soundHelper.js';

export class CalendarViewComponent {
  constructor(onSelectMeal, onDeleteMealRequest) {
    this.gridEl = document.getElementById('calendar-grid');
    this.monthLabelEl = document.getElementById('current-month-label');
    this.momentsCountEl = document.getElementById('month-moments-count');
    this.headingEl = document.getElementById('selected-date-heading');
    this.countEl = document.getElementById('selected-date-count');
    this.mealsContainer = document.getElementById('selected-date-meals');
    this.btnPrev = document.getElementById('btn-prev-month');
    this.btnNext = document.getElementById('btn-next-month');

    this.currentDate = new Date(); // Month currently viewed
    this.selectedDate = new Date(); // Day currently selected by user
    this.meals = [];
    this.currentUser = null;
    this.connections = [];
    this.onSelectMeal = onSelectMeal;
    this.onDeleteMealRequest = onDeleteMealRequest;

    this.bindEvents();
  }

  bindEvents() {
    this.btnPrev.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    this.btnNext.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });
  }

  setMeals(meals) {
    this.meals = meals;
    this.render();
  }

  setContext(currentUser, connections = []) {
    this.currentUser = currentUser;
    this.connections = connections || [];
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = getMonthNames();
    this.monthLabelEl.textContent = `${monthNames[month]}, ${year}`;

    const mealsInMonth = this.meals.filter(m => {
      const d = new Date(m.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    this.momentsCountEl.textContent = `${mealsInMonth.length} khoảnh khắc`;

    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    this.gridEl.innerHTML = '';

    for (let i = 0; i < startOffset; i++) {
      const blank = document.createElement('div');
      blank.className = 'aspect-square rounded-xl bg-surface-container-low/40 border border-dashed border-outline-variant/30 flex items-center justify-center';
      this.gridEl.appendChild(blank);
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const dateMeals = mealsInMonth.filter(m => new Date(m.created_at).getDate() === day);
      const cell = document.createElement('div');
      
      const isToday = cellDate.toDateString() === today.toDateString();
      const isSelected = cellDate.toDateString() === this.selectedDate.toDateString();

      if (dateMeals.length > 0) {
        // Day with food photo
        let borderClasses = '';
        if (isSelected) {
          borderClasses = 'ring-3 ring-[#FF6433] ring-offset-2 scale-105 z-20 shadow-md';
        } else if (isToday) {
          borderClasses = 'ring-2 ring-orange-400/80 ring-offset-1 z-10';
        }

        cell.className = `aspect-square rounded-xl relative overflow-hidden group cursor-pointer soft-tactile-shadow transition-all active:scale-95 ${borderClasses}`;
        cell.innerHTML = `
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform" src="${dateMeals[0].photo_url}" alt="Ngày ${day}">
          <div class="absolute inset-0 bg-black/20"></div>
          
          ${isToday ? `
            <span class="absolute top-1 left-1 bg-[#FF6433] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs">Nay</span>
          ` : `
            <span class="absolute top-1 left-1.5 text-[11px] font-bold text-white drop-shadow-md">${day}</span>
          `}

          <span class="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-primary-container ring-1 ring-white"></span>
          
          ${isSelected ? `
            <span class="absolute inset-0 border-2 border-white/60 rounded-xl pointer-events-none"></span>
          ` : ''}
        `;

        cell.addEventListener('click', () => {
          soundHelper.playPop();
          this.selectDate(cellDate, dateMeals);
        });
      } else {
        // Empty day
        let emptyClasses = '';
        if (isSelected) {
          emptyClasses = 'bg-orange-100 text-[#FF6433] font-black border-2 border-[#FF6433] ring-2 ring-orange-300 ring-offset-1 scale-105 z-20 shadow-xs';
        } else if (isToday) {
          emptyClasses = 'bg-surface-container-low border-2 border-primary/70 ring-1 ring-primary/30';
        } else {
          emptyClasses = 'bg-surface-container-low border border-outline-variant/20 hover:border-orange-200';
        }

        cell.className = `aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${emptyClasses}`;
        
        if (isToday) {
          cell.innerHTML = `
            <span class="text-[9px] font-black text-[#FF6433] uppercase leading-none">Nay</span>
            <span class="text-[11px] font-extrabold text-stone-800 mt-0.5">${day}</span>
          `;
        } else {
          cell.innerHTML = `<span class="text-[11px] font-semibold ${isSelected ? 'text-[#FF6433]' : 'text-tertiary'}">${day}</span>`;
        }

        cell.addEventListener('click', () => {
          soundHelper.playPop();
          this.selectDate(cellDate, []);
        });
      }

      this.gridEl.appendChild(cell);
    }

    // Default display selectedDate's meals
    const selectedDateMeals = mealsInMonth.filter(m => new Date(m.created_at).getDate() === this.selectedDate.getDate());
    this.showDateMeals(this.selectedDate, selectedDateMeals);
  }

  selectDate(cellDate, dateMeals) {
    this.selectedDate = cellDate;
    this.render(); // Re-render grid to update the highlighted border on the clicked date
    this.showDateMeals(cellDate, dateMeals);

    // Smooth scroll down to meals stream if needed
    const mealsSection = document.getElementById('selected-date-meals');
    if (mealsSection && window.innerWidth < 640) {
      setTimeout(() => {
        mealsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }

  showDateMeals(date, meals) {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    // Prominent Header with Date and Quick "Back to Today" button
    this.headingEl.innerHTML = `
      <div class="flex items-center gap-2 flex-wrap">
        <span class="w-2.5 h-2.5 rounded-full ${isToday ? 'bg-primary animate-pulse' : 'bg-stone-400'}"></span>
        <span class="font-bold text-stone-900">${isToday ? `Hôm nay (${formatDayMonth(date)})` : `Ngày ${formatDayMonth(date)}`}</span>
        
        ${!isToday ? `
          <button id="btn-back-to-today" type="button" class="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF6433] hover:underline bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-2.5 py-0.5 rounded-full cursor-pointer active:scale-95 transition-all ml-1">
            <span>Quay về hôm nay</span>
            <span class="material-symbols-outlined text-xs">today</span>
          </button>
        ` : `
          <span class="px-2 py-0.2 rounded-full text-[10px] font-bold bg-orange-100 text-[#FF6433]">Hôm nay</span>
        `}
      </div>
    `;

    // Bind back to today button
    const btnBackToday = document.getElementById('btn-back-to-today');
    if (btnBackToday) {
      btnBackToday.addEventListener('click', () => {
        soundHelper.playPop();
        this.currentDate = new Date();
        this.selectedDate = new Date();
        const todayMeals = this.meals.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString());
        this.render();
      });
    }

    this.countEl.textContent = `${meals.length} món ngon`;
    this.mealsContainer.innerHTML = '';
    
    // Add micro-animation
    this.mealsContainer.classList.remove('animate-fade-in');
    void this.mealsContainer.offsetWidth; // trigger reflow
    this.mealsContainer.classList.add('animate-fade-in');

    if (meals.length === 0) {
      this.mealsContainer.innerHTML = `
        <div class="w-full bg-surface-container-lowest/90 rounded-2xl p-6 border border-dashed border-outline-variant/50 text-center flex flex-col items-center justify-center gap-1.5 my-1 animate-fade-in">
          <span class="text-3xl">🍽️</span>
          <p class="text-xs font-bold text-stone-800">Chưa có bữa ăn nào ngày ${formatDayMonth(date)}</p>
          <p class="text-[11px] text-stone-500 max-w-xs">
            ${isToday ? 'Chụp ảnh món ăn hôm nay để tích streak và chia sẻ với người ấy nhé! 💕' : 'Bạn có thể chọn ngày khác có ảnh trên lịch để xem lại kỷ niệm.'}
          </p>
          ${!isToday ? `
            <button id="btn-empty-back-today" type="button" class="mt-1 px-3 py-1 bg-orange-50 hover:bg-orange-100 text-[#FF6433] text-xs font-bold rounded-xl border border-orange-200 transition-all active:scale-95 cursor-pointer">
              Xem món hôm nay
            </button>
          ` : ''}
        </div>
      `;

      const btnEmptyBack = this.mealsContainer.querySelector('#btn-empty-back-today');
      if (btnEmptyBack) {
        btnEmptyBack.addEventListener('click', () => {
          soundHelper.playPop();
          this.currentDate = new Date();
          this.selectedDate = new Date();
          this.render();
        });
      }
      return;
    }

    const users = new Map();
    if (this.currentUser?.id) users.set(this.currentUser.id, this.currentUser);
    const accepted = (this.connections || []).filter(connection => !connection.status || connection.status === 'accepted');
    const couple = accepted.find(connection => connection.relationship_type === 'couple');
    if (couple?.friend?.id && !users.has(couple.friend.id)) users.set(couple.friend.id, couple.friend);
    meals.forEach(meal => {
      if (meal.user_id && !users.has(meal.user_id)) {
        users.set(meal.user_id, { id: meal.user_id, display_name: meal.user_name || 'Người dùng', avatar_url: meal.user_avatar });
      }
    });

    const periods = [
      { key: 'morning', label: 'Sáng', from: 0, to: 11, icon: '☀️' },
      { key: 'noon', label: 'Trưa', from: 11, to: 16, icon: '🌤️' },
      { key: 'evening', label: 'Chiều / tối', from: 16, to: 24, icon: '🌙' }
    ];
    this.mealsContainer.className = 'grid grid-cols-2 gap-2 py-2 items-start';

    [...users.values()].forEach(user => {
      const userMeals = meals.filter(meal => meal.user_id === user.id);
      const column = document.createElement('section');
      column.className = 'min-w-0 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-2 sm:p-3 soft-tactile-shadow';
      const name = user.display_name || 'Người dùng';
      const avatar = getUserAvatar(user.avatar_url, name);
      column.innerHTML = `<header class="flex items-center gap-2 pb-2 mb-2 border-b border-outline-variant/20"><img class="w-7 h-7 rounded-full object-cover" src="${avatar}" alt=""><strong class="text-xs truncate">${name}</strong><span class="ml-auto text-[10px] text-tertiary">${userMeals.length} ảnh</span></header>`;

      periods.forEach(period => {
        const periodMeals = userMeals.filter(meal => {
          const hour = new Date(meal.created_at).getHours();
          return hour >= period.from && hour < period.to;
        });
        const group = document.createElement('div');
        group.className = 'mb-2 last:mb-0';
        group.innerHTML = `<h4 class="text-[10px] font-bold text-tertiary mb-1">${period.icon} ${period.label}</h4>`;
        if (!periodMeals.length) {
          group.insertAdjacentHTML('beforeend', '<p class="text-[10px] text-stone-300 px-1 pb-1">Chưa có ảnh</p>');
        } else {
          const grid = document.createElement('div');
          grid.className = 'grid grid-cols-2 gap-1.5';
          periodMeals.forEach(meal => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'relative aspect-square overflow-hidden rounded-xl text-left';
            const time = new Date(meal.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const isOwner = Boolean(this.currentUser?.id && meal.user_id === this.currentUser.id);
            const deleteBtnHtml = isOwner 
              ? `<span class="btn-cal-item-delete absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs" title="Xóa ảnh"><span class="material-symbols-outlined text-[12px]">delete</span></span>`
              : '';
            card.innerHTML = `<img class="w-full h-full object-cover" src="${meal.photo_url}" alt="${meal.dish_name || 'Món ngon'}"><span class="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate">${time} · ${meal.dish_name || 'Món ngon'}</span>${deleteBtnHtml}`;
            card.addEventListener('click', () => this.onSelectMeal?.(meal));
            if (isOwner) {
              const delBtn = card.querySelector('.btn-cal-item-delete');
              if (delBtn) {
                delBtn.addEventListener('click', event => {
                  event.stopPropagation();
                  if (this.onDeleteMealRequest) this.onDeleteMealRequest(meal);
                  else this.onSelectMeal?.(meal);
                });
              }
            }
            grid.appendChild(card);
          });
          group.appendChild(grid);
        }
        column.appendChild(group);
      });
      this.mealsContainer.appendChild(column);
    });
  }
}

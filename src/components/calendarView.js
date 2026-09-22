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

    const createCard = (m) => {
      const card = document.createElement('div');
      card.className = 'relative w-full shrink-0 bg-surface-container-lowest rounded-2xl p-2 border border-outline-variant/30 soft-tactile-shadow flex flex-col gap-1.5 cursor-pointer active:scale-95 transition-transform hover:border-orange-200';
      const timeStr = new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const avatarUrl = getUserAvatar(m.user_avatar, m.user_name || 'Người dùng');

      card.innerHTML = `
        <div class="relative w-full aspect-square rounded-xl overflow-hidden shadow-xs">
          <img class="w-full h-full object-cover" src="${m.photo_url}" alt="${m.dish_name}">
          <span class="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">${timeStr}</span>
          <button type="button" class="btn-cal-item-delete absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-xs transition-all active:scale-90 cursor-pointer shadow-xs" title="Xoá ảnh này">
            <span class="material-symbols-outlined text-xs">delete</span>
          </button>
        </div>
        <div class="flex items-center justify-between gap-1">
          <span class="text-xs font-bold text-on-surface truncate">${m.dish_name || 'Món ngon'}</span>
        </div>
      `;

      const delBtn = card.querySelector('.btn-cal-item-delete');
      if (delBtn) {
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onDeleteMealRequest) this.onDeleteMealRequest(m);
          else if (this.onSelectMeal) this.onSelectMeal(m);
        });
      }
      card.addEventListener('click', () => this.onSelectMeal(m));
      return card;
    };

    const sessions = [
      { id: 'morning', label: '🌅 Buổi Sáng', check: (h) => h <= 10 },
      { id: 'noon', label: '☀️ Buổi Trưa', check: (h) => h > 10 && h <= 14 },
      { id: 'evening', label: '🌙 Buổi Tối', check: (h) => h > 14 }
    ];

    sessions.forEach(session => {
      const sessionMeals = meals.filter(m => session.check(new Date(m.created_at).getHours()));
      if (sessionMeals.length === 0) return;

      const sessionEl = document.createElement('div');
      sessionEl.className = 'w-full mb-6 flex flex-col';
      sessionEl.innerHTML = `<h3 class="text-xs font-bold text-stone-500 mb-3 border-b border-stone-200 pb-1 uppercase tracking-wider">${session.label}</h3>`;
      
      const columnsContainer = document.createElement('div');
      columnsContainer.className = 'flex gap-3 w-full';

      const users = [...new Set(sessionMeals.map(m => m.user_name))];
      
      users.forEach((user, index) => {
        const col = document.createElement('div');
        col.className = `flex-1 w-1/2 flex flex-col gap-3 ${index === 0 && users.length > 1 ? 'border-r border-stone-100 pr-3' : ''}`;
        
        const avatarUrl = getUserAvatar(null, user);
        col.innerHTML = `
          <div class="flex items-center gap-1.5 mb-1 justify-center">
             <img src="${avatarUrl}" class="w-4 h-4 rounded-full border border-stone-200">
             <span class="text-[10px] font-bold text-stone-600 truncate">${user}</span>
          </div>
        `;
        
        sessionMeals.filter(m => m.user_name === user).forEach(m => {
           col.appendChild(createCard(m));
        });
        columnsContainer.appendChild(col);
      });

      sessionEl.appendChild(columnsContainer);
      this.mealsContainer.appendChild(sessionEl);
    });
  }
}

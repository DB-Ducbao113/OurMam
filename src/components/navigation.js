/**
 * ==============================================================================
 * NAVIGATION COMPONENT (BOTTOM TAB BAR)
 * ==============================================================================
 */

export class NavigationComponent {
  constructor(onTabChange) {
    this.navButtons = document.querySelectorAll('.nav-item');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    this.onTabChange = onTabChange;

    this.bindEvents();
  }

  bindEvents() {
    this.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        this.switchTab(targetId);
      });
    });
  }

  switchTab(targetTabId) {
    this.navButtons.forEach(btn => {
      const isTarget = btn.dataset.target === targetTabId;
      if (isTarget) {
        btn.classList.add('active', 'bg-primary-fixed', 'text-primary', 'font-bold', 'shadow-xs');
        btn.classList.remove('text-tertiary');
        btn.querySelector('.material-symbols-outlined')?.classList.add('filled');
      } else {
        btn.classList.remove('active', 'bg-primary-fixed', 'text-primary', 'font-bold', 'shadow-xs');
        btn.classList.add('text-tertiary');
        btn.querySelector('.material-symbols-outlined')?.classList.remove('filled');
      }
    });

    this.tabPanes.forEach(pane => {
      if (pane.id === targetTabId) {
        pane.classList.add('active');
        pane.style.display = 'flex';
      } else {
        pane.classList.remove('active');
        pane.style.display = 'none';
      }
    });

    if (this.onTabChange) this.onTabChange(targetTabId);
  }
}

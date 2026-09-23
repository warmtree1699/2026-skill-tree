(function () {
  const STORAGE_KEY = 'skilltree:' + location.pathname;
  const THEME_KEY = 'skilltree:theme';
  const STATUS_ORDER = ['todo', 'learning', 'done'];
  const STATUS_BADGE = { todo: '', learning: '📖', done: '✅' };

  function loadTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) {
      return 'light';
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* ignore (private browsing / storage disabled) */
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // apply immediately (before DOMContentLoaded) to avoid a flash of the wrong theme
  applyTheme(loadTheme());

  function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      applyTheme(next);
    });
  }

  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore (private browsing / storage disabled) */
    }
  }

  function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const board = document.getElementById('board');
    const columns = document.querySelectorAll('.column');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.dataset.cat;

        if (cat === 'all') {
          board.classList.remove('filtered');
          columns.forEach(c => c.hidden = false);
        } else {
          board.classList.add('filtered');
          columns.forEach(c => c.hidden = c.dataset.cat !== cat);
        }
      });
    });
  }

  function setupProgressTracking() {
    const state = loadState();

    document.querySelectorAll('.column').forEach(column => {
      const cat = column.dataset.cat;
      const nodes = column.querySelectorAll('.node:not(.group), .skill-item');

      // progress bar UI, inserted right after the column subtitle
      const track = document.createElement('div');
      track.className = 'progress-track';
      const fill = document.createElement('div');
      fill.className = 'progress-fill';
      track.appendChild(fill);

      const text = document.createElement('p');
      text.className = 'progress-text';

      const sub = column.querySelector('.col-sub');
      sub.insertAdjacentElement('afterend', text);
      text.insertAdjacentElement('beforebegin', track);

      function render() {
        let done = 0, learning = 0;
        nodes.forEach(node => {
          const s = node.dataset.status || 'todo';
          if (s === 'done') done++;
          else if (s === 'learning') learning++;
        });
        const total = nodes.length;
        const score = done + learning * 0.5;
        const pct = total ? Math.round((score / total) * 100) : 0;
        fill.style.width = pct + '%';
        text.textContent = `✅ 已掌握 ${done}・📖 學習中 ${learning}・共 ${total}（${pct}%）`;
      }

      nodes.forEach((node, i) => {
        const id = cat + '-' + i;
        const status = state[id] || 'todo';
        node.dataset.status = status;
        setBadge(node, status);

        node.addEventListener('click', () => {
          const current = node.dataset.status || 'todo';
          const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
          node.dataset.status = next;
          setBadge(node, next);
          state[id] = next;
          saveState(state);
          render();
        });
      });

      render();
    });
  }

  function setBadge(node, status) {
    let badge = node.querySelector('.status-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'status-badge';
      node.appendChild(badge);
    }
    badge.textContent = STATUS_BADGE[status] || '';
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupThemeToggle();
    setupTabs();
    setupProgressTracking();
  });
})();

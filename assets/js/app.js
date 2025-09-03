(function () {
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  const menuBtn = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');

  // Theme: load -> set
  function detectInitialTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
    localStorage.setItem('theme', theme);
  }

  applyTheme(detectInitialTheme());

  themeBtn.addEventListener('click', () => {
    const next = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
    applyTheme(next);
  });

  // Menu: toggle open/close
  function setMenu(open) {
    nav.setAttribute('data-open', String(open));
    menuBtn.setAttribute('aria-expanded', String(open));
  }

  menuBtn.addEventListener('click', () => {
    const open = nav.getAttribute('data-open') !== 'true';
    setMenu(open);
  });

  // Close on nav link click (mobile)
  nav.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.tagName === 'A') setMenu(false);
  });
})();

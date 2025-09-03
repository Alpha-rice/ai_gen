(() => {
  'use strict';

  const root = document.documentElement;
  const nav = document.getElementById('primary-nav');
  const themeBtn = document.getElementById('theme-toggle');
  const menuBtn = document.getElementById('menu-toggle');
  const THEME_KEY = 'theme';

  const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  // ----- Theme -----
  const getSystemTheme = () => (mqDark.matches ? 'dark' : 'light'); // OSのダーク/ライトを検出
  const getSavedTheme = () => {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : null;
  };
  const currentExplicit = () => getSavedTheme() !== null;

  function computePrimaryColor() {
    const cs = getComputedStyle(root);
    let c = cs.getPropertyValue('--primary').trim();
    if (!c) c = getComputedStyle(document.body).color;
    return c || '#0a84ff';
  }

  function applyTheme(theme, persist) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) themeBtn.setAttribute('aria-pressed', String(theme === 'dark'));
    if (persist) localStorage.setItem(THEME_KEY, theme);
    if (metaTheme) metaTheme.setAttribute('content', computePrimaryColor());
  }

  function initTheme() {
    const saved = getSavedTheme();
    const theme = saved ?? getSystemTheme();
    applyTheme(theme, false);

    // OSテーマ変更を反映（明示選択がない場合のみ）
    mqDark.addEventListener('change', (e) => {
      if (!currentExplicit()) applyTheme(e.matches ? 'dark' : 'light', false);
    });

    // 複数タブ間での同期
    window.addEventListener('storage', (e) => {
      if (e.key === THEME_KEY) {
        const v = e.newValue === 'dark' ? 'dark' : e.newValue === 'light' ? 'light' : null;
        if (v) applyTheme(v, false);
      }
    });
  }

  function initThemeToggle() {
    if (!themeBtn) return;
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
    });
  }

  // ----- Menu -----
  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.setAttribute('data-open', String(open));
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      const firstLink = nav.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      if (firstLink) firstLink.focus();
    } else {
      menuBtn.focus();
    }
  }

  function initMenu() {
    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', () => {
      const open = nav.getAttribute('data-open') !== 'true';
      setMenu(open);
    });

    // Escapeでクローズ
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') setMenu(false);
    });

    // メニュー外クリックでクローズ
    document.addEventListener('click', (e) => {
      if (nav.getAttribute('data-open') !== 'true') return;
      const path = e.composedPath ? e.composedPath() : null;
      const inside = path ? path.includes(nav) || path.includes(menuBtn) : (nav.contains(e.target) || menuBtn.contains(e.target));
      if (!inside) setMenu(false);
    });

    // PC幅になったら自動クローズ（CSSで常時表示に切替）
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 769 && nav.getAttribute('data-open') === 'true') setMenu(false);
    });

    // ナビリンク選択で自動クローズ（モバイル）
    nav.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.tagName === 'A') setMenu(false);
    });
  }

  // ----- Smooth anchors -----
  const prefersReducedMotion = () => mqReduce.matches;

  function initSmoothAnchors() {
    const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    links.forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return; // アンカーの標準動作に委ねる
        e.preventDefault();
        const smooth = !prefersReducedMotion();
        try {
          target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start', inline: 'nearest' });
        } catch {
          target.scrollIntoView(true);
        }
        // 位置は保ちつつハッシュを更新
        history.pushState(null, '', `#${id}`);
      });
    });
  }

  // ----- Section observer (active link) -----
  function initSectionObserver() {
    const sectionEls = Array.from(document.querySelectorAll('main section[id]'));
    const linkMap = new Map(Array.from(document.querySelectorAll('nav a[href^="#"]')).map((a) => [a.getAttribute('href').slice(1), a]));
    if (!('IntersectionObserver' in window) || sectionEls.length === 0) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = linkMap.get(id);
        if (!link) return;
        if (entry.isIntersecting) {
          link.setAttribute('aria-current', 'page');
        } else if (link.getAttribute('aria-current') === 'page') {
          link.removeAttribute('aria-current');
        }
      });
    }, { threshold: 0.6 });

    sectionEls.forEach((s) => io.observe(s));

    // ハッシュ遷移時の補正
    window.addEventListener('hashchange', () => {
      const id = location.hash.replace('#', '');
      linkMap.forEach((lnk, key) => {
        if (key === id) lnk.setAttribute('aria-current', 'page');
        else lnk.removeAttribute('aria-current');
      });
    });
  }

  // ----- Init -----
  initTheme();
  initThemeToggle();
  initMenu();
  initSmoothAnchors();
  initSectionObserver();
})();

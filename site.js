/* ------------------------------------------------------------
   The site as a slideshow.

   All six pages sit side by side in one horizontal strip (.deck), each
   page a full-width slide that scrolls up and down on its own. The strip
   is a real scroller with CSS scroll-snap, so:

   - swiping sideways (trackpad or touch) moves the pages under your
     fingers, natively, and always stops on the next page: one swipe,
     one page (scroll-snap-stop: always);
   - the top bar works like a scrollbar: drag it and the strip follows
     continuously, then it eases onto the nearest page when you let go;
   - nav links, any link to one of the six pages, and ← / → scroll the
     strip to that page;
   - the address bar and title follow the page you're on, and
     back/forward work. Nothing ever reloads.

   This page is shown at once; the other five are fetched and dropped into
   their slides straight after. If a page can't be fetched (e.g. opened
   from file:// instead of a server), landing on it loads it normally.
   ------------------------------------------------------------ */
(() => {
  const ORDER = ['index.html', 'research.html', 'projects.html', 'writing.html', 'music.html', 'cv.html'];
  const LAST = ORDER.length - 1;
  const pageOf = path => path.split('/').pop() || 'index.html';
  let here = ORDER.indexOf(pageOf(location.pathname));
  const root = document.documentElement;
  root.classList.add('js-nav');

  const loadScript = src => new Promise(res => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script'); s.src = src; s.onload = s.onerror = res; document.body.appendChild(s);
  });
  const loadCSS = href => new Promise(res => {
    if (document.querySelector(`link[href="${href}"]`)) return res();
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.onload = l.onerror = res; document.head.appendChild(l);
  });
  const fetchPage = async url => {
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) return null;
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const main = doc.querySelector('main');
      if (!main) return null;
      return {
        main, footer: doc.querySelector('.site-footer'), title: doc.title,
        css: [...doc.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href')).filter(h => h && !/^https?:/.test(h)),
        scripts: [...doc.querySelectorAll('script')].filter(s => s.getAttribute('src') !== 'site.js')
          .map(s => s.getAttribute('src') ? { src: s.getAttribute('src') } : { code: s.textContent }),
      };
    } catch (e) { return null; }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const nav = document.querySelector('.site-nav');
    const first = document.querySelector('main');
    const links = nav ? [...nav.querySelectorAll('a')] : [];
    const linkFor = i => links.find(a => a.getAttribute('href') === ORDER[i]);
    if (here < 0 || !first) return;          // not one of the six pages

    /* ---------- build the strip ---------- */
    root.classList.add('deck-on');
    root.dataset.page = ORDER[here];
    const deck = document.createElement('div');
    deck.className = 'deck';
    const slides = ORDER.map((url, i) => {
      const s = document.createElement('section');
      s.className = 'slide'; s.tabIndex = -1; s.dataset.page = url;
      const a = linkFor(i);
      // a placeholder until the real page arrives
      if (i !== here) s.innerHTML = `<main><div class="wrap"><h1 class="page-title">${a ? a.textContent : ''}</h1></div></main>`;
      deck.appendChild(s);
      return s;
    });
    first.parentNode.insertBefore(deck, first);
    slides[here].appendChild(first);
    const footer = document.querySelector('body > .site-footer');
    if (footer) slides[here].appendChild(footer);

    const W = () => deck.getBoundingClientRect().width || 1;
    deck.scrollLeft = slides[here].offsetLeft;
    const titles = { [here]: document.title };
    const failed = {};
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    history.replaceState({ page: here }, '');

    // fetch the rest and drop them into their slides
    (async () => {
      const pages = await Promise.all(ORDER.map((u, i) => i === here ? null : fetchPage(u)));
      const css = new Set(); pages.forEach(p => p && p.css.forEach(h => css.add(h)));
      await Promise.all([...css].map(loadCSS));
      pages.forEach((p, i) => {
        if (i === here) return;
        if (!p) { failed[i] = true; return; }
        slides[i].replaceChildren(document.importNode(p.main, true));
        if (p.footer) slides[i].appendChild(document.importNode(p.footer, true));
        titles[i] = p.title;
      });
      for (const p of pages) {                // each page's own scripts, once
        if (!p) continue;
        for (const s of p.scripts) {
          if (s.src) await loadScript(s.src);
          else { const el = document.createElement('script'); el.textContent = s.code; document.body.appendChild(el); }
        }
      }
    })();

    /* ---------- underline follows the strip ---------- */
    let ind = null;
    const box = a => {
      const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
      return { x: r.left - n.left, y: r.bottom - n.top, w: r.width };
    };
    const boxes = () => ORDER.map((_, i) => linkFor(i) && box(linkFor(i)));
    const placeAt = f => {
      if (!ind) return;
      const bs = boxes();
      const i = Math.max(0, Math.min(LAST, Math.floor(f)));
      const j = Math.min(LAST, i + 1), t = Math.max(0, Math.min(1, f - i));
      const A = bs[i], B = bs[j] || A;
      if (!A) return;
      ind.style.width = (A.w + (B.w - A.w) * t) + 'px';
      ind.style.transform = `translate(${A.x + (B.x - A.x) * t}px, ${A.y + (B.y - A.y) * t}px)`;
    };
    if (nav) {
      ind = document.createElement('span');
      ind.className = 'nav-indicator';
      ind.setAttribute('aria-hidden', 'true');
      nav.appendChild(ind);
      placeAt(here);
      document.fonts && document.fonts.ready.then(() => placeAt(deck.scrollLeft / W()));
    }

    /* ---------- which page are we on ---------- */
    const setCurrent = (i, push) => {
      if (i === here) return;
      here = i;
      root.dataset.page = ORDER[i];
      document.title = titles[i] || document.title;
      links.forEach(a => a.getAttribute('href') === ORDER[i] ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
      if (push) history.pushState({ page: i }, '', ORDER[i]);
      slides[i].focus({ preventScroll: true });   // so ↑/↓/space scroll this page
    };
    const goTo = (i, smooth = true) => {
      i = Math.max(0, Math.min(LAST, i));
      heading = smooth && i !== Math.round(deck.scrollLeft / W()) ? i : null;
      deck.scrollTo({ left: slides[i].offsetLeft, behavior: smooth ? 'smooth' : 'instant' });
    };

    let dragging = false, settleT = null, raf = 0, heading = null;
    // which page is in view, and how far it is from sitting exactly in place (0 = exactly)
    const nearest = () => {
      const w = W(), x = deck.scrollLeft;
      const i = Math.max(0, Math.min(LAST, Math.round(x / w)));
      return { i, off: Math.abs(x - slides[i].offsetLeft) / w };
    };
    // a page counts as "landed on" once it fills (almost) the whole width.
    // Not an exact-pixel check: browsers often stop a pixel or two off.
    const check = final => {
      if (dragging) return;
      const { i, off } = nearest();
      if (off > (final ? 0.05 : 0.02)) return;
      if (heading != null) { if (i !== heading && !final) return; heading = null; }   // passing through on the way to a link's page
      if (failed[i]) { if (final) location.href = ORDER[i]; return; }   // couldn't preload: load it for real
      setCurrent(i, true);
    };
    const settled = () => { if (!dragging) deck.classList.remove('free'); check(true); };
    deck.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; placeAt(deck.scrollLeft / W()); check(false); });
      clearTimeout(settleT); settleT = setTimeout(settled, 120);
    }, { passive: true });
    deck.addEventListener('scrollend', settled);

    /* ---------- links, back/forward, keys ---------- */
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const a = e.target.closest('a[href]');
      if (!a || a.target === '_blank') return;
      const to = ORDER.indexOf(a.getAttribute('href'));
      if (to < 0) return;
      e.preventDefault();
      goTo(to);
    });
    window.addEventListener('popstate', () => {
      const i = ORDER.indexOf(pageOf(location.pathname));
      if (i < 0) return;
      setCurrent(i, false);
      goTo(i);
    });
    document.addEventListener('keydown', e => {
      if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.target.closest('input, textarea, select, [contenteditable], [role="slider"], button, iframe, .plank')) return;
      e.preventDefault();
      goTo(Math.round(deck.scrollLeft / W()) + (e.key === 'ArrowRight' ? 1 : -1));
    });

    /* ---------- the top bar is a scrollbar ---------- */
    if (header && ind) {
      let sx = null, moved = false, start = 0, pxPerPage = 80;
      header.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        sx = e.clientX; moved = false; start = deck.scrollLeft;
        const bs = boxes().filter(Boolean);
        pxPerPage = bs.length > 1 ? (bs[bs.length - 1].x - bs[0].x) / (bs.length - 1) : 80;
      });
      window.addEventListener('pointermove', e => {
        if (sx == null) return;
        const dx = e.clientX - sx;
        if (!moved && Math.abs(dx) < 5) return;
        if (!moved) { moved = dragging = true; header.classList.add('dragging'); deck.classList.add('free'); }
        deck.scrollLeft = start + dx / pxPerPage * W();
      });
      const end = () => {
        if (sx == null) return;
        sx = null;
        header.classList.remove('dragging');
        if (!moved) return;
        dragging = false;
        setTimeout(() => { moved = false; }, 0);
        goTo(Math.round(deck.scrollLeft / W()));
        clearTimeout(settleT); settleT = setTimeout(settled, 150);   // in case it's already in place
      };
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
      header.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
      header.addEventListener('dragstart', e => e.preventDefault());
    }

    window.addEventListener('resize', () => { deck.scrollLeft = slides[here].offsetLeft; placeAt(here); });
    // only the strip and the slides scroll; if focus ever drags the window itself sideways, put it back
    window.addEventListener('scroll', () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0); }, { passive: true });
    slides[here].focus({ preventScroll: true });
  });
})();

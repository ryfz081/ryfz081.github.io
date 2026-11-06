/* ------------------------------------------------------------
   Music page — a TV and a shelf of tapes.
   To add or edit music, change tracks.js (not this file).
   ------------------------------------------------------------ */

/* Track data lives in tracks.js; shelf.js turns it into ITEMS/CATS and tape markup. */

const $ = (s, el = document) => el.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const pad = n => String(n).padStart(2, '0');
const fmt = t => (!isFinite(t) ? '0:00' : Math.floor(t / 60) + ':' + pad(Math.floor(t % 60)));
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- Player state ---------- */

const audio = new Audio();
audio.preload = 'none';
const LOCAL_FILE = location.protocol === 'file:';   // browsers silence Web Audio on file://
let ctx, gainNode, anL, anR, bufL, bufR;
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
                set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const state = {
  item: null, playing: false, screen: 'waveform', level: 0,
  volume: Math.min(1, Math.max(0, parseFloat(store.get('music-volume', '0.8')) || 0)),
  muted: false,
  scope: store.get('music-scope', 'yt') === 'xy' ? 'xy' : 'yt',
};
const listeners = [];
const notify = () => listeners.forEach(fn => fn(state));

function ensureAudioGraph() {
  if (ctx || LOCAL_FILE) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaElementSource(audio);
    gainNode = ctx.createGain();
    const split = ctx.createChannelSplitter(2);
    anL = ctx.createAnalyser(); anR = ctx.createAnalyser();
    anL.fftSize = anR.fftSize = 4096;
    bufL = new Float32Array(anL.fftSize); bufR = new Float32Array(anR.fftSize);
    src.connect(gainNode).connect(ctx.destination);
    src.connect(split);                 // scope reads pre-fader, so it stays lively at low volume
    split.connect(anL, 0); split.connect(anR, 1);
  } catch (e) { ctx = null; }
  applyGain();
}
function applyGain() {
  const v = state.muted ? 0 : state.volume;
  if (gainNode) { gainNode.gain.setTargetAtTime(v * v, ctx.currentTime, 0.015); audio.volume = 1; }
  else audio.volume = v * v;            // squared ≈ perceptual taper
}
function setVolume(v) { state.volume = Math.min(1, Math.max(0, v)); state.muted = false; store.set('music-volume', state.volume); applyGain(); notify(); }
function toggleMute() { state.muted = !state.muted; applyGain(); notify(); }
function setScope(m) { state.scope = m; store.set('music-scope', m); notify(); }

function stop() {
  audio.pause();
  audio.removeAttribute('src'); audio.load();
  state.item = null; state.playing = false; state.screen = 'waveform';
  tv.unload();
  notify();
}
function select(item, { autoplay = true } = {}) {
  if (state.item === item) { stop(); return; }   // pressing the loaded tape ejects it
  audio.pause();
  state.item = item;
  state.playing = false;
  state.screen = item.video ? 'video' : 'waveform';
  if (item.audio) { audio.src = item.audio; }
  else audio.removeAttribute('src');
  tv.load(item);
  if (autoplay && state.screen === 'waveform') play();
  notify();
}
function play() {
  if (!state.item || !state.item.audio) return;
  ensureAudioGraph();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  applyGain();
  audio.play().then(() => { state.playing = true; notify(); })
    .catch(err => { console.warn('Playback failed:', err); state.playing = false; notify(); });
}
function pause() { audio.pause(); state.playing = false; notify(); }
function toggle() { state.playing ? pause() : play(); }
function setScreen(mode) {
  if (!state.item || state.screen === mode) return;
  state.screen = mode;
  if (mode === 'video') { pause(); tv.load(state.item); }
  else { tv.load(state.item); play(); }
  notify();
}
audio.addEventListener('ended', () => { state.playing = false; notify(); });
audio.addEventListener('pause', () => { if (state.playing) { state.playing = false; notify(); } });

/* ---------- TV ---------- */

const tv = (() => {
  const screen = $('#tv-screen');
  const canvas = $('#tv-canvas');
  const osd = $('#tv-osd');
  const frame = $('#tv-frame');
  const player = $('.player');
  const g = canvas.getContext('2d');
  let osdTimer;

  function size() {
    const d = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * d), hh = Math.round(canvas.clientHeight * d);
    if (w && hh && (canvas.width !== w || canvas.height !== hh)) { canvas.width = w; canvas.height = hh; }
  }
  new ResizeObserver(size).observe(canvas);

  function showOSD(item) {
    osd.innerHTML = `<span>CH ${pad(item.n)}${state.screen === 'waveform' ? ' · ' + (state.scope === 'xy' ? 'X–Y' : 'Y–T') : ''}</span><span>${esc(item.title)}</span>`;
    osd.classList.add('on');
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => osd.classList.remove('on'), 2600);
  }

  function unload() {
    frame.innerHTML = '';
    clearTimeout(osdTimer); osd.classList.remove('on');
    player.classList.remove('portrait');
    screen.dataset.mode = 'waveform';
    screen.classList.add('idle');
    g.clearRect(0, 0, canvas.width, canvas.height);
    peak = 0.25;
  }

  function load(item) {
    frame.innerHTML = '';
    screen.classList.remove('idle');
    peak = 0.25;
    g.clearRect(0, 0, canvas.width, canvas.height);
    screen.classList.add('switching');
    setTimeout(() => screen.classList.remove('switching'), 380);
    showOSD(item);
    if (state.screen === 'video') {
      const src = item.youtube
        ? `https://www.youtube-nocookie.com/embed/${item.youtube}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
        : item.embed;
      const f = h('iframe');
      f.src = src; f.title = item.title;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      const wrapEl = h('div', 'tv-video' + (item.portrait ? ' portrait' : ''));
      wrapEl.appendChild(f);
      frame.appendChild(wrapEl);
      screen.dataset.mode = 'video';
      player.classList.toggle('portrait', !!item.portrait);
    } else {
      screen.dataset.mode = 'waveform';
      player.classList.remove('portrait');
    }
  }

  const css = getComputedStyle(document.documentElement);
  let phosphor = '#9ff0b8';
  const readPhosphor = () => { phosphor = css.getPropertyValue('--phosphor').trim() || phosphor; };
  readPhosphor();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', readPhosphor);

  // scope trigger: rising zero-crossing with hysteresis (must dip below -th first), so the sweep holds still
  const mono = new Float32Array(4096);
  let peak = 0.25;
  function trigger(buf, span) {
    let peak = 0;
    for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
    const th = peak * 0.3, max = buf.length - span;
    let armed = false;
    for (let i = 1; i < max; i++) {
      if (buf[i] < -th) armed = true;
      else if (armed && buf[i - 1] < 0 && buf[i] >= 0) return i;
    }
    return 0;
  }

  function trace(pts, W) {
    // two passes: wide soft glow + thin hot core
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = phosphor;
    g.globalAlpha = 0.18; g.lineWidth = Math.max(4, W / 110); g.stroke(pts);
    g.globalAlpha = 0.95; g.lineWidth = Math.max(1.25, W / 520); g.stroke(pts);
    g.globalAlpha = 1;
  }

  function draw() {
    const W = canvas.width, H = canvas.height;

    if (!state.item) {               // idle: soft static
      g.clearRect(0, 0, W, H);
      const img = g.createImageData(W / 4 | 0 || 1, H / 4 | 0 || 1);
      for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 60; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      const off = draw.off || (draw.off = document.createElement('canvas'));
      off.width = img.width; off.height = img.height; off.getContext('2d').putImageData(img, 0, 0);
      g.imageSmoothingEnabled = false; g.globalAlpha = 0.55; g.drawImage(off, 0, 0, W, H); g.globalAlpha = 1;
      return;
    }
    if (state.screen !== 'waveform') { g.clearRect(0, 0, W, H); return; }

    // phosphor persistence: fade the last frame instead of clearing it
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';

    const live = !!(anL && state.playing);
    if (live) { anL.getFloatTimeDomainData(bufL); anR.getFloatTimeDomainData(bufR); }

    let rms = 0;
    if (live) { for (let i = 0; i < bufL.length; i += 4) rms += bufL[i] * bufL[i]; rms = Math.sqrt(rms / (bufL.length / 4)); }
    state.level += ((live ? rms : 0) - state.level) * 0.25;

    // fit the beam to the graticule (same inset as .tv-grid in CSS) with a slow auto-gain
    const gx = W * 0.06, gy = H * 0.07, gw = W * 0.88, gh = H * 0.86;
    const cx = gx + gw / 2, cy = gy + gh / 2, path = new Path2D();
    if (live) {
      let p = 0;
      for (let i = 0; i < bufL.length; i += 2) p = Math.max(p, Math.abs(bufL[i]), Math.abs(bufR[i]));
      peak = p > peak ? peak + (p - peak) * 0.35 : peak * 0.992 + p * 0.008;
      peak = Math.max(peak, 0.02);
    }
    if (state.scope === 'xy') {
      const s = (Math.min(gw, gh) / 2) * 0.88 / peak;
      const n = live ? bufL.length : 0;
      if (!n) path.arc(cx, cy, Math.max(1.5, W / 300), 0, Math.PI * 2);
      for (let i = 0; i < n; i += 2) {
        const x = cx + bufL[i] * s, y = cy - bufR[i] * s;
        i ? path.lineTo(x, y) : path.moveTo(x, y);
      }
    } else {
      const span = 1024, s = (gh / 2) * 0.85 / peak;
      if (live) for (let i = 0; i < bufL.length; i++) mono[i] = (bufL[i] + bufR[i]) / 2;
      const start = live ? trigger(mono, span) : 0;
      for (let i = 0; i < span; i += 2) {
        const v = live ? mono[start + i] : 0;
        const x = gx + (i / (span - 2)) * gw, y = cy - v * s;
        i ? path.lineTo(x, y) : path.moveTo(x, y);
      }
    }
    g.save();
    g.beginPath(); g.rect(gx, gy, gw, gh); g.clip();
    if (!live) g.globalAlpha = 0.5;
    trace(path, W);
    g.restore();
  }
  return { load, unload, draw };
})();

/* ---------- Transport + liner notes ---------- */

const transport = (() => {
  const btn = $('#tp-play'), title = $('#tp-title'), time = $('#tp-time'), bar = $('#tp-bar'), fill = $('#tp-fill');
  const screenToggle = $('#tp-screen');
  const notes = $('#notes');
  const notesIdle = notes.innerHTML;
  const led = $('#tv-led');
  const vol = $('#tp-volume'), mute = $('#tp-mute'), scopeSel = $('#tp-scope');
  const volKnob = $('#tv-vol-knob'), scopeKnob = $('#tv-scope-knob'), note = $('#tv-note');
  vol.addEventListener('input', () => setVolume(+vol.value));
  mute.addEventListener('click', toggleMute);
  scopeSel.addEventListener('click', e => { const m = e.target.closest('button')?.dataset.scope; if (m) setScope(m); });
  scopeKnob.addEventListener('click', () => setScope(state.scope === 'xy' ? 'yt' : 'xy'));
  btn.addEventListener('click', () => { if (state.item && state.screen === 'waveform') toggle(); });
  bar.addEventListener('pointerdown', e => {
    if (!audio.duration || state.screen !== 'waveform') return;
    const r = bar.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
  });
  screenToggle.addEventListener('click', e => {
    const m = e.target.closest('button')?.dataset.mode; if (m) setScreen(m);
  });
  listeners.push(s => {
    const it = s.item;
    const onVideo = it && s.screen === 'video';
    btn.disabled = !it || onVideo;
    btn.setAttribute('aria-label', s.playing ? 'Pause' : 'Play');
    btn.classList.toggle('is-playing', s.playing);
    title.textContent = it ? it.title : 'Nothing playing';
    bar.classList.toggle('disabled', !it || onVideo);
    led.classList.toggle('on', !!it && (s.playing || onVideo));
    screenToggle.hidden = !(it && it.audio && it.video);
    screenToggle.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === s.screen));
    if (onVideo) time.textContent = 'On screen';
    vol.value = s.volume;
    vol.style.setProperty('--fill', (s.muted ? 0 : s.volume * 100) + '%');
    mute.classList.toggle('muted', s.muted || s.volume === 0);
    mute.setAttribute('aria-label', s.muted ? 'Unmute' : 'Mute');
    mute.classList.toggle('low', s.volume < 0.5);
    volKnob.style.setProperty('--rot', ((s.muted ? 0 : s.volume) * 270 - 135) + 'deg');
    scopeKnob.style.setProperty('--rot', s.scope === 'xy' ? '60deg' : '-60deg');
    scopeSel.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.scope === s.scope));
    scopeSel.classList.toggle('off', !!onVideo);
    note.hidden = !(LOCAL_FILE && it && !onVideo);
    if (!it) { notes.innerHTML = notesIdle; time.textContent = '0:00'; fill.style.width = '0'; }
    if (it) {
      notes.innerHTML = `
        <p class="notes-meta">${CATS[it.cat].name}${it.meta && it.meta !== CATS[it.cat].name ? ' · ' + esc(it.meta) : ''}</p>
        <h2 class="notes-title">${esc(it.title)}</h2>
        ${it.credit ? `<p class="entry-sub">${esc(it.credit)}</p>` : ''}
        <p>${esc(it.desc)}</p>`;
    }
  });
  return {
    tick() {
      if (!state.item || state.screen !== 'waveform') return;
      time.textContent = `${fmt(audio.currentTime)} / ${fmt(audio.duration)}`;
      fill.style.width = audio.duration ? (audio.currentTime / audio.duration * 100) + '%' : '0';
    }
  };
})();

/* ============================================================
   Cassette shelf (VHS for anything with a picture)
   ============================================================ */

function buildShelf(root) {
  root.innerHTML = shelfHTML();
  const tapes = new Map();
  root.querySelectorAll('.tape').forEach(t => {
    const it = ITEMS.find(i => i.id === t.dataset.id);
    t.addEventListener('click', () => select(it));
    tapes.set(it, t);
  });
  listeners.push(s => tapes.forEach((el, it) => {
    el.classList.toggle('active', s.item === it);
    el.classList.toggle('spinning', s.item === it && (s.playing || s.screen === 'video'));
  }));
  return {};
}

/* ---------- Build ---------- */

buildShelf($('#shelf'));
notify();

/* ---------- Loop ---------- */

(function loop() {
  tv.draw(); transport.tick();
  requestAnimationFrame(loop);
})();

document.addEventListener('keydown', e => {
  const pg = document.documentElement.dataset.page;
  if (pg && pg !== 'music.html') return;                            // another page is showing
  if ((e.target === document.body || e.target.classList.contains('slide')) && e.key === 'm') toggleMute();
  if (e.code === 'Space' && (e.target === document.body || e.target.classList.contains('slide')) && state.item && state.screen === 'waveform') { e.preventDefault(); toggle(); }
});

/* ---------- Play in background ----------
   Off (default): leaving the music page pauses the tape (a video is switched off).
   On: music keeps playing while you browse the other pages. Remembered per visitor. */
const bgSwitch = $('#bg-play');
let playInBackground = store.get('music-bg', '0') === '1';
if (bgSwitch) {
  bgSwitch.checked = playInBackground;
  bgSwitch.addEventListener('change', () => { playInBackground = bgSwitch.checked; store.set('music-bg', playInBackground ? '1' : '0'); });
}
new MutationObserver(() => {
  const pg = document.documentElement.dataset.page;
  if (!pg || pg === 'music.html' || playInBackground || !state.item) return;
  if (state.screen === 'video') stop();
  else if (state.playing) pause();
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-page'] });

/* sticky offset on small screens */
const setHeaderH = () => document.documentElement.style.setProperty('--header-h', $('.site-header').offsetHeight + 'px');
setHeaderH(); window.addEventListener('resize', setHeaderH);

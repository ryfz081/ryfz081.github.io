/* ------------------------------------------------------------
   Shelf data + tape markup, shared by the music page (music.js) and the
   page-slider previews (site.js). Reads SHELVES/TRACKS from tracks.js.
   ------------------------------------------------------------ */
const CATS = Object.fromEntries(Object.entries(SHELVES).map(([k, s]) => [k, { name: s.name, color: s.color }]));
const youtubeId = v => {
  if (!v) return null;
  const m = String(v).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : String(v).trim();
};
const ITEMS = TRACKS
  .filter(t => {
    const ok = t.title && SHELVES[t.shelf] && (t.audio || t.youtube);
    if (!ok) console.warn('tracks.js: skipped an entry (needs title, a valid shelf, and audio or youtube):', t);
    return ok;
  })
  .map((t, i) => ({
    id: t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + i,
    n: i + 1,
    cat: t.shelf,
    title: t.title,
    meta: t.label,
    credit: t.credit,
    desc: t.description || '',
    audio: t.audio,
    youtube: youtubeId(t.youtube),
    portrait: !!t.vertical,
    video: !!t.youtube,
  }));


const shelfEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const shelfPad = n => String(n).padStart(2, '0');

function tapeHTML(it) {
  const cat = CATS[it.cat];
  const inner = it.video
    ? `<span class="vhs-label"><b>${shelfEsc(it.title)}</b><small>${shelfPad(it.n)} · ${it.portrait ? 'Short' : 'VHS'}</small></span>
       <span class="vhs-window"><i class="reel"></i><i class="reel"></i></span>`
    : `<span class="tape-label"><b>${shelfEsc(it.title)}</b></span>
       <span class="tape-window"><i class="reel"></i><i class="reel"></i></span>
       <span class="tape-foot"></span>`;
  return `<button class="${it.video ? 'tape vhs' : 'tape'}" data-id="${it.id}" style="--cat:${cat.color}" title="${shelfEsc(it.title)}" aria-label="${it.video ? 'Video' : 'Tape'}: ${shelfEsc(it.title)}">${inner}</button>`;
}

function shelfHTML() {
  return '<div class="shelf">' + Object.entries(CATS).map(([key, cat]) => {
    const items = ITEMS.filter(i => i.cat === key);
    if (!items.length) return '';
    return `<section class="shelf-row"><p class="eyebrow">${shelfEsc(cat.name)}</p><div class="plank">${items.map(tapeHTML).join('')}</div></section>`;
  }).join('') + '</div>';
}

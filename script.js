const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ogni pagina si apre dall'inizio, senza riprendere lo scorrimento precedente
// (tranne i link a una sezione, come #contatti)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const toTop = () => { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
toTop();
addEventListener('load', () => { toTop(); setTimeout(toTop, 100); });

// Tema chiaro/scuro: segue il sistema finché non scegli tu.
// Se torni sulla stessa modalità del sistema, la scelta si azzera e il sito torna automatico.
const root = document.documentElement;
const themeBtn = document.querySelector('.theme');
const sysDark = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (root.dataset.theme || (sysDark.matches ? 'dark' : 'light')) === 'dark';
const syncTheme = () => { if (themeBtn) themeBtn.setAttribute('aria-pressed', String(isDark())); };
if (themeBtn) {
  syncTheme();
  themeBtn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    const system = sysDark.matches ? 'dark' : 'light';
    try {
      if (next === system) { delete root.dataset.theme; localStorage.removeItem('theme'); }
      else { root.dataset.theme = next; localStorage.setItem('theme', next); }
    } catch (e) { root.dataset.theme = next; }
    syncTheme();
  });
  sysDark.addEventListener('change', syncTheme);
}

// Menu delle lingue: si apre dal globo, si chiude cliccando fuori o con Esc
const langBtn = document.querySelector('.lang-btn');
const langList = document.getElementById('langs');
if (langBtn && langList) {
  const setOpen = (open) => { langList.hidden = !open; langBtn.setAttribute('aria-expanded', String(open)); };
  langBtn.addEventListener('click', () => {
    setOpen(langList.hidden);
    if (!langList.hidden) (langList.querySelector('[aria-current]') || langList.querySelector('a')).focus();
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.lang')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !langList.hidden) { setOpen(false); langBtn.focus(); } });
}

// Home: il nome sale lettera per lettera e riempie esattamente la larghezza
const name = document.querySelector('.name');
if (name) {
  const text = name.getAttribute('aria-label');
  [...text].forEach((ch, i) => {
    const s = document.createElement('span');
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch === ' ' ? ' ' : ch;
    s.style.animationDelay = (0.15 + i * 0.035) + 's';
    name.appendChild(s);
  });
  const fit = () => {
    const box = name.parentElement;
    const w = box.clientWidth - parseFloat(getComputedStyle(box).paddingLeft) * 2;
    name.style.fontSize = '100px';
    name.style.fontSize = (100 * w / name.offsetWidth) + 'px';
  };
  fit();
  document.fonts.ready.then(fit);
  addEventListener('resize', fit);
}

// Home: filtri per disciplina
const filters = document.querySelectorAll('.filters button');
const rows = [...document.querySelectorAll('.row')];
filters.forEach((btn) => {
  const f = btn.dataset.f;
  const n = f === 'all' ? rows.length : rows.filter(r => r.dataset.cat === f).length;
  btn.insertAdjacentHTML('beforeend', `<sup>${n}</sup>`);
  btn.addEventListener('click', () => {
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    rows.forEach(r => { r.hidden = f !== 'all' && r.dataset.cat !== f; });
  });
});

// Home: copertina del progetto. Su telefono è fissa dentro ogni riga,
// con il mouse compare al passaggio e segue il cursore.
const coverLabel = { en: 'Cover', de: 'Titelbild' }[root.lang] || 'Copertina';
const cover = (r) => r.dataset.img
  ? `url("${r.dataset.img}") center / cover`
  : `linear-gradient(160deg, ${r.dataset.c || '#ff4f00'} 0 62%, #0b0b0c 62%)`;
rows.forEach((r) => {
  const t = document.createElement('span');
  t.className = 'thumb mono';
  t.setAttribute('aria-hidden', 'true');
  t.style.background = cover(r);
  if (!r.dataset.img) t.textContent = coverLabel;
  r.prepend(t);
});

const pv = document.querySelector('.preview');
if (pv && rows.length && matchMedia('(hover: hover)').matches) {
  rows.forEach((r, i) => {
    const card = document.createElement('i');
    card.className = 'mono';
    card.style.background = cover(r);
    if (!r.dataset.img) card.textContent = coverLabel + ' · ' + r.querySelector('h3').textContent;
    pv.appendChild(card);
    r.addEventListener('mouseenter', () => {
      pv.classList.add('on');
      [...pv.children].forEach((c, j) => c.classList.toggle('on', j === i));
    });
    r.addEventListener('mouseleave', () => pv.classList.remove('on'));
  });
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  addEventListener('mousemove', (e) => { tx = e.clientX + innerWidth * .14; ty = e.clientY; });
  (function loop() {
    x += (tx - x) * (reduceMotion ? 1 : .12);
    y += (ty - y) * (reduceMotion ? 1 : .12);
    pv.style.left = x + 'px';
    pv.style.top = y + 'px';
    requestAnimationFrame(loop);
  })();
}

// Schema della navigazione (Club Deal): le linee collegano ogni etichetta ai pallini
// sul menu dello screenshot. Si ridisegnano quando cambiano dimensioni o lingua,
// così seguono la lunghezza dei testi. Su telefono restano solo i pallini colorati.
document.querySelectorAll('[data-navmap]').forEach((map) => {
  const svg = map.querySelector('.navmap__lines');
  const shot = map.querySelector('.navmap__shot img');
  const groups = [...map.querySelectorAll('.navmap__group')];
  const NS = 'http://www.w3.org/2000/svg';
  const DOT_X = 1.35;                       // % della larghezza dell'immagine
  const BUS = [0.3, 0.55, 0.8, 0.55];       // posizione della linea verticale nello spazio libero
  groups.forEach((g) => g.querySelector('.navmap__pill').style.setProperty('--c', g.dataset.color));
  const draw = () => {
    const box = map.getBoundingClientRect();
    const img = shot.getBoundingClientRect();
    const stacked = matchMedia('(max-width: 760px)').matches;
    const textRight = Math.max(...groups.map((g) => g.getBoundingClientRect().right)) - box.left;
    const gap = img.left - box.left - textRight;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();
    groups.forEach((g, i) => {
      const color = g.dataset.color;
      const pill = g.querySelector('.navmap__pill').getBoundingClientRect();
      const sx = pill.right - box.left + 10, sy = pill.top + pill.height / 2 - box.top;
      const bx = img.left - box.left - gap * BUS[i];
      g.dataset.dots.split(' ').map(Number).forEach((pct) => {
        const dx = img.left - box.left + img.width * DOT_X / 100;
        const dy = img.top - box.top + img.height * pct / 100;
        if (!stacked) {
          const path = document.createElementNS(NS, 'path');
          path.setAttribute('d', `M${sx} ${sy} H${bx} V${dy} H${dx}`);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', color);
          path.setAttribute('stroke-width', '1.6');
          path.setAttribute('stroke-linejoin', 'round');
          if (g.hasAttribute('data-dashed')) path.setAttribute('stroke-dasharray', '6 5');
          svg.appendChild(path);
        }
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', dx); dot.setAttribute('cy', dy); dot.setAttribute('r', stacked ? 3.5 : 4.5);
        dot.setAttribute('fill', color);
        svg.appendChild(dot);
      });
    });
  };
  if (shot.complete) draw(); else shot.addEventListener('load', draw);
  document.fonts && document.fonts.ready.then(draw);
  new ResizeObserver(draw).observe(map);
});

// Comparsa morbida di blocchi e immagini
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.block, .media, .figs, .stats, .next').forEach((el) => {
    el.classList.add('reveal');
    io.observe(el);
  });
}

// Anno nel footer
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

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
const applyFilter = (btn) => {
  const f = btn.dataset.f;
  filters.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  rows.forEach(r => { r.hidden = f !== 'all' && r.dataset.cat !== f; });
};
filters.forEach((btn) => {
  const f = btn.dataset.f;
  const n = f === 'all' ? rows.length : rows.filter(r => r.dataset.cat === f).length;
  btn.insertAdjacentHTML('beforeend', `<sup>${n}</sup>`);
  btn.addEventListener('click', () => applyFilter(btn));
});
// Filtro attivo all'apertura: quello con aria-pressed="true" nell'HTML (oggi UI/UX)
const startFilter = [...filters].find(b => b.getAttribute('aria-pressed') === 'true');
if (startFilter) applyFilter(startFilter);

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
  t.style.background = r.dataset.thumb ? `url("${r.dataset.thumb}") center / cover` : cover(r);
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

// Schemi di Club Deal: le linee collegano ogni etichetta ai pallini sull'immagine
// indicata da data-target. Si ridisegnano quando cambiano dimensioni o lingua, così
// seguono la lunghezza dei testi. Il colore "ink" segue il tema chiaro/scuro.
// Su telefono restano solo i pallini colorati.
document.querySelectorAll('[data-navmap]').forEach((map) => {
  const svg = map.querySelector('.navmap__lines');
  const shot = map.querySelector('[data-target]');
  const groups = [...map.querySelectorAll('.navmap__group')];
  const NS = 'http://www.w3.org/2000/svg';
  const DOT_X = parseFloat(map.dataset.dotX ?? '1.35');  // % della larghezza dell'immagine
  const BUS = [0.3, 0.55, 0.8, 0.55];                     // posizione delle linee verticali nello spazio libero
  const paint = (c) => (c === 'ink' ? 'var(--ink)' : c);
  groups.forEach((g) => g.querySelector('.navmap__pill').style.setProperty('--c', paint(g.dataset.color)));
  const draw = () => {
    const box = map.getBoundingClientRect();
    const img = shot.getBoundingClientRect();
    const stacked = matchMedia('(max-width: 760px)').matches;
    const textRight = Math.max(...groups.map((g) => g.getBoundingClientRect().right)) - box.left;
    const dotX = img.left - box.left + img.width * DOT_X / 100;
    const gap = dotX - textRight;
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();
    groups.forEach((g, i) => {
      const color = paint(g.dataset.color);
      const pill = g.querySelector('.navmap__pill').getBoundingClientRect();
      const sx = pill.right - box.left + 10, sy = pill.top + pill.height / 2 - box.top;
      const bx = dotX - gap * BUS[i];
      g.dataset.dots.split(' ').map(Number).forEach((pct) => {
        const dy = img.top - box.top + img.height * pct / 100;
        if (!stacked) {
          const path = document.createElementNS(NS, 'path');
          path.setAttribute('d', `M${sx} ${sy} H${bx} V${dy} H${dotX}`);
          path.setAttribute('fill', 'none');
          path.style.stroke = color;
          path.setAttribute('stroke-width', '1.6');
          path.setAttribute('stroke-linejoin', 'round');
          if (g.hasAttribute('data-dashed')) path.setAttribute('stroke-dasharray', '6 5');
          svg.appendChild(path);
        }
        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', stacked ? Math.max(dotX, 6) : dotX); dot.setAttribute('cy', dy);
        dot.setAttribute('r', stacked ? 3.5 : 4.5);
        dot.style.fill = color;
        svg.appendChild(dot);
      });
    });
  };
  if (shot.complete) draw(); else shot.addEventListener('load', draw);
  document.fonts && document.fonts.ready.then(draw);
  new ResizeObserver(draw).observe(map);
});

// Schema "Come uso l'AI": interruttore Prima / Con l'AI.
// La prima volta che entra nello schermo parte da "Prima" e si trasforma da solo in "Con l'AI"
document.querySelectorAll('[data-process]').forEach((fig) => {
  const buttons = fig.querySelectorAll('.process__switch button');
  let touched = false;
  const set = (mode) => {
    fig.dataset.mode = mode;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  };
  buttons.forEach(b => b.addEventListener('click', () => { touched = true; set(b.dataset.mode); }));
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  set('prima');
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();
    setTimeout(() => { if (!touched) set('ai'); }, 900);
  }, { threshold: 0.5 });
  io.observe(fig.querySelector('.process__chart'));
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



// Hoomie: cursore tra la schermata del proprietario e quella del fuorisede
document.querySelectorAll('[data-users]').forEach((box) => {
  const shot = box.querySelector('.users__shot');
  const range = box.querySelector('.users__range');
  const sides = box.querySelectorAll('.users__side');
  const set = (v) => {
    shot.style.setProperty('--pos', v + '%');
    sides.forEach(s => s.classList.toggle('is-on', s.dataset.side === 'owner' ? v >= 60 : v <= 40));
  };
  range.addEventListener('input', () => set(+range.value));
  set(+range.value);
});


// Hoomie: carosello degli archetipi. Scorre piano da sinistra a destra; si trascina col dito o col mouse.
// Le carte lontane dal centro si rimpiccioliscono e spariscono dietro.
document.querySelectorAll('[data-arch]').forEach((box) => {
  const cards = [...box.querySelectorAll('.arch__card')];
  const n = cards.length;
  let t = 0, vel = 0, dragging = false, hover = false, lastX = 0, lastT = 0, resumeAt = 0, visible = true;
  const speed = reduceMotion ? 0 : 0.22;           // carte al secondo
  const wrap = (d) => ((d % n) + n) % n > n / 2 ? ((d % n) + n) % n - n : ((d % n) + n) % n;
  const layout = () => {
    const w = cards[0].offsetWidth, gap = w * 0.66;
    cards.forEach((c, i) => {
      const d = wrap(i - t), a = Math.abs(d);
      const x = Math.sign(d) * gap * (a <= 1 ? a : 1 + (a - 1) * 0.72);
      const s = 1 - 0.17 * Math.min(a, 3);
      c.style.transform = `translateX(calc(-50% + ${x}px)) scale(${s})`;
      c.style.opacity = a < 1.9 ? 1 : Math.max(0, 1 - (a - 1.9) * 1.8);
      c.style.zIndex = 100 - Math.round(a * 10);
      c.setAttribute('aria-hidden', a > 0.5 ? 'true' : 'false');
    });
  };
  let prev = performance.now();
  const tick = (now) => {
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    if (!dragging) {
      if (Math.abs(vel) > 0.01) { t += vel * dt; vel *= Math.pow(0.04, dt); }
      else if (!hover && visible && now > resumeAt) t -= speed * dt;
    }
    layout();
    requestAnimationFrame(tick);
  };
  box.addEventListener('pointerdown', (e) => { dragging = true; vel = 0; lastX = e.clientX; lastT = performance.now(); box.setPointerCapture(e.pointerId); });
  box.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const gap = cards[0].offsetWidth * 0.66, now = performance.now();
    const dx = e.clientX - lastX; t -= dx / gap;
    vel = -dx / gap / Math.max(0.016, (now - lastT) / 1000);
    lastX = e.clientX; lastT = now;
  });
  const end = () => { if (!dragging) return; dragging = false; resumeAt = performance.now() + 1500; };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  box.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hover = true; });
  box.addEventListener('pointerleave', () => { hover = false; });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { vel = 4; resumeAt = performance.now() + 3000; }
    if (e.key === 'ArrowRight') { vel = -4; resumeAt = performance.now() + 3000; }
  });
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(box);
  layout(); requestAnimationFrame(tick);
});

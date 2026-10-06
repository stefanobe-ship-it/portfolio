const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ogni pagina si apre dall'inizio, senza riprendere lo scorrimento precedente
// (tranne i link a una sezione, come #contatti)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const toTop = () => { if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); };
toTop();
addEventListener('load', () => { toTop(); setTimeout(toTop, 100); });

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
const cover = (r) => r.dataset.img
  ? `url("${r.dataset.img}") center / cover`
  : `linear-gradient(160deg, ${r.dataset.c || '#ff4f00'} 0 62%, #0b0b0c 62%)`;
rows.forEach((r) => {
  const t = document.createElement('span');
  t.className = 'thumb mono';
  t.setAttribute('aria-hidden', 'true');
  t.style.background = cover(r);
  if (!r.dataset.img) t.textContent = 'Copertina';
  r.prepend(t);
});

const pv = document.querySelector('.preview');
if (pv && rows.length && matchMedia('(hover: hover)').matches) {
  rows.forEach((r, i) => {
    const card = document.createElement('i');
    card.className = 'mono';
    card.style.background = cover(r);
    if (!r.dataset.img) card.textContent = 'Copertina · ' + r.querySelector('h3').textContent;
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

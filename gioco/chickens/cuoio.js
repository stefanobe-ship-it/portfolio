/* =====================================================================================================
   Kit «cuoio» — disegno degli elementi (16/11/2026, seconda stesura, Chickens don't fly)
   Ogni elemento con data-cu="…" viene disegnato ALLA SUA MISURA come immagine vettoriale (SVG).
   Riferimento: le immagini di Gemini in originali, file ui-…jpg, (ritagli in prove/rif/), confrontate
   affiancate nella pagina prove/confronto.html.
   Metodo (niente luce calcolata, che faceva strisce): livelli sfumati
     1) colore di base con sfumatura a molte tappe (niente gradini);
     2) scurimento morbido verso il bordo, nella stessa tinta (l'«imbottitura»);
     3) solo su arancio e verde: lucido nella metà alta, sfumato, più un filo di luce;
     4) cuoio con grana; cucitura tratteggiata con la sua ombra, che segue il contorno.
   Raccordi a supercerchio. Si ridisegna da solo quando cambia misura.

   Tipi:  data-cu="pulsante arancio|cuoio|verde"   data-cu="tondo"   data-cu="riquadro"   data-cu="riquadro sottile"
          data-cu="tasto"   data-cu="contatore"   data-cu="piu"   data-cu="pallino"   data-cu="barra" (style="--pieno:.6")
          data-cu="interruttore" (classe .acceso).   Premuto: automatico al tocco.   Spento: attributo disabled.
   ===================================================================================================== */
(() => {
  // ---------- colori (presi dalle immagini di riferimento) ----------
  const C = {
    cornice:  ['#a05c3a', '#8a4a2e', '#703a22'],   // cuoio scuro del bordo dei pulsanti
    fianco:   '#4f230f',
    cuoio:    ['#ad6646', '#9a5538', '#7f432a'],   // faccia del pulsante di cuoio
    corniceCuoio: ['#a05b3c', '#8c4c31', '#733d26'],
    tan:      ['#c26a36', '#aa5529', '#8c431e'],   // cuoio naturale: bordo di riquadri, tondi, contatori
    fiancoTan:'#6e3517',
    crema:    ['#fdf4de', '#f6e8c8', '#ebd5aa'],
    arancio:  ['#faa84f', '#ec842e', '#d26318'],
    verde:    ['#a6d26c', '#89bf4f', '#679a33'],
    rosso:    ['#f2584c', '#d8332e', '#ad211c'],
    pista:    ['#4a2412', '#5a2d17', '#4a2412'],
    filoChiaro: '#f1d3a0', filoCrema: '#e9c99a', filoTan: '#d9a877', filoScuro: '#7a3c18',
  };

  // ---------- geometria: supercerchio ----------
  // rettangolo w×h con raccordi «lisci»; esponente 4 negli angoli, quasi cerchio (2.2) nelle pillole
  function sq(x, y, w, h, r, n) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (n === undefined) n = r >= Math.min(w, h) / 2 - .5 ? 2.2 : 4;
    const R = n > 2.5 ? Math.min(r * 1.35, w / 2, h / 2) : r, passi = 12, pts = [];
    const ang = (cx, cy, sx, sy) => {
      const p = [];
      for (let i = 0; i <= passi; i++) {
        const t = (i / passi) * Math.PI / 2;
        p.push([cx + sx * R * (1 - Math.pow(Math.cos(t), 2 / n)), cy + sy * R * (1 - Math.pow(Math.sin(t), 2 / n))]);
      }
      return p;
    };
    ang(x, y, 1, 1).forEach(q => pts.push(q));
    ang(x + w, y, -1, 1).reverse().forEach(q => pts.push(q));
    ang(x + w, y + h, -1, -1).forEach(q => pts.push(q));
    ang(x, y + h, 1, -1).reverse().forEach(q => pts.push(q));
    return 'M' + pts.map(q => q[0].toFixed(2) + ' ' + q[1].toFixed(2)).join('L') + 'Z';
  }
  // ---------- raccordi: scala unica (multipli di 4) e regola concentrica (16/11, Stefano) ----------
  // ogni forma usa un valore della scala, mai un valore calcolato sulla sua misura; i livelli interni
  // (cucitura, faccia, lucido) usano il raggio esterno MENO la loro distanza dal bordo, mai lo stesso valore.
  const RAGGI = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 };
  // raggio di un contorno interno a distanza «d» da uno esterno di raggio R (per i supercerchi la curva si estende 1,35×)
  const interno = (R, d, pillola) => Math.max(2, pillola ? R - d : R - d / 1.35);
  const cerchio = (cx, cy, r) => `M${(cx - r).toFixed(2)} ${cy.toFixed(2)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

  // ---------- colori: sfumature a molte tappe, senza gradini ----------
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const liscio = t => t * t * (3 - 2 * t);
  function tappe(cols, pos) {   // cols: 3 colori (alto, centro, basso); pos: dove sta il centro (0-1)
    pos = pos ?? .5; let s = '';
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, c = t <= pos ? mix(cols[0], cols[1], liscio(t / pos)) : mix(cols[1], cols[2], liscio((t - pos) / (1 - pos)));
      s += `<stop offset="${t.toFixed(3)}" stop-color="${c}"/>`;
    }
    return s;
  }

  // ---------- trama del cuoio: pelle a celle (come il cuoio martellato), generata una volta, nitida ovunque ----------
  let tramaURL = null;
  function trama() {
    if (tramaURL) return tramaURL;
    const N = 256, G = 34, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(N, N), pt = [];
    let seme = 7; const rnd = () => (seme = (seme * 16807) % 2147483647) / 2147483647;
    const cel = N / G;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) pt.push([(i + .15 + rnd() * .7) * cel, (j + .15 + rnd() * .7) * cel, rnd()]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const ci = Math.floor(x / cel), cj = Math.floor(y / cel); let d1 = 1e9, d2 = 1e9, v = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ii = (ci + di + G) % G, jj = (cj + dj + G) % G, q = pt[jj * G + ii];
        const px = q[0] + (ci + di < 0 ? -N : ci + di >= G ? N : 0), py = q[1] + (cj + dj < 0 ? -N : cj + dj >= G ? N : 0);
        const d = Math.hypot(x - px, y - py);
        if (d < d1) { d2 = d1; d1 = d; v = q[2]; } else if (d < d2) d2 = d;
      }
      const piega = Math.max(0, 1 - (d2 - d1) / 1.4) * (.35 + .65 * v);   // solchi irregolari: alcuni appena accennati            // solchi tra le celle: scuri
      const cupola = Math.max(0, 1 - d1 / (cel * .75));           // centro delle celle: appena più chiaro
      const k = (y * N + x) * 4;
      if (piega > cupola * .5) { img.data[k] = 40; img.data[k + 1] = 16; img.data[k + 2] = 4; img.data[k + 3] = Math.round(70 * piega + 10 * v); }
      else { img.data[k] = 255; img.data[k + 1] = 236; img.data[k + 2] = 210; img.data[k + 3] = Math.round(26 * cupola * (.6 + .4 * v)); }
    }
    ctx.putImageData(img, 0, 0);
    return (tramaURL = cv.toDataURL('image/png'));
  }

  // ---------- costruttore di un disegno ----------
  function Disegno(W, H) {
    let defs = '', corpo = '', n = 0;
    const id = p => p + (++n);
    return {
      add: s => { corpo += s; },
      grad(cols, pos) { const i = id('g'); defs += `<linearGradient id="${i}" x1="0" y1="0" x2="0" y2="1">${tappe(cols, pos)}</linearGradient>`; return `url(#${i})`; },
      gradX(cols, pos) { const i = id('x'); defs += `<linearGradient id="${i}" x1="0" y1="0" x2="1" y2="0">${tappe(cols, pos)}</linearGradient>`; return `url(#${i})`; },
      gradA(col, a1, a2, y1 = 0, y2 = 1) { const i = id('a'); defs += `<linearGradient id="${i}" x1="0" y1="${y1}" x2="0" y2="${y2}">${[0, .25, .5, .75, 1].map(t => `<stop offset="${t}" stop-color="${col}" stop-opacity="${(a1 + (a2 - a1) * liscio(t)).toFixed(3)}"/>`).join('')}</linearGradient>`; return `url(#${i})`; },
      sfoca(s) { const i = id('b'); defs += `<filter id="${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${Math.max(.3, s).toFixed(2)}"/></filter>`; return `url(#${i})`; },
      clip(d) { const i = id('k'); defs += `<clipPath id="${i}"><path d="${d}"/></clipPath>`; return `url(#${i})`; },
      grana(forza, scala = 1) { const i = id('n'), t = 64 * scala; defs += `<pattern id="${i}" patternUnits="userSpaceOnUse" width="${t}" height="${t}"><image href="${trama()}" width="${t}" height="${t}"/></pattern>`; return { fill: `url(#${i})`, op: Math.min(1, forza * .95) }; },
      svg(px, spento) {
        const f = spento ? '<filter id="spento"><feColorMatrix type="saturate" values=".2"/><feComponentTransfer><feFuncA type="linear" slope=".6"/></feComponentTransfer></filter>' : '';
        const c = spento ? `<g filter="url(#spento)">${corpo}</g>` : corpo;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * px}" height="${H * px}" viewBox="0 0 ${W} ${H}"><defs>${defs}${f}</defs>${c}</svg>`;
      },
    };
  }

  // ---------- livelli ----------
  // superficie: colore di base + scurimento morbido al bordo (stessa tinta) + luce morbida in alto + (lucido)
  function superficie(D, d, box, cols, o = {}) {
    const [x, y, w, h] = box, m = Math.min(w, h), k = D.clip(d);
    let s = `<path d="${d}" fill="${D.grad(cols, o.centro ?? .45)}"/>`;
    if (o.grana) { const g = D.grana(o.grana, o.scalaGrana || 1); s += `<path d="${d}" fill="${g.fill}" fill-opacity="${g.op}"/>`; }
    const bordo = (o.bordo ?? .16) * m;   // imbottitura: bordo scuro sfumato verso l'interno, nella tinta più scura
    s += `<path d="${d}" fill="none" stroke="${o.ombraCol || cols[2]}" stroke-width="${bordo}" stroke-opacity="${o.ombra ?? .75}" filter="${D.sfoca(bordo * .45)}" clip-path="${k}"/>`;
    if (o.luce !== 0) s += `<path d="${d}" fill="${D.gradA('#ffffff', o.luce ?? .22, 0, 0, .55)}" clip-path="${k}"/>`;   // luce morbida dall'alto
    if (o.lucido) {   // arancio e verde: zona lucida nella metà alta, bordo inferiore sfumato, più un filo di luce
      const lx = o.lx ?? .045, ix = x + w * lx, iw = w - 2 * w * lx, iy = y + h * .06, ih = h * .47;
      const rf = o.raggio ?? h / 2, pill = rf >= Math.min(w, h) / 2 - .5;
      s += `<path d="${sq(ix, iy, iw, ih, Math.min(ih / 2, interno(rf, h * .06, pill)))}" fill="${D.gradA('#fff4de', o.lucido, o.lucido * .62)}" clip-path="${k}"/>`;   // zona lucida quasi uniforme, calda, bordo netto (niente sfocatura: Safari la fa a bassa risoluzione)
      const fx = x + Math.max(w * .06, h * .3), fw = w - 2 * (fx - x);
      if (fw > 0 && o.filo !== 0) s += `<path d="${sq(fx, y + h * .085, fw, h * .045, h * .0225)}" fill="#fff" fill-opacity="${o.filo ?? .55}" clip-path="${k}"/>`;
    }
    if (o.contorno) s += `<path d="${d}" fill="none" stroke="${o.contorno}" stroke-width="${Math.max(.8, m * .012)}" stroke-opacity=".55"/>`;
    D.add(s);
  }
  // ombra sotto una faccia incassata nel bordo (la separa dal bordo, come nel riferimento)
  function stacco(D, d, m, forza = .5) { D.add(`<path d="${d}" fill="none" stroke="#2a1006" stroke-width="${Math.max(1.4, m * .03)}" stroke-opacity="${forza}" filter="${D.sfoca(m * .012)}"/>`); }
  // cucitura: punti lunghi con angoli tondi, ombra sotto
  function cucitura(D, d, col, sp, lun, opac = 1) {
    D.add(`<path d="${d}" fill="none" stroke="#2a1006" stroke-opacity="${.35 * opac}" stroke-width="${sp}" stroke-dasharray="${lun} ${lun * .62}" stroke-linecap="round" transform="translate(0 ${(sp * .55).toFixed(2)})"/>
      <path d="${d}" fill="none" stroke="${col}" stroke-opacity="${opac}" stroke-width="${sp}" stroke-dasharray="${lun} ${lun * .62}" stroke-linecap="round"/>`);
  }

  // ---------- i tipi ----------
  function disegna(el, premuto) {
    const tipi = el.dataset.cu.split(/\s+/), tipo = tipi[0];
    const W = el.offsetWidth, H = el.offsetHeight; if (!W || !H) return null;
    const D = Disegno(W, H); let fianco = 0;

    if (tipo === 'pulsante') {
      // riferimento: bordo di cuoio scuro ~9% dell'altezza, spessore sotto ~8%, cucitura sul bordo a ~40% dal margine
      fianco = Math.round(H * .065); const h = H - fianco, dy = premuto ? fianco * .7 : 0, r = h / 2;
      const cuoio = tipi.includes('cuoio'), col = tipi.includes('verde') ? C.verde : C.arancio;
      D.add(`<path d="${sq(0, fianco, W, h, r)}" fill="${cuoio ? '#5e2c14' : '#5b2a12'}"/>`);
      D.add(`<g transform="translate(0 ${dy})">`);
      const b = h * (cuoio ? .06 : .09);
      superficie(D, sq(0, 0, W, h, r), [0, 0, W, h], cuoio ? C.corniceCuoio : C.cornice, { grana: .55, bordo: .08, ombra: .45, luce: .15, ombraCol: '#4a200b' });
      if (cuoio) {
        const df = sq(b, b, W - 2 * b, h - 2 * b, r - b);
        stacco(D, df, h, .18);
        superficie(D, df, [b, b, W - 2 * b, h - 2 * b], C.cuoio, { grana: .42, bordo: .14, ombra: .6, luce: .16, ombraCol: '#6a3016' });
        const c = h * .155; cucitura(D, sq(c, c, W - 2 * c, h - 2 * c, r - c), C.filoChiaro, h * .032, h * .085);
      } else {
        cucitura(D, sq(b * .42, b * .42, W - b * .84, h - b * .84, r - b * .42), '#e7bf8a', Math.max(1, h * .017), h * .048, .9);
        const df = sq(b, b, W - 2 * b, h - 2 * b, r - b);
        stacco(D, df, h, .55);
        superficie(D, df, [b, b, W - 2 * b, h - 2 * b], col, { bordo: .15, ombra: .7, luce: 0, lucido: .42, filo: .38, lx: .05, raggio: r - b, contorno: col[2], centro: .5 });
      }
      D.add('</g>');
    } else if (tipo === 'tondo') {
      // solo Negozio e Sfide: bordo di cuoio naturale con cucitura, cuscino crema opaco; spessore sotto sottile (16/11 Stefano: niente secondo strato con la seconda cucitura)
      fianco = Math.round(Math.min(W, H) * .07); const d = Math.min(W, H - fianco), cx = W / 2, r = d / 2, dy = premuto ? fianco * .7 : 0;
      D.add(`<path d="${cerchio(cx, r + fianco, r)}" fill="${C.fiancoTan}"/>`);
      D.add(`<g transform="translate(0 ${dy})">`);
      superficie(D, cerchio(cx, r, r), [cx - r, 0, d, d], C.tan, { grana: .5, bordo: .12, ombra: .55, luce: .2, contorno: '#5a2610' });
      cucitura(D, cerchio(cx, r, r * .865), C.filoCrema, Math.max(1, d * .011), d * .035, .85);
      stacco(D, cerchio(cx, r, r * .78), d, .65);
      superficie(D, cerchio(cx, r, r * .78), [cx - r * .78, r - r * .78, r * 1.56, r * 1.56], C.crema, { bordo: .22, ombra: .55, luce: .3, centro: .42, ombraCol: '#d2ad78' });
      D.add('</g>');
    } else if (tipo === 'riquadro' || tipo === 'tasto' || tipo === 'contatore') {
      // riferimento: bordo di cuoio naturale ~5,5% del lato, raccordo ~12-17% del lato, cucitura verso il bordo interno, crema opaco imbottito
      const sottile = tipi.includes('sottile'), m0 = Math.min(W, H);
      fianco = Math.round(tipo === 'tasto' ? m0 * .05 : tipo === 'contatore' ? H * .1 : sottile ? 3 : 5);
      const h = H - fianco, m = Math.min(W, h), dy = premuto && tipo === 'tasto' ? fianco * .7 : 0;
      const b = tipo === 'contatore' ? h * .12 : tipo === 'tasto' ? m * .085 : sottile ? 8 : 12;   // bordo dei riquadri fisso (scala da 4): il margine interno in CSS lo somma
      const rv = parseFloat(getComputedStyle(el).getPropertyValue('--raggio'));
      const r = rv > 0 ? rv : tipo === 'contatore' ? RAGGI.m : tipo === 'tasto' ? RAGGI.xxl : sottile ? RAGGI.l : RAGGI.xl;
      D.add(`<path d="${sq(0, fianco, W, h, r)}" fill="${C.fiancoTan}"/>`);
      D.add(`<g transform="translate(0 ${dy})">`);
      superficie(D, sq(0, 0, W, h, r), [0, 0, W, h], C.tan, { grana: .5, bordo: .16, ombra: .7, luce: .24, ombraCol: '#6e3415', contorno: '#5a2610' });   // bordo bombato: luce sul filo alto, scuro verso il contorno
      if (tipo !== 'contatore') cucitura(D, sq(b * .62, b * .62, W - b * 1.24, h - b * 1.24, interno(r, b * .62)), '#e8c48f', Math.max(1, b * .11), Math.max(3.5, b * .42), .9);
      const rFaccia = interno(r, b), df = sq(b, b, W - 2 * b, h - 2 * b, rFaccia);
      stacco(D, df, Math.min(m, 160), .7);
      superficie(D, df, [b, b, W - 2 * b, h - 2 * b], C.crema, { bordo: tipo === 'contatore' ? .26 : .08, ombra: .5, luce: .12, centro: .45, ombraCol: '#cfa66e' });   // card più pulite: imbottitura leggera   // crema liscio, senza grana
      D.add('</g>');
    } else if (tipo === 'piu' || tipo === 'pallino') {
      const d = Math.min(W, H) * .9; fianco = Math.min(W, H) - d; const cx = W / 2, r = d / 2;
      const col = tipo === 'piu' ? C.arancio : C.rosso;
      D.add(`<path d="${cerchio(cx, r + fianco, r)}" fill="${tipo === 'piu' ? C.fianco : '#6e1410'}"/>`);
      if (tipo === 'piu') superficie(D, cerchio(cx, r, r), [cx - r, 0, d, d], C.cornice, { bordo: .1, ombra: .5, luce: .1 });
      const ri = tipo === 'piu' ? r * .78 : r;
      superficie(D, cerchio(cx, r, ri), [cx - ri, r - ri, ri * 2, ri * 2], col, { bordo: .14, ombra: .6, luce: 0, lucido: .5, filo: 0, lx: .14, raggio: ri, contorno: col[2] });
    } else if (tipo === 'barra') {
      // riferimento: pista di cuoio scuro con cucitura; il verde è una gelatina con le estremità piene,
      // alta quasi quanto la pista, con un filo di luce in alto, fascia scura in basso e contorno scuro
      const pieno = Math.max(0, Math.min(1, parseFloat(getComputedStyle(el).getPropertyValue('--pieno')) || 0));
      const r = H / 2, k = D.clip(sq(0, 0, W, H, r));
      superficie(D, sq(0, 0, W, H, r), [0, 0, W, H], C.pista, { grana: .6, bordo: .3, ombra: .9, luce: 0, ombraCol: '#1e0a02' });
      D.add(`<path d="${sq(-W * .02, -H * .55, W * 1.04, H * .95, r)}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="${H * .35}" filter="${D.sfoca(H * .12)}" clip-path="${k}"/>`);
      cucitura(D, sq(H * .17, H * .17, W - H * .34, H * .66, r - H * .17), C.filoChiaro, Math.max(.9, H * .045), H * .2, .55);
      if (pieno > 0) {
        const p = H * .06, hf = H - 2 * p, wf = Math.max(hf, (W - 2 * p) * pieno);
        D.add(`<path d="${sq(p, p + hf * .06, wf, hf, interno(r, p, true))}" fill="#1e0a02" fill-opacity=".45" filter="${D.sfoca(hf * .05)}"/>`);
        superficie(D, sq(p, p, wf, hf, interno(r, p, true)), [p, p, wf, hf], C.verde, { bordo: .24, ombra: .8, luce: 0, lucido: .34, filo: .6, lx: .02, raggio: interno(r, p, true), contorno: '#4f7f22', centro: .38, ombraCol: '#4f8226' });
      }
    } else if (tipo === 'interruttore') {
      // riferimento: bordo di cuoio scuro cucito, pista verde (acceso) o scura (spento), pomello crema imbottito e cucito
      const acceso = el.classList.contains('acceso'); fianco = Math.round(H * .08); const h = H - fianco, r = h / 2, b = h * .13;
      // acceso: nel riferimento è verde anche il bordo; spento: bordo di cuoio scuro
      D.add(`<path d="${sq(0, fianco, W, h, r)}" fill="${acceso ? '#4a7a1e' : C.fianco}"/>`);
      if (acceso) superficie(D, sq(0, 0, W, h, r), [0, 0, W, h], ['#9fce62', '#86bb4b', '#6c9f36'], { bordo: .1, ombra: .5, luce: .16, contorno: '#4f7f22' });
      else superficie(D, sq(0, 0, W, h, r), [0, 0, W, h], C.cornice, { grana: .5, bordo: .1, ombra: .55, luce: .1 });
      cucitura(D, sq(b * .45, b * .45, W - b * .9, h - b * .9, r - b * .45), C.filoCrema, Math.max(.9, h * .025), h * .07, .85);
      const dp = sq(b, b, W - 2 * b, h - 2 * b, r - b);
      stacco(D, dp, h, .6);
      if (acceso) superficie(D, dp, [b, b, W - 2 * b, h - 2 * b], ['#7fb646', '#72a83c', '#649a33'], { bordo: .34, ombra: .8, luce: 0, lucido: .22, filo: 0, raggio: r - b, ombraCol: '#3f6a18' });
      else superficie(D, dp, [b, b, W - 2 * b, h - 2 * b], C.pista, { grana: .5, bordo: .35, ombra: .9, luce: 0, ombraCol: '#1e0a02' });
      const ks = h - 2 * b * .55, kx = acceso ? W - b * .55 - ks : b * .55, ky = b * .55;
      D.add(`<path d="${sq(kx, ky + ks * .07, ks, ks, RAGGI.m)}" fill="#1e0a02" fill-opacity=".45" filter="${D.sfoca(ks * .05)}"/>`);
      superficie(D, sq(kx, ky, ks, ks, RAGGI.m), [kx, ky, ks, ks], C.crema, { grana: .08, bordo: .2, ombra: .6, luce: .3, centro: .4, ombraCol: '#d2ad78' });
      cucitura(D, sq(kx + ks * .15, ky + ks * .15, ks * .7, ks * .7, interno(RAGGI.m, ks * .15)), C.filoTan, Math.max(.8, ks * .03), ks * .08, .8);
    }

    const px = Math.min(3, Math.max(2, window.devicePixelRatio || 2));   // alla risoluzione dello schermo: niente sgranature
    return { url: 'url("data:image/svg+xml,' + encodeURIComponent(D.svg(px, el.disabled)) + '")', fianco };
  }

  /* ---------- tema «nuvola» (16/11 sera) ----------
     Le immagini di Stefano (pillole, cornici, contatore) si disegnano a misura in un canvas, a «nove pezzi»:
     angoli interi, bordi allungati (o ripetuti, per le onde delle schede grandi), centro allungato.
     Prima si usavano border-image e strati di sfondo: su alcuni schermi il centro spariva o le estremità si vedevano sovrapposte. */
  const NU_FILE = { pillola: 'grafiche/nuvola/pillola.png', pesca: 'grafiche/nuvola/pillola-pesca.png', verde: 'grafiche/nuvola/pillola-verde.png',
    alta: 'grafiche/nuvola/cornice-alta.png', larga: 'grafiche/nuvola/cornice-larga.png', contatore: 'grafiche/nuvola/contatore.png' };
  const NU = {};
  function nuImg(k) {
    if (!NU[k]) { const i = new Image(); i.onload = () => document.querySelectorAll('[data-cu]').forEach(aggiorna); i.src = NU_FILE[k]; NU[k] = i; }
    return NU[k].complete && NU[k].naturalWidth ? NU[k] : null;
  }
  // s = tagli nell'immagine [alto, destra, basso, sinistra]; d = misure a schermo; onde = bordi ripetuti invece che allungati
  function noveParti(img, W, H, s, d, onde) {
    const px = Math.min(3, Math.max(2, window.devicePixelRatio || 2)), c = document.createElement('canvas');
    c.width = Math.round(W * px); c.height = Math.round(H * px); const g = c.getContext('2d'); g.scale(px, px); g.imageSmoothingQuality = 'high';
    const iw = img.naturalWidth, ih = img.naturalHeight, [st, sr, sb, sl] = s, [dt, dr, db, dl] = d;
    const sx = [0, sl, iw - sr, iw], sy = [0, st, ih - sb, ih], dx = [0, dl, W - dr, W], dy = [0, dt, H - db, H];
    const pezzo = (a, b, x0, x1, y0, y1) => { if (sx[a + 1] - sx[a] <= 0 || sy[b + 1] - sy[b] <= 0 || x1 - x0 <= 0 || y1 - y0 <= 0) return;
      g.drawImage(img, sx[a], sy[b], sx[a + 1] - sx[a], sy[b + 1] - sy[b], x0, y0, x1 - x0, y1 - y0); };
    for (let b = 0; b < 3; b++) for (let a = 0; a < 3; a++) {
      const x0 = dx[a], x1 = dx[a + 1], y0 = dy[b], y1 = dy[b + 1];
      if (onde && a === 1 && b !== 1) {   // bordo alto e basso: tante onde intere quante ci stanno (i lati si allungano: ripetuti facevano una giunta)
        if (a === 1) { const l = (sx[2] - sx[1]) * (y1 - y0) / Math.max(1, sy[b + 1] - sy[b]), n = Math.max(1, Math.round((x1 - x0) / l)), w = (x1 - x0) / n;
          for (let k = 0; k < n; k++) pezzo(a, b, x0 + k * w, x0 + (k + 1) * w + .5, y0, y1); }
        else { const l = (sy[2] - sy[1]) * (x1 - x0) / Math.max(1, sx[a + 1] - sx[a]), n = Math.max(1, Math.round((y1 - y0) / l)), h = (y1 - y0) / n;
          for (let k = 0; k < n; k++) pezzo(a, b, x0, x1, y0 + k * h, y0 + (k + 1) * h + .5); }
      } else pezzo(a, b, x0, x1, y0, y1);
    }
    return 'url("' + c.toDataURL('image/png') + '")';
  }
  function nuvola(el) {
    const W = el.offsetWidth, H = el.offsetHeight; if (!W || !H) return null;
    const cu = el.dataset.cu, t = cu.split(/\s+/)[0];
    if (t === 'pulsante') {
      const img = nuImg(cu.includes('arancio') ? 'pesca' : cu.includes('verde') ? 'verde' : 'pillola'); if (!img) return null;
      const e = Math.round(img.naturalHeight / 2);   // estremità: mezza altezza dell'immagine → mezza altezza del pulsante
      return noveParti(img, W, H, [0, e, 0, e], [0, Math.min(H / 2, W / 2), 0, Math.min(H / 2, W / 2)]);
    }
    if (t === 'riquadro') {
      const sottile = cu.includes('sottile'), img = nuImg(sottile ? 'larga' : 'alta'); if (!img) return null;
      const s = sottile ? 60 : 65, d = Math.min(sottile ? 16 : 44, W / 3, H / 3);
      return noveParti(img, W, H, [s, s, s, s], [d, d, d, d], !sottile);
    }
    if (t === 'contatore') {
      const img = nuImg('contatore'); if (!img) return null;
      return noveParti(img, W, H, [0, 100, 0, 115], [0, H * .51, 0, H * .59]);
    }
    return null;
  }
  function aggiorna(el) {
    if (document.documentElement.classList.contains('ui-nuvola')) {   // tema «nuvola» (nuvola.css): niente cuoio
      el.style.removeProperty('--cu-bg-premuto'); el.style.setProperty('--cu-fianco', '0px');
      const u = nuvola(el); if (u) el.style.setProperty('--cu-bg', u); else el.style.removeProperty('--cu-bg');
      return;
    }
    const a = disegna(el, false); if (!a) return;
    el.style.setProperty('--cu-bg', a.url);
    el.style.setProperty('--cu-fianco', a.fianco + 'px');
    const t = el.dataset.cu.split(/\s+/)[0];
    if (['pulsante', 'tondo', 'tasto'].includes(t)) { const p = disegna(el, true); if (p) el.style.setProperty('--cu-bg-premuto', p.url); }
  }
  const ro = new ResizeObserver(voci => voci.forEach(v => aggiorna(v.target)));
  const mo = new MutationObserver(voci => voci.forEach(v => {
    if (v.type === 'attributes' && v.target.dataset && v.target.dataset.cu) aggiorna(v.target);
    v.addedNodes && v.addedNodes.forEach(nn => { if (nn.querySelectorAll) [nn, ...nn.querySelectorAll('[data-cu]')].forEach(e => e.dataset && e.dataset.cu && ro.observe(e)); });
  }));
  function avvia() {
    document.querySelectorAll('[data-cu]').forEach(e => ro.observe(e));
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'disabled', 'data-cu'] });   // niente 'style': aggiorna() lo scrive
  }
  window.Cuoio = { aggiorna, sq, ridisegna: () => document.querySelectorAll('[data-cu]').forEach(aggiorna) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia); else avvia();
})();

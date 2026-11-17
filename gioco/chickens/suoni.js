/* Suoni di «Chickens don't fly» (16/11/2026, seconda versione).
   Tutti i suoni sono creati dal codice (Web Audio): nessun file audio, nessuna licenza.
   1. COLONNA SONORA generata mentre si gioca: il ritmo segue la velocità di caduta (da 88 a 132 battiti al minuto),
      l'armonia cambia per mondo, la batteria entra man mano che si accelera; col paracadute la musica si ovatta e
      rallenta un poco; nel tratto vuoto tra due mondi la batteria tace. Nel menu resta solo un accompagnamento lento.
   2. TESSITURE dei mondi, leggere e a caso: stelline (notte), rombo e gocce (caverna), corrente e bollicine (abisso).
   3. POTENZIAMENTI ATTIVI: un suono continuo per ognuno, che scende di tono e si affievolisce mentre scade e
      pulsa veloce negli ultimi 1,5 s. Calamita ronzio magnetico · Scudo velo luccicante · Monete doppie scintille a tempo.
   4. EFFETTI: swoosh quando ti sposti (più ampio lo spostamento, più forte), monete, bolle, colpi, paracadute,
      sfiorare un ostacolo, animali, passaggio tra mondi, 3-2-1, negozio, record.
   Uso dal gioco: Suoni.ambiente({...}) a ogni fotogramma, Suoni.<effetto>(...) negli eventi. */
(() => {
'use strict';
const BASE = document.currentScript ? document.currentScript.src : location.href;   // i brani sono in musica/, accanto a questo file
let ctx = null, musicaSi = true, effettiSi = true, offline = false;   // 16/11: musica ed effetti si accendono e spengono separatamente;   // offline: solo per le prove (si «registra» il suono e si misura)
let master, comp, rev, revOut, sfx, sendSfx, filtroMondo, amb, ambFiltro, sendAmb, musica, musicaFiltro, sendMusica, rumoreBuf;
const V = {};                      // nodi che si regolano
let ultimoAgg = 0, livelloOra = 0;
const P = { mondo: 0, vel: 0, lento: 0, livello: 0, vuoto: 0, poteri: {} };   // ultimo stato ricevuto dal gioco

const ora = () => ctx.currentTime;
const verso = (param, valore, tempo = 0.12) => { param.cancelScheduledValues(ora()); param.setTargetAtTime(valore, ora(), tempo); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerpLog = (a, b, k) => a * Math.pow(b / a, k);
const NOTA = n => 440 * Math.pow(2, (n - 69) / 12);   // numero MIDI → frequenza

/* ---------- Costruzione ---------- */
function impulso(durata, caduta) {          // eco di una stanza: rumore che si spegne (stereo)
  const n = Math.floor(ctx.sampleRate * durata), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, caduta) * (i < 40 ? i / 40 : 1); }
  return b;
}
function rumore() { const s = ctx.createBufferSource(); s.buffer = rumoreBuf; s.loop = true; s.start(0, Math.random() * 1.9); return s; }
function filtro(tipo, freq, Q = 0.7) { const f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; f.Q.value = Q; return f; }
function guad(v = 0) { const g = ctx.createGain(); g.gain.value = v; return g; }
function osc(tipo, freq) { const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = freq; o.start(); return o; }
function catena(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }
function pan(v) { const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if (p) p.pan.value = clamp(v, -1, 1); return p || guad(1); }

function crea(dato) {
  if (!dato && /[?&]muto\b/.test(location.search)) return false;   // ?muto (16/11): prove senza audio, le impostazioni salvate non cambiano
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC && !dato) return false;
  ctx = dato || new AC({ latencyHint: 'interactive' });
  const n = ctx.sampleRate * 2; rumoreBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = rumoreBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.22;
  master = guad(0.85); catena(master, comp, ctx.destination);
  rev = ctx.createConvolver(); rev.buffer = impulso(2.8, 2.4); revOut = guad(1); catena(rev, revOut, master);
  filtroMondo = filtro('lowpass', 18000, 0.5); filtroMondo.connect(master);          // sott'acqua gli effetti sono ovattati
  sfx = guad(effettiSi ? 1.8 : 0); sfx.connect(filtroMondo); sendSfx = guad(0.15); catena(sfx, sendSfx, rev);
  ambFiltro = filtro('lowpass', 16000, 0.5); amb = guad(0); catena(amb, ambFiltro, master); sendAmb = guad(0.2); catena(ambFiltro, sendAmb, rev);
  musicaFiltro = filtro('lowpass', 16000, 0.6); musica = guad(0); catena(musica, musicaFiltro, master); sendMusica = guad(0.18); catena(musicaFiltro, sendMusica, rev);
  branoGain = guad(0.5); branoGain.connect(musica); branoInCorso = null; sorgente = null;   // 0,5 misurato: brani a circa −26 dB in uscita, sotto le monete
  costruisciLetti(); costruisciPoteri();
  passo16 = 0; prossimo = ctx.currentTime + 0.05;
  return true;
}

function costruisciLetti() {   // solo caverna e abisso hanno un fondo continuo, leggero (il resto lo fa la musica)
  V.letti = [null, null, null];
  { const g = guad(0); catena(rumore(), filtro('lowpass', 130, 0.7), guad(1.6), g);
    const o = osc('sine', 49); catena(o, guad(0.12), g); catena(osc('sine', 0.09), guad(1.5), o.frequency); V.letti.push(g); }
  { const g = guad(0); catena(rumore(), filtro('lowpass', 380, 0.8), guad(0.8), g); V.letti.push(g); }
  for (const g of V.letti) if (g) g.connect(amb);
}

/* ---------- Potenziamenti attivi: un suono continuo ciascuno ---------- */
function costruisciPoteri() {
  V.poteri = {};
  // calamita: ronzio magnetico (due note vicine che battono tra loro, con un leggero vibrato)
  { const g = guad(0), lp = filtro('lowpass', 900, 0.8), trem = guad(1); catena(lp, trem, g, pan(0), sfx);
    const a = osc('sawtooth', 110), b = osc('sawtooth', 110.8), vib = guad(3); catena(osc('sine', 5.5), vib); vib.connect(a.frequency); vib.connect(b.frequency);
    catena(a, guad(0.5), lp); catena(b, guad(0.5), lp);
    const lfo = osc('sine', 3), prof = guad(0.45); catena(lfo, prof, trem.gain);
    V.poteri.magnet = { g, f: [a, b], lfo, base: 0.025, nota: 110 }; }
  // scudo: velo luccicante (note alte che tremolano)
  { const g = guad(0), trem = guad(1); catena(trem, g, sfx);
    const f = [osc('sine', NOTA(79)), osc('sine', NOTA(86)), osc('triangle', NOTA(91))];
    f.forEach((o, i) => catena(o, guad([0.5, 0.35, 0.12][i]), trem));
    const lfo = osc('sine', 3), prof = guad(0.4); catena(lfo, prof, trem.gain);
    V.poteri.shield = { g, f, lfo, base: 0.018, nota: NOTA(79), rapporti: [1, NOTA(86) / NOTA(79), NOTA(91) / NOTA(79)] }; }
  // monete doppie: niente suono continuo, sono scintille suonate a tempo con la musica (vedi passoMusica)
}
function aggiornaPoteri() {
  for (const k of ['magnet', 'shield']) {
    const v = V.poteri[k], st = P.poteri[k];
    if (!st || st[0] <= 0) { verso(v.g.gain, 0, 0.08); continue; }
    const [resta, dur] = st, fr = clamp(resta / dur, 0, 1), fine = resta < 1.5;
    verso(v.g.gain, v.base * (0.35 + 0.65 * fr) * (P.livello > 0.6 ? 1 : 0.3), 0.1);
    const scesa = Math.pow(2, -(1 - fr) * 7 / 12);        // scende fino a una quinta mentre scade
    if (k === 'magnet') v.f.forEach((o, i) => verso(o.frequency, (v.nota + i * 0.8) * scesa, 0.2));
    else v.f.forEach((o, i) => verso(o.frequency, v.nota * v.rapporti[i] * scesa, 0.2));
    verso(v.lfo.frequency, fine ? 11 : 2.5 + 1.5 * (1 - fr), 0.1);                // negli ultimi 1,5 s pulsa veloce
  }
}

/* ---------- Brani scaricati (16/11, scelti da OpenGameArt, licenza CC0: liberi, senza obbligo di citare) ---------- */
// frames = campioni validi del brano (senza il silenzio iniziale che il formato AAC aggiunge): servono per un giro senza buchi
const BRANI = {
  'pixel-sprinter':  { file: 'musica/pixel-sprinter.mp4',  frames: 1512000, vol: 1, nome: 'Pixel Sprinter (Zane Little Music)' },
  'synthwave-house': { file: 'musica/synthwave-house.mp4', frames: 2228211, vol: 0.45, nome: 'Synthwave House Loop (Fupi)' },
  'chiptune-4':      { file: 'musica/chiptune-4.mp4',      frames: 2370816, vol: 1, nome: 'Electronic music / chiptune 4 (2D_PlatformerGuy)' },
};
let branoScelto = 'pixel-sprinter', branoInCorso = null, sorgente = null, branoGain = null;
try { const b = localStorage.getItem('caduta_brano'); if (b && (BRANI[b] || b === 'generata')) branoScelto = b; } catch (e) {}
const decodificati = {};
function caricaBrano(k) {
  if (!decodificati[k]) decodificati[k] = fetch(new URL(BRANI[k].file, BASE))
    .then(r => r.arrayBuffer()).then(ab => new Promise((ok, ko) => ctx.decodeAudioData(ab, ok, ko)));
  return decodificati[k];
}
function suonaBrano(k) {
  if (branoInCorso === k || !ctx) return;
  branoInCorso = k;
  if (sorgente) { const vecchia = sorgente; vecchia.g.gain.setTargetAtTime(0, ora(), 0.25); setTimeout(() => { try { vecchia.s.stop(); } catch (e) {} }, 1500); sorgente = null; }
  if (!BRANI[k]) return;                                   // «generata»: torna la musica fatta dal codice
  caricaBrano(k).then(buf => {
    if (branoInCorso !== k || !ctx) return;
    const valida = BRANI[k].frames / 44100, extra = buf.duration - valida, inizio = extra > 0.03 ? 2112 / 44100 : 0;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.loopStart = inizio; src.loopEnd = inizio + valida;
    const g = guad(0); catena(src, g, branoGain); src.start(ora() + 0.02, inizio); g.gain.setTargetAtTime(BRANI[k].vol, ora(), 0.4);
    sorgente = { s: src, g };
  }).catch(() => { decodificati[k] = null; });
}
function scegliBrano(k) { branoScelto = k; try { localStorage.setItem('caduta_brano', k); } catch (e) {} if (ctx && P.livello > 0) suonaBrano(k); }

/* ---------- Colonna sonora generata (usata se si sceglie «generata» o finché il brano non è caricato) ---------- */
// per ogni mondo 4 accordi (un accordo per battuta): [nota del basso, note dell'accordo]
const ARMONIE = [
  [[50, [62, 66, 69, 74]], [57, [61, 64, 69, 73]], [59, [62, 66, 71, 74]], [55, [62, 67, 71, 74]]],   // Cielo: re maggiore, luminoso
  [[53, [60, 64, 69, 72]], [57, [60, 64, 67, 72]], [50, [60, 65, 69, 72]], [58, [62, 65, 69, 74]]],   // Tramonto: fa maggiore, caldo
  [[45, [60, 64, 69, 72]], [53, [60, 65, 69, 72]], [48, [60, 64, 67, 72]], [55, [59, 62, 67, 71]]],   // Notte: la minore, sognante
  [[50, [62, 65, 69, 74]], [46, [62, 65, 70, 74]], [43, [62, 67, 70, 74]], [45, [61, 64, 69, 73]]],   // Caverna: re minore, cupo
  [[40, [59, 62, 66, 67]], [48, [59, 64, 67, 71]], [45, [60, 64, 67, 71]], [47, [59, 62, 64, 66]]],   // Abisso: mi minore, sospeso
];
const ARPEGGIO = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 1, 3, 2];
let passo16 = 0, prossimo = 0;
const bpm = () => (P.livello > 0.6 ? 88 + 44 * P.vel : 80) * (1 - 0.15 * P.lento);

function batteriaKick(t, v) { const o = ctx.createOscillator(), g = guad(0); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); catena(o, g, musica); o.start(t); o.stop(t + 0.25); }
function batteriaRumore(t, dur, f, tipo, v) { const s = ctx.createBufferSource(); s.buffer = rumoreBuf; const fl = filtro(tipo, f, 0.9), g = guad(0);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); catena(s, fl, g, musica); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02); }
function nota(f, t, dur, tipo, v, att = 0.005, dest = musica, p = 0) {
  const o = ctx.createOscillator(), g = guad(0); o.type = tipo; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  catena(o, g, pan(p), dest); o.start(t); o.stop(t + dur + 0.05);
}

function passoMusica(s, t) {
  const m = Math.round(P.mondo) % 5, battuta = Math.floor(s / 16) % 4, s16 = s % 16, [basso, acc] = ARMONIE[m][battuta];
  const inGioco = P.livello > 0.6, forza = inGioco ? 0.15 + 0.85 * P.vel : 0, dur16 = 60 / bpm() / 4;
  const batteria = inGioco && P.vuoto < 0.5 && m !== 4 && !sorgente;           // nell'abisso niente batteria (sott'acqua), nel tratto vuoto tace
  // accordo lungo all'inizio di ogni battuta
  if (sorgente) { scintilleDoppie(s, s16, t, acc, inGioco); return; }   // c'è un brano: della musica generata restano solo le scintille
  if (s16 === 0) acc.forEach((n, i) => nota(NOTA(n), t, dur16 * 16 * 1.05, 'triangle', 0.04, 0.25, musica, (i - 1.5) * 0.3));
  // basso
  const colpiBasso = forza > 0.45 ? [0, 3, 6, 8, 11, 14] : [0, 8];
  if (colpiBasso.includes(s16)) nota(NOTA(basso - 12 * (basso > 47 ? 1 : 0)), t, dur16 * (s16 % 8 === 0 ? 3 : 1.6), 'triangle', 0.2, 0.008);
  // arpeggio: a crome, a semicrome quando si va forte
  const ogni = forza > 0.65 ? 1 : 2;
  if (s16 % ogni === 0) { const n = acc[ARPEGGIO[s16] % acc.length] + 12;
    nota(NOTA(n), t, dur16 * 2.2, 'triangle', inGioco ? 0.075 : 0.05, 0.004, musica, Math.sin(s * 0.7) * 0.35);
    nota(NOTA(n) * 2, t, dur16 * 0.8, 'sine', 0.015, 0.003); }
  // batteria che entra con la velocità
  if (batteria) {
    if (forza > 0.2 && (s16 === 0 || s16 === 8 || (forza > 0.6 && (s16 === 4 || s16 === 12)))) batteriaKick(t, 0.24);
    if (forza > 0.35 && s16 % 4 === 2) batteriaRumore(t, 0.035, 7000, 'highpass', 0.05);
    if (forza > 0.75 && s16 % 2 === 1) batteriaRumore(t, 0.02, 8000, 'highpass', 0.025);
    if (forza > 0.5 && (s16 === 4 || s16 === 12)) batteriaRumore(t, 0.13, 1800, 'bandpass', 0.09);
  }
  scintilleDoppie(s, s16, t, acc, inGioco);
}
function scintilleDoppie(s, s16, t, acc, inGioco) {   // monete doppie attive: scintille a tempo, più rade mentre il potenziamento scade
  const d = P.poteri.double;
  if (d && d[0] > 0 && inGioco) { const fr = clamp(d[0] / d[1], 0, 1), fine = d[0] < 1.5;
    if (fine ? s16 % 1 === 0 : s16 % (fr > 0.5 ? 2 : 4) === 0) nota(NOTA(acc[(s16 / 2 | 0) % acc.length] + 24) * Math.pow(2, -(1 - fr) * 5 / 12), t, 0.25, 'sine', 0.03 * (0.4 + 0.6 * fr), 0.002, sfx, Math.sin(s) * 0.6); }
}
function pianifica() {
  if (!ctx || !(musicaSi || effettiSi) || ctx.state !== 'running' || P.livello <= 0) { if (ctx) prossimo = ora() + 0.05; return; }
  if (prossimo < ora() - 0.2) prossimo = ora() + 0.05;            // dopo una pausa lunga si riparte da adesso
  while (prossimo < ora() + 0.15) { passoMusica(passo16, prossimo); prossimo += 60 / bpm() / 4; passo16++; }
}

/* ---------- Ambiente: chiamato a ogni fotogramma ---------- */
const PER_MONDO = {          //   Cielo Tramonto Notte Caverna Abisso
  eco:     [0.12, 0.16, 0.3, 0.7, 0.38],
};
const pesata = (tab, m) => { const i = Math.floor(m) % 5, k = m - Math.floor(m); return tab[i] + (tab[(i + 1) % 5] - tab[i]) * k; };
const peso = (m, i) => { let dd = Math.abs(m - i); dd = Math.min(dd, 5 - dd); return Math.max(0, 1 - dd); };

function ambiente(p) {
  Object.assign(P, p); if (!p.poteri) P.poteri = {};
  if (!ctx || (ctx.state !== 'running' && !offline)) return;
  const t = ora(); if (t - ultimoAgg < 0.05 && !offline) return;     // basta 20 volte al secondo
  const dt = Math.min(0.2, t - ultimoAgg); ultimoAgg = t;
  const m = ((P.mondo || 0) % 5 + 5) % 5, lento = clamp(P.lento || 0, 0, 1), livello = P.livello ?? 1; livelloOra = livello;
  verso(amb.gain, effettiSi ? livello * 0.3 : 0, 0.35);
  verso(musica.gain, (musicaSi ? 1 : 0) * (livello > 0.6 ? 0.55 : livello * 1.5) * (1 - 0.35 * lento) * (1 - 0.45 * (P.vuoto || 0)), 0.3);   // misurato: col paracadute più piano; nel tratto vuoto si abbassa
  if (!offline && livello > 0 && musicaSi) suonaBrano(branoScelto);
  // il brano accelera appena con la velocità (±6%) e col paracadute rallenta e scende di tono (effetto «tempo lento»)
  if (sorgente) verso(sorgente.s.playbackRate, (0.95 + 0.11 * clamp(P.vel || 0, 0, 1)) * (1 - 0.18 * lento), 0.15);
  const acqua = peso(m, 4);
  // col paracadute la musica si ovatta (sensazione di tempo che rallenta); nell'abisso è sempre un po' ovattata
  verso(musicaFiltro.frequency, lerpLog(16000, 700, lento) * (1 - 0.8 * acqua) * (livello > 0.6 ? 1 : 0.15), 0.12);   // nel menu la musica è lontana
  verso(ambFiltro.frequency, lerpLog(16000, 900, lento), 0.12);
  V.letti.forEach((g, i) => g && verso(g.gain, peso(m, i) * 0.45, 0.4));
  verso(sendAmb.gain, pesata(PER_MONDO.eco, m), 0.4); verso(sendSfx.gain, pesata(PER_MONDO.eco, m) * 0.7, 0.4); verso(sendMusica.gain, pesata(PER_MONDO.eco, m) * 0.8, 0.4);
  verso(filtroMondo.frequency, lerpLog(18000, 1300, acqua), 0.3);
  aggiornaPoteri();
  if (offline) return;
  if (livello > 0.6) {                    // piccoli suoni a caso del mondo, solo durante la partita
    if (Math.random() < dt * 0.45 * peso(m, 2)) stellina();
    if (Math.random() < dt * 0.8 * peso(m, 3)) goccia();
    if (Math.random() < dt * 1.1 * peso(m, 4)) bollicine(Math.random() * 1.6 - 0.8, 2 + (Math.random() * 3 | 0), 0.05);
  }
}

/* ---------- Mattoni degli effetti ---------- */
// nota con inviluppo: attacco breve, poi si spegne. a = frequenza d'arrivo (glissando)
function tono(f, t0, dur, o = {}) {
  const os = ctx.createOscillator(); os.type = o.tipo || 'sine'; os.frequency.setValueAtTime(f, t0);
  if (o.a) os.frequency.exponentialRampToValueAtTime(o.a, t0 + (o.glis || dur));
  if (o.det) os.detune.value = o.det;
  const g = guad(0), v = o.vol ?? 0.2, at = o.att ?? 0.005;
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + at); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let ultimo = catena(os, g);
  if (o.lp) ultimo = catena(ultimo, filtro('lowpass', o.lp, 0.7));
  catena(ultimo, pan(o.pan || 0), o.dest || sfx);
  if (o.vib) { const lfo = ctx.createOscillator(); lfo.frequency.value = o.vib[0]; const lg = guad(o.vib[1]); catena(lfo, lg, os.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.05); }
  os.start(t0); os.stop(t0 + dur + 0.05);
}
// soffio di rumore filtrato: f0 → f1 nel tempo (whoosh, botti, schiocchi)
function soffio(t0, dur, o = {}) {
  const s = ctx.createBufferSource(); s.buffer = rumoreBuf; s.loop = true;
  const f = filtro(o.tipo || 'bandpass', o.f0 || 1000, o.Q ?? 1);
  if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
  const g = guad(0), v = o.vol ?? 0.3, at = o.att ?? 0.005;
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + at); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const p = pan(o.pan || 0);
  if (o.pan1 !== undefined && p.pan) p.pan.linearRampToValueAtTime(clamp(o.pan1, -1, 1), t0 + dur);
  catena(s, f, g, p, o.dest || sfx);
  s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
}
const pronto_ = () => ctx && effettiSi && (ctx.state === 'running' || offline);

/* ---------- Suoni dell'ambiente (a caso) ---------- */
const PENTA_ALTA = [81, 83, 85, 88, 90, 93, 95, 97];   // la maggiore pentatonica, in alto
function stellina() {
  const t = ora() + 0.01, n = PENTA_ALTA[Math.random() * PENTA_ALTA.length | 0], p = Math.random() * 1.4 - 0.7;
  tono(NOTA(n), t, 1.4, { vol: 0.035, pan: p, dest: amb });
  tono(NOTA(n) * 2.01, t, 0.6, { vol: 0.01, pan: p, dest: amb });
}
function goccia() {
  const t = ora() + 0.01, f = 900 + Math.random() * 900, p = Math.random() * 1.6 - 0.8;
  tono(f, t, 0.14, { a: f * 0.55, glis: 0.05, vol: 0.07, pan: p, dest: amb });
  if (Math.random() < 0.5) tono(f * 1.3, t + 0.09, 0.1, { a: f * 0.7, glis: 0.04, vol: 0.025, pan: p, dest: amb });
}
function bollicine(p, n, vol, dest) {
  const t = ora() + 0.01;
  for (let i = 0; i < n; i++) { const f = 350 + Math.random() * 500, ti = t + i * (0.05 + Math.random() * 0.07);
    tono(f, ti, 0.07, { a: f * 2.1, glis: 0.06, vol: vol * (1 - i * 0.12), pan: p + (Math.random() - 0.5) * 0.3, dest: dest || amb }); }
}

/* ---------- Effetti del gioco ---------- */
const MONETA_NOTE = [83, 85, 88, 90, 92, 95, 97, 100];   // si, do#, mi, fa#, sol#, si, do#, mi
let ultimaMoneta = 0, filaMonete = 0;
function moneta(doppie, p = 0) {
  if (!pronto_()) return;
  const t = ora();
  filaMonete = t - ultimaMoneta < 0.45 ? Math.min(MONETA_NOTE.length - 1, filaMonete + 1) : 0; ultimaMoneta = t;
  const f = NOTA(MONETA_NOTE[filaMonete]);
  tono(f, t, 0.09, { tipo: 'triangle', vol: 0.28, pan: p });
  tono(f * 1.5, t + 0.045, 0.22, { tipo: 'triangle', vol: 0.24, pan: p });
  tono(f * 3, t + 0.045, 0.12, { vol: 0.04, pan: p });
  if (doppie) tono(f * 2, t + 0.09, 0.25, { vol: 0.05, pan: -p });   // monete doppie: un'eco d'ottava in più
}
function bolla(tipo, p = 0) {
  if (!pronto_()) return;
  const t = ora();
  soffio(t, 0.05, { f0: 2500, Q: 1.2, vol: 0.25, pan: p });                 // la bolla scoppia
  tono(420, t, 0.09, { a: 1300, glis: 0.07, vol: 0.12, pan: p });
  const arp = (note, tp, passo, vol) => note.forEach((n, i) => tono(NOTA(n), t + 0.07 + i * passo, 0.5, { tipo: tp, vol, pan: p * 0.5 }));
  if (tipo === 'magnet') {        // calamita: «zing» metallico che sale
    arp([62, 66, 69, 74], 'triangle', 0.05, 0.08);
    tono(1200, t + 0.06, 0.55, { tipo: 'sawtooth', a: 2600, glis: 0.3, vol: 0.025, lp: 3500, vib: [28, 40] });
  } else if (tipo === 'shield') { // scudo: accordo pieno che si gonfia
    for (const n of [55, 59, 62, 67, 71]) tono(NOTA(n), t + 0.06, 1.1, { tipo: 'triangle', vol: 0.05, att: 0.12 });
    tono(110, t + 0.06, 0.5, { a: 70, vol: 0.18 });
  } else {                        // monete doppie: arpeggio brillante
    arp([76, 80, 83, 88, 92], 'square', 0.045, 0.03);
    arp([76, 80, 83, 88, 92], 'sine', 0.045, 0.06);
  }
}
function finePotere() {
  if (!pronto_()) return;
  const t = ora();
  tono(NOTA(81), t, 0.18, { tipo: 'triangle', vol: 0.09 }); tono(NOTA(76), t + 0.12, 0.3, { tipo: 'triangle', vol: 0.09 });
}
function scudo() {                 // lo scudo para il colpo: vetro che vibra + tonfo attutito
  if (!pronto_()) return;
  const t = ora();
  for (const [f, v] of [[1568, 0.08], [2349, 0.05], [4327, 0.025]]) tono(f, t, 0.9, { vol: v });
  soffio(t, 0.12, { f0: 3000, Q: 0.8, vol: 0.12 });
  tono(140, t, 0.2, { a: 60, vol: 0.25 });
}
function colpo(mat, p = 0) {       // diverso per famiglia: nuvola, gomma, cristalli, legno, acqua, roccia, animale
  if (!pronto_()) return;
  const t = ora();
  tono(150, t, 0.32, { a: 42, glis: 0.25, vol: 0.55 });                       // tonfo nel petto
  soffio(t, 0.16, { f0: 900, f1: 300, Q: 0.8, vol: 0.35, pan: p });
  if (mat === 'nuvola') soffio(t, 0.45, { tipo: 'lowpass', f0: 1200, f1: 200, Q: 0.4, vol: 0.3, att: 0.02, pan: p });   // sbuffo morbido
  else if (mat === 'gomma') tono(320, t, 0.22, { a: 180, glis: 0.2, vol: 0.12, vib: [40, 30], pan: p });                // palloncino che si strofina
  else if (mat === 'legno') { tono(420, t, 0.07, { tipo: 'triangle', vol: 0.15, pan: p }); tono(300, t + 0.06, 0.09, { tipo: 'triangle', vol: 0.11, pan: p }); }   // tok-tok
  else if (mat === 'cristalli') for (let i = 0; i < 5; i++) tono(2000 + Math.random() * 2500, t + 0.02 + i * 0.035, 0.35, { vol: 0.04, pan: p + (Math.random() - 0.5) * 0.6 });
  else if (mat === 'acqua') bollicine(p, 5, 0.09, sfx);
  else if (mat === 'roccia') {}                                                // solo il tonfo
  else soffio(t, 0.25, { f0: 1800, f1: 900, Q: 4, vol: 0.12, pan: p });       // animale: piume/ali
}
function morte() {
  if (!pronto_()) return;
  const t = ora();
  tono(520, t + 0.05, 1.0, { tipo: 'triangle', a: 70, glis: 0.95, vol: 0.18 });
  tono(780, t + 0.05, 0.8, { tipo: 'sine', a: 100, glis: 0.75, vol: 0.06 });
  soffio(t, 1.2, { tipo: 'lowpass', f0: 600, f1: 80, Q: 0.4, vol: 0.3, att: 0.02 });
}
function apre() {                  // il paracadute si apre: telo che schiocca e si gonfia, il vento si spegne
  if (!pronto_()) return;
  const t = ora();
  soffio(t, 0.3, { f0: 2600, f1: 500, Q: 0.7, vol: 0.28 });
  soffio(t + 0.05, 0.35, { f0: 420, Q: 1.2, vol: 0.4, att: 0.02 });
  tono(95, t + 0.05, 0.3, { a: 55, vol: 0.3 });
}
function chiude() {                // si richiude: soffio che riparte
  if (!pronto_()) return;
  soffio(ora(), 0.45, { f0: 350, f1: 1800, Q: 0.8, vol: 0.18, att: 0.25 });
}
function caricato() {               // paracadute di nuovo pronto: piccolo campanello
  if (!pronto_()) return;
  const t = ora();
  tono(NOTA(88), t, 0.5, { vol: 0.07 }); tono(NOTA(95), t + 0.07, 0.6, { vol: 0.055 });
}
function sfiora(p, forza) {        // passi vicino a un ostacolo: «fiuu» dal lato dell'ostacolo
  if (!pronto_()) return;
  const t = ora(); if (t - (sfiora.ult ?? -1) < 0.07) return; sfiora.ult = t;
  soffio(t, 0.26, { f0: 1500, f1: 380, Q: 1.3, vol: 0.8 * clamp(forza, 0.2, 1), att: 0.03, pan: p * 0.9, pan1: p * 0.3 });
}
function swoosh(dir, forza) {       // ti sposti: «swoosh» che va da un lato all'altro; più ampio lo spostamento, più forte e lungo
  if (!pronto_()) return;
  const t = ora(), f = clamp(forza, 0.15, 1), dur = 0.22 + 0.3 * f;
  const s = ctx.createBufferSource(); s.buffer = rumoreBuf; s.loop = true;
  const bp = filtro('bandpass', 500, 2.2), g = guad(0), p = pan(-dir * 0.7);
  bp.frequency.setValueAtTime(450, t); bp.frequency.exponentialRampToValueAtTime(1500 + 1500 * f, t + dur * 0.4); bp.frequency.exponentialRampToValueAtTime(600, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.38 * f, t + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (p.pan) p.pan.linearRampToValueAtTime(dir * 0.7, t + dur);
  catena(s, bp, g, p, sfx); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
}
function nemico(tipo, p = 0) {     // un nemico entra in scena: 0 falco, 1 aquilone, 2 gufo, 3 talpa, 4 pesce palla
  if (!pronto_()) return;
  const t = ora(); if (t - (nemico.ult ?? -9) < 3.5) return; nemico.ult = t;   // gli animali sono tanti: al massimo un verso ogni 3,5 s
  if (tipo === 0) {                // grido del falco: «kii-aa» con un tremolio
    tono(2300, t, 0.42, { a: 1500, glis: 0.4, vol: 0.08, vib: [32, 90], pan: p, att: 0.03 });
    tono(4600, t, 0.3, { a: 3000, glis: 0.3, vol: 0.012, vib: [32, 180], pan: p, att: 0.03 });
  } else if (tipo === 1) {         // aquilone: la stoffa che sbatte nel vento
    for (let i = 0; i < 3; i++) soffio(t + i * 0.09, 0.08, { f0: 900, f1: 500, Q: 1.5, vol: 0.22, pan: p });
  } else if (tipo === 2) {         // gufo: «uu-uuh»
    tono(392, t, 0.25, { a: 370, vol: 0.12, att: 0.04, pan: p }); tono(370, t + 0.3, 0.45, { a: 330, vol: 0.12, att: 0.05, pan: p });
  } else if (tipo === 3) {         // talpa: un «oh!» sorpreso
    tono(700, t, 0.16, { tipo: 'triangle', a: 1100, glis: 0.08, vol: 0.1, pan: p });
  } else {                         // pesce palla: «blub» e bolle
    tono(260, t, 0.18, { a: 140, vol: 0.2, pan: p }); bollicine(p, 3, 0.08, sfx);
  }
}
function passaggio() {             // il tratto vuoto tra due mondi: il suono si apre e respira
  if (!pronto_()) return;
  const t = ora();
  soffio(t, 2.6, { f0: 250, f1: 3200, Q: 0.6, vol: 0.13, att: 2.1 });
  [69, 73, 76, 81].forEach((n, i) => tono(NOTA(n), t + 1.9 + i * 0.11, 1.6, { vol: 0.035, att: 0.04 }));
}
function conta(n) {
  if (!pronto_()) return;
  tono(NOTA(76), ora(), 0.16, { tipo: 'triangle', vol: 0.25 });
}
function via() {
  if (!pronto_()) return;
  const t = ora(); tono(NOTA(88), t, 0.35, { tipo: 'triangle', vol: 0.24 }); tono(NOTA(76), t, 0.35, { tipo: 'triangle', vol: 0.12 });
}
function record() {
  if (!pronto_()) return;
  const t = ora();
  [72, 76, 79, 84].forEach((n, i) => tono(NOTA(n), t + i * 0.1, 0.4, { tipo: 'triangle', vol: 0.09 }));
  for (const n of [72, 76, 79, 84, 88]) tono(NOTA(n), t + 0.42, 1.4, { tipo: 'triangle', vol: 0.04, att: 0.03 });
}
function compra() {
  if (!pronto_()) return;
  const t = ora();
  soffio(t, 0.06, { f0: 4000, Q: 1, vol: 0.12 });
  tono(NOTA(88), t + 0.02, 0.12, { tipo: 'triangle', vol: 0.1 }); tono(NOTA(95), t + 0.08, 0.4, { tipo: 'triangle', vol: 0.1 });
  tono(NOTA(100), t + 0.08, 0.3, { vol: 0.03 });
}
function tocco() {
  if (!pronto_()) return;
  tono(700, ora(), 0.06, { a: 900, vol: 0.18 });
}

/* ---------- Accensione (iPhone: l'audio parte solo dopo un tocco) ---------- */
function sblocca() {
  if (!ctx && !crea()) return;
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  // suono vuoto: su alcuni iPhone serve per «aprire» l'audio
  const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
}
// imposta(true/false) accende o spegne tutto; imposta({ musica, effetti }) separatamente
function imposta(si) {
  if (typeof si === 'object') { if ('musica' in si) musicaSi = !!si.musica; if ('effetti' in si) effettiSi = !!si.effetti; } else musicaSi = effettiSi = !!si;
  if (!ctx) return;
  verso(sfx.gain, effettiSi ? 1.8 : 0, 0.05); if (!effettiSi) verso(amb.gain, 0, 0.05);
  if (!musicaSi) verso(musica.gain, 0, 0.05);
  ultimoAgg = -1; ambiente({});                       // riapplica subito i volumi
}
for (const ev of ['pointerdown', 'touchend', 'keydown']) addEventListener(ev, sblocca, { capture: true, passive: true });
setInterval(pianifica, 25);   // la musica si scrive 0,15 s in anticipo, così non salta se un fotogramma tarda
document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => {}); else if (livelloOra > 0) ctx.resume().catch(() => {}); });

window.Suoni = { sblocca, imposta, get attivi() { return musicaSi || effettiSi; }, get musica() { return musicaSi; }, get effetti() { return effettiSi; }, get ctx() { return ctx; }, ambiente,
  scegliBrano, get brano() { return branoScelto; }, _brano: () => ({ branoInCorso, sorgente: !!sorgente, ctxStato: ctx && ctx.state }), BRANI, swoosh, moneta, bolla, finePotere, scudo, colpo, morte, apre, chiude, caricato, sfiora, nemico, passaggio, conta, via, record, compra, tocco,
  // solo per le prove (pagina prove/suoni.html e misure dei volumi): non servono al gioco
  _master: () => master, _uscita: () => comp, _V: () => ({ V, amb, musica, musicaFiltro }), _passoMusica: (s, t) => passoMusica(s, t),
  _offline: c => { offline = true; ultimoAgg = -1; crea(c); },   // solo per le prove: dopo bisogna ricaricare la pagina
  // per la pagina di ascolto
  _stellina: () => pronto_() && stellina(), _goccia: () => pronto_() && goccia(), _bollicine: () => pronto_() && bollicine(0, 4, 0.06) };
dispatchEvent(new Event('suoni-pronti'));   // il gioco lo aspetta per applicare la scelta «Suoni: no» salvata
})();

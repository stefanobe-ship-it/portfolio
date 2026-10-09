# Portfolio di Stefano Oberto — note per chi lavora sul sito

Sito statico (HTML, CSS, JS, nessuna build) pubblicato con GitHub Pages dal branch `main`:
https://stefanobe-ship-it.github.io/portfolio/

## Regole

- Rispondi a Stefano in italiano.
- Le pagine italiane sono la fonte: `index.html`, `chi-sono.html`, `progetti/*.html`.
  **Non modificare a mano `en/` e `de/`**: dopo ogni modifica ai testi aggiungi le traduzioni in
  `tools/traduzioni.json` (chiave = testo italiano esatto) e lancia `python3 tools/traduci.py`.
  Lo script si ferma se manca una traduzione.
- Stile: identità "Indice". Bianco/nero con un solo accento arancione (`--accent` in `styles.css`),
  Instrument Sans + JetBrains Mono, griglia a 4 colonne. Tema scuro automatico + pulsante luna/sole,
  lingue nel menu del globo.
- Le info di ogni progetto sono sempre: Cliente · Anno · Ruolo · Cosa ho fatto.
- I contenuti ancora da scrivere hanno la classe `todo` (nascosti online). Non inventare contenuti:
  chiedi a Stefano.
- Immagini in `img/<progetto>/`, JPG/PNG larghi al massimo circa 2400 px.
- Prima di pubblicare controlla le pagine anche a larghezza telefono (circa 390 px).
- Per mettere online: commit, poi porta le modifiche su `main` (il sito si aggiorna in 1–2 minuti).

## Da completare (al momento)

- Testi dentro le immagini: restano in italiano in EN/DE (vedi navigazione Club Deal, slide di potenziale/valutazione, design system Hoomie). Soluzione concordata in sospeso: immagini senza testo + testi in HTML.
- SI.EL.: testo "Cosa è cambiato" nel logo.
- Profilo: passaggio dal branding alla UI/UX, foto delle passioni, `cv.pdf`.
- Coniuratio: meccaniche, diario di sviluppo, prossimi passi.
- Dominio personale (da comprare e collegare in Settings → Pages).

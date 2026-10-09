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

- Testi dentro le immagini: resta il design system di Hoomie. Metodo: Stefano manda la slide in PDF (senza sfondo), si estraggono le immagini e si ricostruiscono etichette, testi e linee in HTML (`.navmap` in `styles.css`, linee in `script.js`). Niente sfumature/maschere aggiunte sulle schermate.
- Copertine dei progetti in home: anteprima al passaggio del cursore in 4:5 (`data-img`), facoltativa una versione 16:10 per il telefono (`data-thumb`).
- SI.EL.: testo "Cosa è cambiato" nel logo.
- Profilo: passaggio dal branding alla UI/UX, foto delle passioni, `cv.pdf`.
- Profilo, sezione "Come uso l'AI" (`chi-sono.html#ai`): Stefano sta ancora definendo cosa non delega all'AI. Le barre dello schema sono indicative (variabili `--p0/--p1/--a0/--a1`).
- Coniuratio: meccaniche, diario di sviluppo, prossimi passi.
- Dominio personale (da comprare e collegare in Settings → Pages).
- Hoomie: lato proprietario (Stefano manda il materiale); eventuale versione scura della mappa del sistema
  (`mappa-sistema.jpg` ha sfondo grigio chiaro: se arriva, farla cambiare col tema come il design system, `.only-light` / `.only-dark`).
- Hoomie, archetipi: l'inglese è quello originale dei PDF, l'italiano è tradotto da Claude, da far confermare a Stefano.
- Hoomie Community (`progetti/community.html`): anno, ruolo e "Cosa ho fatto" (nascosti con `todo`, in home l'anno è "—");
  testi del problema, da Hoomie alla Community, i flussi, a che punto è; copertina 4:5 / 16:10 (ora provvisoria = schermata Casa).

## Eccezioni già decise

- Design system di Hoomie: la leggera sfumatura del colore di fondo sopra e sotto (`.soft-edges`) l'ha chiesta Stefano.
- Hoomie: niente sezione "Quanto costa" (prezzi in validazione) e niente immagine social/siti di annunci nel problema.

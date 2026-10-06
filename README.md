# Portfolio

Sito portfolio statico (HTML + CSS + un po' di JavaScript), senza dipendenze né build.

## Struttura

- `index.html`: home con elenco dei lavori, filtri per disciplina e breve presentazione.
- `chi-sono.html`: pagina personale (percorso, metodo, strumenti, passioni).
- `progetti/`: una pagina per progetto. Ci sono tre modelli da copiare:
  - `hoomie.html` / `club-deal.html`: caso studio **UI/UX** (obiettivo, utenti, flussi, scelte di design, risultati);
  - `ventinove-fest.html` / `siel.html`: **branding** (contesto, brief o ruolo, idea, applicazioni), con immagini vere in `img/`;
  - `coniuratio.html`: **progetto personale in corso** (il videogioco), con diario di sviluppo.
- `styles.css`: aspetto grafico. Colori e font sono in cima, nella sezione `:root`.
- `script.js`: orologio, nome a tutta larghezza, filtri, anteprima al passaggio del cursore, comparse.

Le parti da personalizzare sono segnate con `TODO`. Per vederlo in locale basta aprire `index.html` nel browser.

## Contenuti ancora da scrivere

Le parti segnaposto (testi guida, il diario di Coniuratio, i link al CV finché
non c'è `cv.pdf`) hanno la classe `todo`: restano nel codice ma non si vedono
online. Quando le completi, togli `todo` dall'elemento.

## Lingue (italiano, inglese, tedesco)

Le pagine italiane sono la fonte. Le versioni in `en/` e `de/` **non si modificano a mano**:
si rigenerano con

    python3 tools/traduci.py

Lo script copia ogni pagina italiana, sostituisce i testi con quelli di
`tools/traduzioni.json` e sistema i percorsi di immagini, CSS e script.
Se aggiungi o cambi un testo italiano, aggiungi la sua traduzione in
`tools/traduzioni.json` (la chiave è il testo italiano esatto): se ne manca
una, lo script si ferma e dice quale. `python3 tools/traduci.py --mancanti`
elenca solo i testi ancora da tradurre.

## Tema chiaro e scuro

Il sito segue l'impostazione del sistema. Il pulsante nella testata la
sovrascrive e la scelta resta salvata nel browser; tornando sulla stessa
modalità del sistema il sito torna automatico. I colori dei due temi sono in
cima a `styles.css`.

## Aggiungere un progetto

1. Copia il modello più adatto in `progetti/` e rinominalo (es. `progetti/app-prenotazioni.html`).
2. In `index.html` aggiungi una riga `<a class="row" ...>` che punta alla nuova pagina:
   `data-cat` è la disciplina (`ux`, `brand`, `grafica`, `personale`), `data-img` la copertina.
3. Aggiorna il link "Progetto successivo" in fondo alle pagine, così la catena resta chiusa.
4. Aggiungi le traduzioni dei nuovi testi e lancia `python3 tools/traduci.py`.

## Immagini

Metti le immagini in `img/<nome-progetto>/`. Nelle pagine ogni riquadro grigio
(`<div class="ph" ...>`) va sostituito con `<img src="../img/<nome-progetto>/file.jpg" alt="descrizione">`.
Formato consigliato: JPG o WebP, larghi al massimo circa 2400 px.

## Curriculum

Salva il CV come `cv.pdf` nella cartella principale: i link "Scarica il CV" puntano lì.

## Pubblicazione gratuita con GitHub Pages

1. Su GitHub apri il repository → **Settings** → **Pages**.
2. In **Build and deployment** scegli **Source: Deploy from a branch**.
3. Seleziona il branch `main` e la cartella `/ (root)`, poi salva.
4. Dopo qualche minuto il sito è online su
   `https://stefanobe-ship-it.github.io/portfolio/`.

Se rinomini il repository in `stefanobe-ship-it.github.io`, l'indirizzo diventa
`https://stefanobe-ship-it.github.io/` (senza `/portfolio`).

## Dominio personale (es. `stefanooberto.it`)

1. Compra il dominio da un registrar (Aruba, Register.it, Namecheap, Cloudflare, ecc.).
2. Nel pannello DNS del registrar crea i record indicati nella documentazione di GitHub
   ("Managing a custom domain for your GitHub Pages site"): record `A` verso gli IP di
   GitHub Pages per il dominio principale e un `CNAME` per `www` verso
   `stefanobe-ship-it.github.io`. Copia gli IP dalla documentazione ufficiale, non da qui.
3. In **Settings → Pages → Custom domain** inserisci il dominio e salva: GitHub crea
   automaticamente il file `CNAME` nel repository.
4. Quando il certificato è pronto, attiva **Enforce HTTPS**.

La propagazione DNS può richiedere da pochi minuti a qualche ora.

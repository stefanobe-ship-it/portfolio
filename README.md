# Portfolio

Sito portfolio statico (HTML + CSS + un po' di JavaScript), senza dipendenze né build.

## Struttura

- `index.html`: home con elenco dei lavori, filtri per disciplina e breve presentazione.
- `chi-sono.html`: pagina personale (percorso, metodo, strumenti, passioni).
- `progetti/`: una pagina per progetto. Ci sono tre modelli da copiare:
  - `progetto-uno.html` / `progetto-due.html`: caso studio **UI/UX** (contesto, problema, ricerca, intuizione, soluzione, test, risultati);
  - `ventinove-fest.html` / `siel.html`: **branding** (contesto, brief o ruolo, idea, applicazioni), con immagini vere in `img/`;
  - `videogioco.html`: **progetto personale in corso**, con diario di sviluppo.
- `styles.css`: aspetto grafico. Colori e font sono in cima, nella sezione `:root`.
- `script.js`: orologio, nome a tutta larghezza, filtri, anteprima al passaggio del cursore, comparse.

Le parti da personalizzare sono segnate con `TODO`. Per vederlo in locale basta aprire `index.html` nel browser.

## Aggiungere un progetto

1. Copia il modello più adatto in `progetti/` e rinominalo (es. `progetti/app-prenotazioni.html`).
2. In `index.html` aggiungi una riga `<a class="row" ...>` che punta alla nuova pagina:
   `data-cat` è la disciplina (`ux`, `brand`, `grafica`, `personale`), `data-img` la copertina.
3. Aggiorna il link "Progetto successivo" in fondo alle pagine, così la catena resta chiusa.

## Immagini

Metti le immagini in `img/<nome-progetto>/`. Nelle pagine ogni riquadro grigio
(`<div class="ph" ...>`) va sostituito con `<img src="../img/<nome-progetto>/file.jpg" alt="descrizione">`.
Formato consigliato: JPG o WebP, larghi al massimo circa 2400 px.

## Curriculum

Salva il CV come `cv.pdf` nella cartella principale: i link "Scarica il CV" puntano lì.

## Pubblicazione gratuita con GitHub Pages

1. Su GitHub apri il repository → **Settings** → **Pages**.
2. In **Build and deployment** scegli **Source: Deploy from a branch**.
3. Seleziona il branch (es. `main`) e la cartella `/ (root)`, poi salva.
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

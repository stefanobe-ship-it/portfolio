# Portfolio

Sito portfolio statico (HTML + CSS + un po' di JavaScript), senza dipendenze né build.

## File

- `index.html`: tutti i contenuti. Le parti da personalizzare sono segnate con `TODO`.
- `styles.css`: aspetto grafico. Colori e font sono in cima al file, nella sezione `:root`.
- `script.js`: tema chiaro/scuro, animazioni all'ingresso, anno nel footer.

Per vederlo in locale basta aprire `index.html` nel browser.

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

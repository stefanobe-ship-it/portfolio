# Anteprima: Hoomie rifatto + Hoomie Community

Copia di prova del sito con le modifiche proposte, **non ancora online**.
Online c'è ancora la versione nella radice del repo. Anteprima pubblicata (privata) su claude.ai:
https://claude.ai/artifact/SVrcJgV7RUMSrzhDmmadZx

Si apre in locale con `python3 -m http.server` dentro `anteprima/` → http://localhost:8000
(solo italiano: il menu lingue è nascosto in anteprima).

## Cosa cambia rispetto al sito online

**Home (`index.html`)**
- Niente filtri: sopra la lista **UI/UX** (Club Deal, Hoomie, Hoomie Community), sotto, staccata e con titoli
  più piccoli, **Branding e progetti personali** (Coniuratio, Ventinove Fest, SI.EL.).
- Nuova riga Hoomie Community (anno "—" da confermare; copertina provvisoria = schermata Casa).

**Hoomie (`progetti/hoomie.html`)**
- Copertina: illustrazione con logo e personaggi (`img/hoomie/copertina.jpg`).
- "Il problema" + tre dati con fonti (81%, 1 su 2, 651 €). Tolta l'immagine social/siti di annunci (richiesta di Stefano).
- "Due tipi di utenti": cursore prima/dopo tra schermata proprietario (Ciao Anna) e fuorisede (Per te); testi ai lati allineati in alto.
- Mappa del sistema nuova (`mappa-sistema.jpg`, ha sfondo grigio chiaro: se Stefano manda una versione scura, farla cambiare col tema come il design system).
- "La funzione principale": schermate della Ciurma senza sfondo (`crew.webp`) con le **frecce in SVG** disegnate nel codice (`.flow`), colore del tema.
- "I profili": **carosello dei 6 archetipi** (`.arch` in CSS/JS). Illustrazioni dai PDF senza testo (`img/hoomie/archetipi/`),
  testi veri in HTML con font Bricolage Grotesque (Google Fonts, aggiunto solo in questa pagina). Scorre da sinistra a destra,
  si trascina, le carte lontane si rimpiccioliscono e spariscono dietro.
- Contratto in app: "In test, con Locare come partner".
- Design system: versione chiara e scura che cambiano col tema (`.only-light` / `.only-dark`), con leggera sfumatura del colore di fondo sopra e sotto (`.soft-edges`).
  Nota: CLAUDE.md dice "niente sfumature sulle schermate", ma qui la sfumatura l'ha chiesta Stefano esplicitamente.
- Risultati: aggiunti proprietari 8% → 11% e 10,7 persone in cerca per posto letto (462 su 43).
- In fondo "Oltre la ricerca" + schema "Da fuorisede a local" (indice in stile home: Hooniversità, Hoomie, Hoomie Community).
- Tolto "Quanto costa" (Stefano: troppi numeri, prezzi in validazione).

**Nuova pagina `progetti/community.html`** (Hoomie Community, web app spese/turni/eventi)
- Schermate Casa, Spese, Eventi; frase "Trovare casa succede una volta ogni qualche anno. Viverci, ogni giorno.";
  la scelta di tenerla separata (frequenza d'uso); schema del servizio; "Cosa fa"; "Tra le due app".
- Da scrivere (riquadri tratteggiati): il problema, da Hoomie alla Community, i flussi, a che punto è.
- Da confermare con Stefano: anno, ruolo (ipotesi "Co-founder, CDO & CMO?"), "Cosa ho fatto".

## Per portarla sul sito vero
1. Copiare i file da `anteprima/` alla radice (immagini nuove comprese).
2. In `styles.css` togliere il blocco "Anteprima della proposta (solo in questa copia)": `.lang {display:none}`, l'etichetta
   arancione `body::after`, e trasformare `.ph-text` / `.ph-block` nella classe `todo` del sito.
3. Aggiungere le traduzioni in `tools/traduzioni.json` e lanciare `python3 tools/traduci.py`.
   Testi degli archetipi: l'inglese è quello originale dei PDF (vedi sotto); l'italiano l'ho tradotto io, da far confermare a Stefano.
4. Controllare a 390 px e in tema scuro, poi commit e push su `main`.

### Archetipi: testi originali inglesi (dai PDF)
- Creative — You’re a visionary who loves new ideas and dynamic relationships. / You thrive with flexible, intellectually stimulating roommates.
- Empathetic — You’re peace-loving and seek deep connections and calm environments. / You get along well with sensitive people who value empathy.
- Leader — You’re organized, decisive and goal-oriented. / You get along well with collaborative people who respect the rules.
- Optimist — You’re outgoing, enthusiastic and love having fun. / You’re a great match for sociable, positive people.
- Pragmatic — You’re reliable, you value stability and mutual respect. / You get along well with tidy people who value peace and quiet.
- Strategist — You’re analytical and introverted, with a love of logic and mental order. / You thrive with calm people who respect personal space.

## Prossimi passi concordati
- Hoomie: lato proprietario (Stefano manda il materiale).
- Hoomie Community: testi mancanti e copertina 4:5 / 16:10.
- Eventuale versione scura della mappa del sistema.

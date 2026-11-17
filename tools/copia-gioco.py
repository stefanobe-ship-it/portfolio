#!/usr/bin/env python3
"""Copia «Chickens don't fly» dalla cartella del gioco al portfolio (gioco/chickens/).

La cartella del gioco (~/Work/Giochino/caduta) resta com'è: qui si copia solo quello che serve a
farlo girare (niente prove, niente immagini originali) e si fanno due ritocchi alla copia:
  - lo stile dell'interfaccia parte da «nuvola» (si può ancora cambiare in Impostazioni);
  - i pulsanti di prova «Prova da: …» del menu sono nascosti.

Uso:  python3 tools/copia-gioco.py           (rilancialo ogni volta che vuoi aggiornare il gioco nel sito)
      python3 tools/copia-gioco.py --da <cartella>   (se il gioco sta altrove)
"""
import os
import shutil
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
SITO = os.path.dirname(QUI)
DA = os.path.expanduser('~/Work/Giochino/caduta')
if '--da' in sys.argv:
    DA = os.path.abspath(sys.argv[sys.argv.index('--da') + 1])
A = os.path.join(SITO, 'gioco', 'chickens')

FILE = ['index.html', 'cuoio.css', 'cuoio.js', 'nuvola.css', 'suoni.js']
CARTELLE = ['grafiche', 'musica']
SALTA = {'originali', '.DS_Store'}

# ritocchi alla copia di index.html: (testo da cercare, testo nuovo)
RITOCCHI = [
    ("if ((p || s) === 'nuvola')", "if ((p || s || 'nuvola') === 'nuvola')"),
    ("</head>", "<style>/* copia del portfolio */ #titolo .mondi-prova { display: none !important; }</style>\n</head>"),
]


def main():
    if not os.path.isfile(os.path.join(DA, 'index.html')):
        sys.exit(f'Non trovo il gioco in {DA}')
    if os.path.isdir(A):
        shutil.rmtree(A)
    os.makedirs(A)
    for f in FILE:
        shutil.copy2(os.path.join(DA, f), os.path.join(A, f))
    for c in CARTELLE:
        shutil.copytree(os.path.join(DA, c), os.path.join(A, c),
                        ignore=lambda cartella, nomi: [n for n in nomi if n in SALTA])

    pagina = os.path.join(A, 'index.html')
    with open(pagina, encoding='utf-8') as fp:
        testo = fp.read()
    for vecchio, nuovo in RITOCCHI:
        if testo.count(vecchio) != 1:
            sys.exit(f'Ritocco non applicabile (il gioco è cambiato?): {vecchio!r}')
        testo = testo.replace(vecchio, nuovo)
    with open(pagina, 'w', encoding='utf-8') as fp:
        fp.write(testo)

    totale = sum(os.path.getsize(os.path.join(r, n)) for r, _, ns in os.walk(A) for n in ns)
    numero = sum(len(ns) for _, _, ns in os.walk(A))
    print(f'Copiati {numero} file ({totale / 1e6:.1f} MB) in {os.path.relpath(A, SITO)}/')


if __name__ == '__main__':
    main()

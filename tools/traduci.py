#!/usr/bin/env python3
"""Genera le versioni inglese (en/) e tedesca (de/) del sito a partire dalle pagine italiane.

Le pagine italiane sono la fonte: si modificano solo quelle, poi si lancia
    python3 tools/traduci.py
che rigenera en/ e de/ applicando le traduzioni di tools/traduzioni.json.

Ogni testo italiano visibile (o in alt, aria-label, title, meta description) deve
avere una voce in traduzioni.json, altrimenti lo script si ferma e dice quali mancano.
    python3 tools/traduci.py --mancanti   elenca solo i testi senza traduzione
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['it', 'en', 'de']
LABELS = {'it': 'Italiano', 'en': 'English', 'de': 'Deutsch'}
ASSET = re.compile(r'((?:href|src|data-img|data-thumb)=")((?:\.\./)*)(styles\.css|script\.js|img/|cv\.pdf)')
TEXT = re.compile(r'>([^<>]+)<')
ATTR = re.compile(r'\b(alt|aria-label|title|content|data-label)="([^"]*)"')
SKIP_BLOCK = re.compile(r'(<script\b.*?</script>|<style\b.*?</style>|<!--.*?-->)', re.S)


def pages():
    out = ['index.html', 'chi-sono.html']
    out += sorted('progetti/' + f for f in os.listdir(os.path.join(ROOT, 'progetti')) if f.endswith('.html'))
    return out


def needs_translation(s):
    s = s.strip()
    return bool(s) and re.search(r'[A-Za-zÀ-ÿ]', s) is not None


def langs_block(page, lang):
    """La lista IT · EN · DE della testata, con i link alla stessa pagina nelle altre lingue."""
    here = os.path.dirname(page if lang == 'it' else os.path.join(lang, page))
    items = []
    for l in LANGS:
        target = page if l == 'it' else os.path.join(l, page)
        href = os.path.relpath(os.path.join(ROOT, target), os.path.join(ROOT, here))
        cur = ' aria-current="true"' if l == lang else ''
        items.append(f'<li><a href="{href}" lang="{l}" hreflang="{l}"{cur}>{LABELS[l]}</a></li>')
    return ''.join(items)


def set_langs(html, page, lang):
    return re.sub(r'(<ul class="langs"[^>]*>).*?(</ul>)', lambda m: m.group(1) + langs_block(page, lang) + m.group(2), html, count=1)


def segments(html):
    """Testi e attributi traducibili, esclusi script, stili e commenti."""
    parts = SKIP_BLOCK.split(html)
    for i, part in enumerate(parts):
        if i % 2:  # blocco da saltare
            continue
        for m in TEXT.finditer(part):
            if needs_translation(m.group(1)):
                yield m.group(1).strip()
        for m in ATTR.finditer(part):
            if m.group(1) == 'content' and 'name="description"' not in part[max(0, m.start() - 40):m.start()] and 'og:' not in part[max(0, m.start() - 40):m.start()]:
                continue
            if needs_translation(m.group(2)):
                yield m.group(2).strip()


def translate(html, table, lang, missing):
    def tr(s):
        key = s.strip()
        if not needs_translation(key):
            return s
        if key not in table:
            missing.add(key)
            return s
        val = table[key] if isinstance(table[key], str) else table[key][lang]
        lead = s[:len(s) - len(s.lstrip())]
        trail = s[len(s.rstrip()):]
        return lead + val + trail

    def fix_part(part):
        part = TEXT.sub(lambda m: '>' + tr(m.group(1)) + '<', part)

        def attr(m):
            name, val = m.group(1), m.group(2)
            if name == 'content':
                before = part[max(0, m.start() - 40):m.start()]
                if 'name="description"' not in before and 'og:' not in before:
                    return m.group(0)
            return f'{name}="{tr(val)}"'
        return ATTR.sub(attr, part)

    parts = SKIP_BLOCK.split(html)
    return ''.join(p if i % 2 else fix_part(p) for i, p in enumerate(parts))


def main():
    table = json.load(open(os.path.join(ROOT, 'tools', 'traduzioni.json'), encoding='utf-8'))
    table = {k: v for k, v in table.items() if not k.startswith('//')}
    if '--mancanti' in sys.argv:
        seen = []
        for p in pages():
            for s in segments(open(os.path.join(ROOT, p), encoding='utf-8').read()):
                if s not in table and s not in seen:
                    seen.append(s)
        print(json.dumps(seen, ensure_ascii=False, indent=1))
        return

    missing = set()
    for p in pages():
        src_path = os.path.join(ROOT, p)
        src = open(src_path, encoding='utf-8').read()
        src = set_langs(src, p, 'it')
        open(src_path, 'w', encoding='utf-8').write(src)
        for lang in ('en', 'de'):
            out = translate(src, table, lang, missing)
            out = out.replace('<html lang="it">', f'<html lang="{lang}">', 1)
            out = ASSET.sub(lambda m: m.group(1) + '../' + m.group(2) + m.group(3), out)
            out = set_langs(out, p, lang)
            dest = os.path.join(ROOT, lang, p)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            open(dest, 'w', encoding='utf-8').write(out)
    if missing:
        print('Testi senza traduzione in tools/traduzioni.json:', file=sys.stderr)
        for m in sorted(missing):
            print(' -', m, file=sys.stderr)
        sys.exit(1)
    print('Fatto: en/ e de/ rigenerate per', len(pages()), 'pagine.')


if __name__ == '__main__':
    main()

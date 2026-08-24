#!/usr/bin/env python3
"""Bundle SAT LockIn into one self-contained HTML file: dist/sat-lockin.html

Every non-ASCII character is escaped (CSS/JS unicode escapes, HTML numeric
entities) so the file renders correctly no matter what character encoding the
host declares -- a bundled fragment cannot carry its own <meta charset>.

Re-run after editing any source file:  python3 build-single-file.py
"""
import os, re, pathlib

ROOT = pathlib.Path(__file__).parent
JS = ['js/brand.js', 'js/config.js', 'js/data-rw.js', 'js/data-math.js', 'js/tags.js',
      'js/strategies.js', 'js/engine.js', 'js/cloud.js', 'js/generate.js', 'js/app.js']


def js_escape(text):
    out = []
    for ch in text:
        if ord(ch) < 0x80:
            out.append(ch)
        else:
            for unit in ch.encode('utf-16-be')[::1].hex('_', 2).split('_'):
                out.append('\\u' + unit)
    return ''.join(out)


def html_escape(text):
    return ''.join(ch if ord(ch) < 0x80 else '&#x%X;' % ord(ch) for ch in text)


def css_escape(text):
    # non-ASCII in this stylesheet only ever appears inside content:"..." strings
    return re.sub(r'[^\x00-\x7f]', lambda m: '\\%06X' % ord(m.group()), text)


def read(p):
    return (ROOT / p).read_text(encoding='utf-8')


index = read('index.html')
body = index.split('<body>', 1)[1].split('<script src', 1)[0]

parts = ['<title>SAT LockIn</title>',
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Outfit:wght@500;600;700;800&family=Public+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap">',
         '<style>', css_escape(read('assets/styles.css')), '</style>',
         html_escape(body).strip()]
for f in JS:
    parts += ['<script>', js_escape(read(f)), '</script>']

out = ROOT / 'dist' / 'sat-lockin.html'
out.parent.mkdir(exist_ok=True)
out.write_text('\n'.join(parts), encoding='utf-8')
nonascii = sum(1 for ch in out.read_text(encoding='utf-8') if ord(ch) > 127)
print('wrote %s (%d bytes, %d non-ASCII chars remaining)' % (out, out.stat().st_size, nonascii))

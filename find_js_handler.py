import re
html = open('memorial_admin.html', encoding='utf-8').read()

# find script start
m = re.search(r'<script>', html)
script = html[m.end():]

# look for loc related handlers
keywords = ['locFilter', 'loc.filter', 'filter.*loc', 'loc-cell', 'full-loc']
for kw in keywords:
    pos = script.find(kw)
    if pos >= 0:
        context = script[max(0,pos-100):pos+200]
        print('=== %s at pos %d ===' % (kw, pos))
        print(context[:250])
        print()

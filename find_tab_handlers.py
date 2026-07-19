import re
html = open('memorial_admin.html', encoding='utf-8').read()
m = re.search(r'<script>', html)
s = html[m.end():]

# find all tab-btn related handlers
keywords = ['.tab-btn', 'tabBtn', 'filter-tabs', 'data-filter', 'querySelectorAll']
for kw in keywords:
    pos = 0
    found = 0
    while True:
        pos = s.find(kw, pos)
        if pos < 0 or found >= 3:
            break
        found += 1
        context = s[max(0,pos-50):pos+150]
        # check if it's in a function (has 'function' or '=>' nearby)
        nearby = s[max(0,pos-200):pos+200]
        if 'function' in nearby or '=>' in nearby or 'addEventListener' in nearby:
            print('=== %s (handler) at %d ===' % (kw, pos))
            print(context[:200])
            print()
        pos += 1

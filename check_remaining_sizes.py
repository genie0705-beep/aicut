import re
html = open('memorial_admin.html', encoding='utf-8').read()
for s in ['28px', '32px', '36px']:
    pattern = r'.{0,40}font-size\s*:\s*' + s.replace('px', r'\.?') + r'px.{0,40}'
    matches = re.findall(pattern, html)
    print('--- %s (%d occurences) ---' % (s, len(matches)))
    for m in matches[:3]:
        print('  %s' % m.strip()[:80])

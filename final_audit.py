import re
from collections import Counter
import unicodedata

html = open('memorial_admin.html', encoding='utf-8').read()
static = re.sub(r'<script.*?</script>', '', html, flags=re.S)
m = re.search(r'<script[^>]*>(.*?)</script>', html, re.S)
script = m.group(1)

# div
o = len(re.findall(r'<div[ >]', static))
c = len(re.findall(r'</div>', static))
print('div: open=%d close=%d %s' % (o, c, 'OK' if o==c else 'MISMATCH'))

# font sizes
sizes = Counter(re.findall(r'font-size\s*:\s*([\d.]+px)', html))
print('폰트 종류: %d개' % len(sizes))

# emoji h2
h2s = re.findall(r'<h2[^>]*>(.*?)</h2>', static, re.S)
emoji_h2 = 0
for h in h2s:
    if any(unicodedata.category(c) == 'So' for c in h):
        emoji_h2 += 1
print('이모지 h2 잔존: %d개' % emoji_h2)

# aria
aria = len(re.findall(r'aria-\w+', static))
print('aria: %d개' % aria)

# empty-state
es = len(re.findall(r'empty-state', html))
print('empty-state: %d개' % es)

# zone, step, ti
print('zone-tab-btn: %d개' % html.count('zone-tab-btn'))
print('nc-step-bar: %d개' % html.count('nc-step-bar'))
print('ti ti-: %d개' % html.count('ti ti-'))

# null refs
refs = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)\.addEventListener", script)
all_ids = set(re.findall(r'id="([^"]+)"', static))
dynamic = {'te-msg','te-cancel-btn','te-save-btn','sm-type','sm-tmpl','sm-send'}
null_refs = [r for r in refs if r not in all_ids and r not in dynamic]
print('null refs: %s' % ('0 ✅' if not null_refs else str(null_refs)))

print('총 %dKB / %d줄' % (len(html)//1024, len(html.splitlines())))

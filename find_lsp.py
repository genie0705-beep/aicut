import re
html = open('memorial_admin.html', encoding='utf-8').read()
m = re.findall(r'id="[^"]*lsp[^"]*"', html, re.I)
print('Found:', m if m else 'none')
if not m:
    # search for close buttons
    m2 = re.findall(r'id="[^"]*close[^"]*"', html, re.I)
    print('Close buttons:', m2[:5])

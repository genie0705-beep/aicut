import re
html = open('memorial_admin.html', encoding='utf-8').read()
ids = ['loc-filter-tabs', 'fee-filter-tabs', 'contract-filter-tabs']
for i in ids:
    m = re.search('id="' + i + '"[^>]*', html)
    if m:
        print(i + ':', m.group()[:80])
    else:
        print(i + ': NOT FOUND')

html = open('memorial_admin.html', encoding='utf-8').read()
ids = ['loc-filter-tabs', 'fee-filter-tabs', 'contract-filter-tabs']
for i in ids:
    count = html.count('id="' + i + '"')
    print(i, ':', count)

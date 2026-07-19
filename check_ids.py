html = open('memorial_admin.html', encoding='utf-8').read()
ids = ['notif-btn', 'notif-close', 'lsp-close', 'logout-btn']
for i in ids:
    count = html.count('id="' + i + '"')
    print(i, ':', count)

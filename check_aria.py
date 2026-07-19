html = open('memorial_admin.html', encoding='utf-8').read()
print('aria- count:', html.count('aria-'))
print('role="dialog" count:', html.count('role="dialog"'))
print('role="tablist" count:', html.count('role="tablist"'))

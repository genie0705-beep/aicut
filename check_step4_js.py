import re
html = open('memorial_admin.html', encoding='utf-8').read()
m = re.search(r'function updateNCStep', html)
if m:
    print('updateNCStep function at', m.start())
    print(html[m.start():m.start()+500])
else:
    print('updateNCStep function NOT found')
    
# Also check IntersectionObserver
io = 'IntersectionObserver' in html
print('\nIntersectionObserver:', 'yes' if io else 'no')

import re
html = open('memorial_admin.html', encoding='utf-8').read()
m = re.search(r'id="nc-step-bar"', html)
if m:
    print('nc-step-bar found')
    print(html[m.start():m.start()+1000])
    print('---')
    # Check updateNCStep function
    print('updateNCStep:', html.count('updateNCStep'))
else:
    print('nc-step-bar NOT found')

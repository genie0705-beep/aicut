import re
html = open('memorial_admin.html', encoding='utf-8').read()
m = re.search(r'<script>', html)
s = html[m.end():]

# Find the end of the loc-filter handler
p = s.find('locationClickHandler')
context = s[p-300:p+100]
print(context)

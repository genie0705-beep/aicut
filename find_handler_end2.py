import re
html = open('memorial_admin.html', encoding='utf-8').read()
m = re.search(r'<script>', html)
s = html[m.end():]

# The handler ends around position 27665. Let me see the exact text
p = 27600
context = s[p:p+300]
print('Position 27600-27900:')
print(context)

# Find the first loc-filter-tabs handler start
p2 = s.find("loc-filter-tabs")
print('\nloc-filter-tabs first mention at:', p2)
print(s[p2-50:p2+200])

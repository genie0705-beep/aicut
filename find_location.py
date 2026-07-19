import re
html = open('memorial_admin.html', encoding='utf-8').read()
m = re.search(r'id="loc-filter-tabs"', html)
start = max(0, m.start() - 300)
end = min(len(html), m.end() + 200)
context = html[start:end]
# find the nearest div closing before loc-filter-tabs
lines = context.split('\n')
for i, line in enumerate(lines):
    print('%4d: %s' % (i, line[:120]))

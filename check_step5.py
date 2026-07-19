import re
html = open('memorial_admin.html', encoding='utf-8').read()

# Check CSS
print('CSS .empty-state:', '.empty-state' in html)

# Check function
print('function emptyState:', 'function emptyState' in html)

# Check 5 patterns
patterns = [
    ('1. coin-off', 'coin-off'),
    ('2. history-off', 'history-off'),
    ('3. circle-check', 'circle-check'),
    ('4. calendar-off', 'calendar-off'),
    ('5. send-off', 'send-off'),
]
for name, pat in patterns:
    print('  %s: %d' % (name, html.count(pat)))

# Check total emptyState calls
total = len(re.findall(r'emptyState\(', html))
print('total emptyState() calls:', total)

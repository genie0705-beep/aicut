import re

with open('memorial_admin.html', encoding='utf-8') as f:
    html = f.read()

print('#888 before:', html.count('#888'))
print('#1C1F1E before:', html.count('#1C1F1E'))

# Replace #888 with var(--ink-400) - only exact 3-digit hex
html = re.sub(r'(?<![#\w])#888(?![#\w])', 'var(--ink-400)', html)

# Replace #1C1F1E and #1c1f1e
html = html.replace('#1C1F1E', 'var(--ink-900)')
html = html.replace('#1c1f1e', 'var(--ink-900)')

print('#888 after:', html.count('#888'))
print('var(--ink-400) new:', html.count('var(--ink-400)'))
print('#1C1F1E after:', html.count('#1C1F1E'))

with open('memorial_admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('STEP B done')

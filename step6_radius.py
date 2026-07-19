import re

with open('memorial_admin.html', encoding='utf-8') as f:
    html = f.read()

# Count before
print('border-radius:4px before:', html.count('border-radius:4px'))
print('border-radius:10px before:', html.count('border-radius:10px'))
print('border-radius:12px before:', html.count('border-radius:12px'))

# Replace (using regex to avoid partial matches like 40px catching 4px)
html = re.sub(r'border-radius:4px(?!\d)', 'border-radius:var(--radius-xs)', html)
html = re.sub(r'border-radius:10px(?!\d)', 'border-radius:var(--radius-sm)', html)
html = re.sub(r'border-radius:12px(?!\d)', 'border-radius:var(--radius-sm)', html)

# Count after
print('border-radius:4px after:', html.count('border-radius:4px'))
print('border-radius:10px after:', html.count('border-radius:10px'))
print('border-radius:12px after:', html.count('border-radius:12px'))

with open('memorial_admin.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('STEP C done')

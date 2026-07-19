import re
with open('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html','r',encoding='utf-8') as f:
    html = f.read()

# Remove script/style content for div count
no_scripts = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
no_styles = re.sub(r'<style[^>]*>.*?</style>', '', no_scripts, flags=re.DOTALL | re.IGNORECASE)

# Find :before and ::before pseudo-elements that contain '<div' - exclude those
# Count just HTML div tags
opens = len(re.findall(r'<div\b', no_styles, re.IGNORECASE))
closes = len(re.findall(r'</div>', no_styles, re.IGNORECASE))

print(f'<div> opens: {opens}')
print(f'</div> closes: {closes}')
print(f'Balance: {opens - closes}')
print(f'Balanced: {"YES" if opens == closes else "NO"}')

# Trace to find where balance drops
lines = no_styles.split('\n')
balance = 0
for i, line in enumerate(lines):
    o = len(re.findall(r'<div\b', line, re.IGNORECASE))
    c = len(re.findall(r'</div>', line, re.IGNORECASE))
    if o or c:
        balance += o - c
        if balance < 0:
            print(f'First negative: L{i+1}, balance={balance}')
            for j in range(max(0,i-2), min(len(lines), i+3)):
                print(f'  ctx L{j+1}: {lines[j].strip()[:100]}')
            break

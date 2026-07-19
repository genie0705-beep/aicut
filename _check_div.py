import re
with open('C:/Users/paul/.openclaw/workspace/memorial_admin_logs.html','r',encoding='utf-8') as f:
    html = f.read()
lines = html.split('\n')
balance = 0

# Trace div balance from login overlay through end
for i in range(400, min(1760, len(lines))):
    line = lines[i]
    opens = len(re.findall(r'<div\b', line))
    closes = len(re.findall(r'</div>', line))
    if opens or closes:
        balance += opens - closes
        if balance < 0:
            print(f'L{i+1}: balance={balance} | {line.strip()[:100]}')
            # Show context
            for j in range(max(396, i-3), i+1):
                print(f'  ctx L{j+1}: {lines[j].strip()[:80]}')
            break

print(f'\nFinal balance: {balance}')

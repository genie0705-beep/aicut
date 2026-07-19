import re
html = open('memorial_admin.html', encoding='utf-8').read()
lines = html.split('\n')

# script 태그 제외하고 div balance 검사
in_script = False
balance = 0
line_num = 0
min_balance = 0
min_line = 0

for i, line in enumerate(lines):
    if '<script' in line and 'script>' not in line:
        in_script = True
    if '</script>' in line:
        in_script = False
        continue
    if in_script:
        continue
    
    opens = len(re.findall(r'<div[ >]', line))
    closes = len(re.findall(r'</div>', line))
    balance += opens - closes
    
    if balance < min_balance:
        min_balance = balance
        min_line = i + 1

print('Final balance:', balance)
print('Min balance:', min_balance, 'at line', min_line)

# extra </div> 찾기
balance = 0
for i, line in enumerate(lines):
    if '<script' in line and 'script>' not in line:
        in_script = True
    if '</script>' in line:
        in_script = False
        continue
    if in_script:
        continue
    
    opens = len(re.findall(r'<div[ >]', line))
    closes = len(re.findall(r'</div>', line))
    
    if balance == 0 and closes > opens:
        print('Extra </div> at line %d: %s' % (i+1, line.strip()[:80]))
        break
    
    balance += opens - closes

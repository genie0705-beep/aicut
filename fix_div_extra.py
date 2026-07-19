import re
html = open('memorial_admin.html', encoding='utf-8').read()
lines = html.split('\n')

# line 1987 앞뒤 컨텍스트
for i in range(1980, 1995):
    line = lines[i-1]  # 0-indexed
    opens = len(re.findall(r'<div[ >]', line))
    closes = len(re.findall(r'</div>', line))
    if opens or closes:
        marker = ''
        if opens > closes: marker = ' <<< OPENS'
        elif closes > opens: marker = ' <<< CLOSES'
        print('L%d: %s%s' % (i, line.strip()[:80], marker))
    else:
        print('L%d: %s' % (i, line.strip()[:80]))

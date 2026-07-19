import re, os, tempfile
html = open('memorial_admin.html', encoding='utf-8').read()
lines = html.splitlines()
print('lines:', len(lines))
print('size:', len(lines))
print('size:', len(html)//1024, 'KB')

# div balance - script 제외
static = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.S)
o = len(re.findall(r'<div[ >]', static))
c = len(re.findall(r'</div>', static))
status = 'OK' if o == c else 'MISMATCH'
print('div: open=%d close=%d %s' % (o, c, status))

# JS 추출 및 검사
m = re.search(r'<script[^>]*>(.*?)</script>', html, re.S)
if m:
    js_path = os.path.join(tempfile.gettempdir(), 'chk.js')
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(m.group(1))
    print('JS extracted to:', js_path)
else:
    print('no script tag')

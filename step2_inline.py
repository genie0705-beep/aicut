import re
html = open('memorial_admin.html', encoding='utf-8').read()

mapping = {
 '6px': '11px', '7px': '11px', '8px': '11px',
 '9px': '11px', '9.5px': '11px',
 '10px': '12px', '10.5px': '12px',
 '11px': '11px', '11.5px': '11px',
 '12px': '12px', '12.5px': '12px',
 '13px': '13px', '13.5px': '13px',
 '14px': '14px', '15px': '14px',
 '16px': '16px', '17px': '16px', '18px': '16px',
 '19px': '20px', '23px': '20px', '24px': '20px', '28px': '20px', '32px': '20px', '36px': '20px',
}

def replace_fs(m):
 val = m.group(1).strip()
 return 'font-size:' + mapping.get(val, val)

html = re.sub(r'font-size\s*:\s*([\d.]+px)', replace_fs, html)
open('memorial_admin.html', 'w', encoding='utf-8').write(html)
print('STEP C done')

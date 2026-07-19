import re

# Check the TODAY backup for pre-existing div balance
with open('C:/Users/paul/.openclaw/workspace/memorial_admin_logs_today.html','r',encoding='utf-8') as f:
    html = f.read()

# Remove script and style content
no_scripts = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
no_styles = re.sub(r'<style[^>]*>.*?</style>', '', no_scripts, flags=re.DOTALL | re.IGNORECASE)
opens = len(re.findall(r'<div\b', no_styles, re.IGNORECASE))
closes = len(re.findall(r'</div>', no_styles, re.IGNORECASE))
print(f'BACKUP (today): <div> opens={opens}, closes={closes}, balanced={opens==closes}')

# Also check - 복사본
with open('C:/Users/paul/.openclaw/workspace/memorial_admin_logs - 복사본.html','r',encoding='utf-8') as f:
    html2 = f.read()
no_scripts2 = re.sub(r'<script[^>]*>.*?</script>', '', html2, flags=re.DOTALL | re.IGNORECASE)
no_styles2 = re.sub(r'<style[^>]*>.*?</style>', '', no_scripts2, flags=re.DOTALL | re.IGNORECASE)
opens2 = len(re.findall(r'<div\b', no_styles2, re.IGNORECASE))
closes2 = len(re.findall(r'</div>', no_styles2, re.IGNORECASE))
print(f'BACKUP (- 복사본): <div> opens={opens2}, closes={closes2}, balanced={opens2==closes2}')

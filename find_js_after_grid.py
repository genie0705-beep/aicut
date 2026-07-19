import re
html = open('memorial_admin.html', encoding='utf-8').read()
m = re.search(r'<script>', html)
s = html[m.end():]

# find buildLocationGrid
p = s.find('buildLocationGrid')
if p >= 0:
    # find the function end and look for filter handler after it
    after = s[p:p+5000]
    # look for loc-filter-tabs or tab-btn click handlers
    kw_pos = after.find('loc-filter')
    if kw_pos >= 0:
        print('loc-filter found in buildLocationGrid area:')
        print(after[kw_pos:kw_pos+300])
    else:
        print('No loc-filter in buildLocationGrid area')
else:
    print('buildLocationGrid not found in script')

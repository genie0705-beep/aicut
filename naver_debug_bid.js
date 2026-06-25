const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  const debug = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const targets = ['영상편집', '동영상편집', '영상제작', '동영상제작', '숏폼영상제작', '인스타그램릴스'];
    const results = [];

    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      const keywordEl = row.querySelector('.keyword_text') || cells[2];
      const keyword = (keywordEl?.innerText || cells[2]?.innerText || '').trim().replace(/\s+/g, ' ');

      if (!targets.some(t => keyword.includes(t))) return;

      // Find all inputs in the row
      const allInputs = row.querySelectorAll('input');
      const textInputs = row.querySelectorAll('input[type="text"]');

      results.push({
        keyword: keyword,
        status: (cells[3]?.innerText || '').trim(),
        inputCount: allInputs.length,
        textInputCount: textInputs.length,
        inputs: Array.from(allInputs).map(i => ({
          type: i.type || 'no-type',
          value: i.value,
          placeholder: i.placeholder || '',
          id: i.id || '',
          className: i.className?.substring(0, 50) || ''
        })),
        bidCell: (cells[4]?.innerText || '').trim()
      });
    });

    return results;
  });

  console.log('=== 디버그 ===');
  debug.forEach(d => {
    console.log('\n--- ' + d.keyword + ' ---');
    console.log('상태: ' + d.status);
    console.log('input 개수: ' + d.inputCount + ' (text: ' + d.textInputCount + ')');
    console.log('입력필드들:');
    d.inputs.forEach(i => console.log('  type=' + i.type + ' value="' + i.value + '" placeholder="' + i.placeholder + '" id="' + i.id + '" class="' + i.className + '"'));
    console.log('bid cell text: ' + d.bidCell);
  });

  await b.close();
})().catch(e => console.log('ERR:', e.message));

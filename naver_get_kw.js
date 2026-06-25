const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 5000));

  const kws = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      const keywordEl = row.querySelector('.keyword_text') || cells[2];
      const bidEl = row.querySelector('input[type="text"]');
      return {
        keyword: (keywordEl?.innerText || cells[2]?.innerText || '').trim(),
        status: (cells[3]?.innerText || '').trim(),
        bid: bidEl ? bidEl.value : (cells[4]?.innerText || '').trim(),
        impressions: (cells[7]?.innerText || '0').trim(),
        clicks: (cells[8]?.innerText || '0').trim()
      };
    }).filter(k => k.keyword && k.keyword !== '키워드' && k.keyword.length > 1);
  });

  console.log('=== 현재 키워드 목록 ===');
  kws.forEach((k, i) => {
    console.log((i+1) + '. ' + k.keyword + ' | 상태:' + k.status + ' | 입찰가:' + k.bid + ' | 노출:' + k.impressions + ' | 클릭:' + k.clicks);
  });
  console.log('\n총 ' + kws.length + '개 키워드');

  await b.close();
})().catch(e => console.log('ERR:', e.message));

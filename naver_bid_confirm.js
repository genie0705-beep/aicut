const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "변경" 버튼 클릭
  const r = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '변경' && !b.disabled);
    if (btn) { btn.click(); return '변경 클릭'; }
    return '없음';
  });
  console.log(r);
  await sleep(3000);

  await page.screenshot({ path: 'naver_bid_done.png' });

  // 결과 확인
  const result = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      const text = cells.map(c => c.innerText?.trim()).join(' | ');
      return text;
    }).filter(r => r && r.includes('노출가능')).slice(0, 5);
  });
  console.log('변경 후 키워드:', result);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

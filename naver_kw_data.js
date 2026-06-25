const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 페이지당 50개로 변경
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('[class*="ad-cms-select"]'));
    const pageSel = selects.find(el => el.innerText?.includes('/ 페이지'));
    if (pageSel) pageSel.click();
  });
  await sleep(1000);

  // 50개 옵션 클릭
  const r = await page.evaluate(() => {
    const opts = Array.from(document.querySelectorAll('li, [role="option"]'));
    const opt50 = opts.find(el => el.innerText?.trim() === '50');
    if (opt50) { opt50.click(); return '50개로 변경'; }
    return '없음';
  });
  console.log(r);
  await sleep(2000);

  // 키워드 테이블 데이터 수집
  const kwTable = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr, [class*="table-row"]'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td, [class*="table-cell"]'));
      return cells.map(c => c.innerText?.trim().replace(/\n/g,' ')).filter(t=>t).join(' | ');
    }).filter(r => r && r.includes('|')).slice(0, 60);
  });
  console.log('키워드 데이터:');
  kwTable.forEach(row => console.log(row));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

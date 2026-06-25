const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 페이지당 100개로 변경
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const sel = selects.find(s => s.options && Array.from(s.options).some(o => o.value === '100'));
    if (sel) { sel.value = '100'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await new Promise(r => setTimeout(r, 3000));

  const allKeywords = [];
  let page_num = 1;

  while (true) {
    const rows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr, [role="row"]'));
      return rows.map(r => r.innerText?.trim()).filter(t => t && t.length > 3 && !t.includes('ON/OFF') && !t.includes('키워드\n상태'));
    });

    for (const row of rows) {
      const parts = row.split('\t').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3 && !parts[0].includes('결과') && !parts[0].includes('전체')) {
        allKeywords.push(parts);
      }
    }

    // 다음 페이지 확인
    const hasNext = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const next = btns.find(b => b.innerText?.trim() === '다음' || b.getAttribute('aria-label') === '다음 페이지');
      return next && !next.disabled;
    });

    if (!hasNext || page_num >= 5) break;
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const next = btns.find(b => b.innerText?.trim() === '다음' || b.getAttribute('aria-label') === '다음 페이지');
      if (next) next.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    page_num++;
  }

  console.log(`\n=== 전체 키워드 데이터 (${allKeywords.length}행) ===`);
  allKeywords.forEach((row, i) => {
    const keyword = row[1] || row[0];
    const status = row[2] || '';
    const impressions = row.find(r => /^\d+$/.test(r.replace(/,/g,''))) || '0';
    const clicks = row[row.indexOf(impressions) + 1] || '0';
    const ctr = row.find(r => r.includes('%')) || '0%';
    const cost = row.find(r => r.includes('원') && r !== '원') || '0원';
    console.log(`${i+1}. ${keyword} | ${status} | 노출:${impressions} | 클릭:${clicks} | CTR:${ctr} | 비용:${cost}`);
  });

  await b.close();
})().catch(e => console.error('ERR:', e.message));

const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  const allKws = [];

  async function extractPage() {
    await new Promise(r => setTimeout(r, 2000));
    return await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText?.trim().replace(/\s+/g, ' '));
        return cells;
      }).filter(c => c.length >= 9 && c[2] && c[2].length > 1 && c[2] !== '키워드');
    });
  }

  // 1페이지
  const p1 = await extractPage();
  allKws.push(...p1);
  console.log(`페이지 1: ${p1.length}개`);

  // 2~10 페이지 - 텍스트 기반 페이지 버튼 클릭
  for (let pNum = 2; pNum <= 10; pNum++) {
    const clicked = await page.evaluate((targetPage) => {
      // 페이지 번호 li 또는 button 중 텍스트가 일치하는 것
      const allEls = Array.from(document.querySelectorAll('button, li, a, span'));
      const el = allEls.find(e => {
        const t = e.innerText?.trim();
        return t === String(targetPage) && e.offsetParent !== null;
      });
      if (el) {
        el.click();
        return true;
      }
      return false;
    }, pNum);

    if (!clicked) {
      // "다음" 버튼으로 시도
      const nextClicked = await page.evaluate(() => {
        const allEls = Array.from(document.querySelectorAll('button, li, a'));
        const nextEl = allEls.find(e => e.innerText?.trim() === '다음' || e.getAttribute('aria-label') === '다음');
        if (nextEl && !nextEl.disabled) { nextEl.click(); return true; }
        return false;
      });
      if (!nextClicked) { console.log(`페이지 ${pNum} 버튼 없음, 종료`); break; }
    }

    const rows = await extractPage();
    if (rows.length === 0) { console.log(`페이지 ${pNum} 데이터 없음, 종료`); break; }
    allKws.push(...rows);
    console.log(`페이지 ${pNum}: ${rows.length}개`);
  }

  // 중복 제거
  const seen = new Set();
  const unique = allKws.filter(row => {
    if (seen.has(row[2])) return false;
    seen.add(row[2]);
    return true;
  });

  console.log(`\n=== 총 ${unique.length}개 키워드 ===\n`);

  // 파싱
  const parsed = unique.map(row => ({
    keyword: row[2] || '',
    status: row[3] || '',
    bid: row[4] || '',
    impressions: parseInt((row[7]||'0').replace(/[^0-9]/g,'')) || 0,
    clicks: parseInt((row[8]||'0').replace(/[^0-9]/g,'')) || 0,
    ctr: row[9] || '0%',
    avgCpc: row[11] || '0원',
    cost: row[12] || '0원'
  }));

  const withClicks = parsed.filter(k => k.clicks > 0).sort((a,b) => b.clicks - a.clicks);
  const withImpOnly = parsed.filter(k => k.impressions > 0 && k.clicks === 0).sort((a,b) => b.impressions - a.impressions);
  const noImp = parsed.filter(k => k.impressions === 0);

  console.log(`📊 클릭 발생 (${withClicks.length}개):`);
  withClicks.forEach(k => console.log(`  ${k.keyword}: 노출${k.impressions} 클릭${k.clicks} CTR${k.ctr} CPC${k.avgCpc} 비용${k.cost}`));

  console.log(`\n⚠️ 노출O 클릭0 (${withImpOnly.length}개):`);
  withImpOnly.forEach(k => console.log(`  ${k.keyword}: 노출${k.impressions} 입찰가${k.bid}`));

  console.log(`\n❌ 노출0 (${noImp.length}개):`);
  noImp.forEach(k => console.log(`  ${k.keyword} | ${k.status} | ${k.bid}`));

  await b.close();
})().catch(e => console.error('ERR:', e.message));

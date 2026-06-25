const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  const allKeywords = [];

  async function extractPage() {
    const rows = await page.evaluate(() => {
      const results = [];
      const tbodyRows = document.querySelectorAll('tbody tr');
      for (const row of tbodyRows) {
        const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText?.trim().replace(/\n/g, ' '));
        if (cells.length >= 5 && cells[2]) results.push(cells);
      }
      return results;
    });
    return rows;
  }

  // 전체 페이지 순회
  for (let p = 1; p <= 10; p++) {
    const rows = await extractPage();
    console.log(`페이지 ${p}: ${rows.length}행`);
    allKeywords.push(...rows);

    // 다음 페이지 버튼 확인
    const nextBtn = await page.evaluate(() => {
      // 페이지네이션에서 현재 다음 숫자 찾기
      const pager = document.querySelector('[class*="pagination"], [class*="Pagination"]');
      if (!pager) return null;
      const btns = Array.from(pager.querySelectorAll('button, a'));
      const activeIdx = btns.findIndex(b => b.classList.contains('active') || b.getAttribute('aria-current') === 'page');
      const nextBtn = btns[activeIdx + 1];
      if (nextBtn && !nextBtn.disabled) { nextBtn.click(); return true; }
      // 다음 > 버튼
      const nextArrow = btns.find(b => b.getAttribute('aria-label')?.includes('다음') || b.innerText?.trim() === '>');
      if (nextArrow && !nextArrow.disabled) { nextArrow.click(); return true; }
      return false;
    });

    if (!nextBtn || rows.length < 10) break;
    await new Promise(r => setTimeout(r, 2000));
  }

  // 성과 분석
  console.log(`\n=== 전체 키워드 ${allKeywords.length}개 분석 ===\n`);

  const parsed = allKeywords.map(row => ({
    keyword: row[2] || '',
    status: row[3] || '',
    bid: row[4] || '',
    impressions: parseInt((row[7] || '0').replace(/,/g, '')) || 0,
    clicks: parseInt((row[8] || '0').replace(/,/g, '')) || 0,
    ctr: parseFloat((row[9] || '0').replace('%','')) || 0,
    avgCpc: (row[11] || '0원'),
    cost: (row[12] || '0원')
  }));

  // 클릭 있는 키워드
  const withClicks = parsed.filter(k => k.clicks > 0).sort((a,b) => b.clicks - a.clicks);
  console.log('📊 클릭 발생 키워드:');
  withClicks.forEach(k => console.log(`  ${k.keyword}: 노출${k.impressions} 클릭${k.clicks} CTR${k.ctr}% 평균CPC${k.avgCpc}`));

  // 노출은 있는데 클릭 없는 키워드 (CTR 개선 필요)
  const noClick = parsed.filter(k => k.impressions > 0 && k.clicks === 0);
  console.log(`\n⚠️ 노출 있는데 클릭 없는 키워드 (${noClick.length}개):`);
  noClick.sort((a,b) => b.impressions - a.impressions).slice(0,10).forEach(k =>
    console.log(`  ${k.keyword}: 노출${k.impressions}`)
  );

  // 노출 0 키워드
  const noImpression = parsed.filter(k => k.impressions === 0);
  console.log(`\n❌ 노출 0 키워드: ${noImpression.length}개`);
  noImpression.slice(0,15).forEach(k => console.log(`  ${k.keyword} (${k.status})`));

  await b.close();
})().catch(e => console.error('ERR:', e.message));

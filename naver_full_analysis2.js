const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  const allKeywords = [];

  async function extractCurrentPage() {
    return await page.evaluate(() => {
      const results = [];
      const rows = document.querySelectorAll('tbody tr');
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText?.trim().replace(/\n/g, ' '));
        if (cells.length >= 5 && cells[2] && cells[2].length > 0 && !cells[2].includes('결과')) {
          results.push({
            keyword: cells[2],
            status: cells[3],
            bid: cells[4],
            impressions: parseInt((cells[7]||'0').replace(/[^0-9]/g,'')) || 0,
            clicks: parseInt((cells[8]||'0').replace(/[^0-9]/g,'')) || 0,
            ctr: cells[9] || '0%',
            avgCpc: cells[11] || '0원',
            cost: cells[12] || '0원'
          });
        }
      }
      return results;
    });
  }

  // 현재 페이지
  let rows = await extractCurrentPage();
  allKeywords.push(...rows);
  console.log(`페이지 1: ${rows.length}개`);

  // 페이지 번호 버튼들 확인
  const pageButtons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.filter(b => /^\d+$/.test(b.innerText?.trim())).map(b => ({
      num: parseInt(b.innerText.trim()),
      text: b.innerText.trim()
    }));
  });
  console.log('페이지 버튼:', pageButtons.map(p => p.num));

  // 각 페이지 순회
  for (const pb of pageButtons) {
    if (pb.num <= 1) continue;
    const clicked = await page.evaluate((num) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.trim() === String(num));
      if (btn) { btn.click(); return true; }
      return false;
    }, pb.num);
    if (clicked) {
      await new Promise(r => setTimeout(r, 2000));
      const pageRows = await extractCurrentPage();
      allKeywords.push(...pageRows);
      console.log(`페이지 ${pb.num}: ${pageRows.length}개`);
    }
  }

  // "다음" 버튼으로 이어지는 페이지들
  let hasMore = true;
  while (hasMore) {
    hasMore = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText?.trim() === '다음' || b.innerText?.trim() === '>>' || b.getAttribute('aria-label') === '다음');
      if (nextBtn && !nextBtn.disabled) { nextBtn.click(); return true; }
      return false;
    });
    if (hasMore) {
      await new Promise(r => setTimeout(r, 2000));
      const moreRows = await extractCurrentPage();
      if (moreRows.length === 0) break;
      allKeywords.push(...moreRows);
      console.log(`다음 페이지: ${moreRows.length}개`);

      // 이 페이지의 번호 버튼들도 클릭
      const moreBtns = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.filter(b => /^\d+$/.test(b.innerText?.trim()) && !b.classList.contains('active'))
          .map(b => parseInt(b.innerText.trim())).filter(n => n > 1);
      });
      for (const n of moreBtns) {
        const alreadyHave = allKeywords.length;
        await page.evaluate((num) => {
          const btns = Array.from(document.querySelectorAll('button'));
          const btn = btns.find(b => b.innerText?.trim() === String(num));
          if (btn) btn.click();
        }, n);
        await new Promise(r => setTimeout(r, 2000));
        const nRows = await extractCurrentPage();
        allKeywords.push(...nRows);
        console.log(`페이지 ${n}: ${nRows.length}개`);
      }
    }
  }

  // 중복 제거
  const unique = allKeywords.filter((k, i, arr) => arr.findIndex(x => x.keyword === k.keyword) === i);
  console.log(`\n=== 총 ${unique.length}개 키워드 분석 ===`);

  const withClicks = unique.filter(k => k.clicks > 0).sort((a,b) => b.clicks - a.clicks);
  const withImpOnly = unique.filter(k => k.impressions > 0 && k.clicks === 0).sort((a,b) => b.impressions - a.impressions);
  const noImp = unique.filter(k => k.impressions === 0);

  console.log(`\n📊 클릭 발생 키워드 (${withClicks.length}개):`);
  withClicks.forEach(k => console.log(`  ${k.keyword}: 노출${k.impressions} 클릭${k.clicks} CTR${k.ctr} 평균CPC${k.avgCpc} 비용${k.cost}`));

  console.log(`\n⚠️ 노출O 클릭0 키워드 (${withImpOnly.length}개 - 소재/입찰가 검토 필요):`);
  withImpOnly.forEach(k => console.log(`  ${k.keyword}: 노출${k.impressions} 입찰가${k.bid}`));

  console.log(`\n❌ 노출 0 키워드 (${noImp.length}개):`);
  noImp.forEach(k => console.log(`  ${k.keyword} (${k.status}) 입찰가:${k.bid}`));

  await b.close();
})().catch(e => console.error('ERR:', e.message));

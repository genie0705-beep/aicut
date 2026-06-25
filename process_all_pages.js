const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('ads.naver.com/manage'));
  if (!page) page = await ctx.newPage();

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', {
    waitUntil: 'domcontentloaded', timeout: 20000
  });
  await sleep(6000);

  let totalOff = 0;
  let totalKept = 0;
  let allKeywordsProcessed = [];

  for (let pg = 1; pg <= 10; pg++) {
    await sleep(3000);
    
    // 스크롤 다운 (페이지 버튼 활성화)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(1000);

    // 현재 페이지 키워드 수집
    const pageInfo = await page.evaluate(() => {
      const switches = document.querySelectorAll('[role="switch"]');
      const result = [];
      switches.forEach((s, i) => {
        if (i === 0) return; // skip header
        const parent = s.closest('[class*="row"], [class*="Row"], tr');
        let keyword = '';
        if (parent) {
          const kwSpan = parent.querySelector('[class*="keyword"], [class*="sc-"]');
          if (kwSpan) keyword = kwSpan.innerText.replace(/\n/g, ' ').trim();
        }
        result.push({ idx: i, keyword, checked: s.getAttribute('aria-checked') === 'true' });
      });
      return result;
    });

    console.log(`\n=== 페이지 ${pg} ===`);
    pageInfo.forEach(k => console.log(`  ${k.checked ? 'ON ' : 'OFF'} ${k.keyword}`));

    // 키워드별 처리
    for (const kw of pageInfo) {
      const name = kw.keyword || '';
      allKeywordsProcessed.push(name);
      
      if (!kw.checked) {
        console.log(`  → 이미 OFF: ${name}`);
        continue;
      }

      // OFF 조건
      const shouldOff = 
        name.includes('적은검색량') ||
        name.includes('비용') ||
        name === '기업유튜브운영';

      if (shouldOff) {
        console.log(`  → OFF 처리: ${name}`);
        const switchEl = await page.locator('[role="switch"]').nth(kw.idx);
        await switchEl.click();
        await sleep(500);
        totalOff++;
      } else {
        console.log(`  → KEEP: ${name}`);
        totalKept++;
      }
    }

    // 다음 페이지로 이동
    if (pg < 10) {
      const nextPg = pg + 1;
      const clicked = await page.evaluate((n) => {
        // scroll to pagination area first
        window.scrollTo(0, 700);
        
        const allEls = document.querySelectorAll('button, a, span, div');
        for (const el of allEls) {
          if (el.innerText.trim() === String(n) && el.offsetParent !== null) {
            el.click();
            return 'clicked ' + n + ' (' + el.tagName + ')';
          }
        }
        return 'not found';
      }, nextPg);
      
      console.log(`  → ${nextPg}페이지: ${clicked}`);
      if (clicked.includes('not found')) break;
    }
  }

  console.log(`\n✅ 전체 처리 완료`);
  console.log(`OFF: ${totalOff}개, KEEP: ${totalKept}개`);
  console.log(`처리된 키워드: ${allKeywordsProcessed.length}개`);

  await b.close();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

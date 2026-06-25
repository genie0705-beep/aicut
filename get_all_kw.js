const { chromium } = require('playwright');
const path = require('path');

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

  // 1. 페이지당 표시 수 변경 시도: "10 / 페이지" 클릭
  const pageSizeClick = await page.evaluate(() => {
    // 페이지 사이즈 셀렉터 찾기
    const selectors = document.querySelectorAll('.ad-cms-select, [class*="pagination"], select');
    for (const sel of selectors) {
      if (sel.innerText.includes('페이지')) {
        sel.click();
        return 'clicked: ' + sel.innerText.substring(0, 20);
      }
    }
    return 'not found';
  });
  console.log('페이지 사이즈 셀렉터:', pageSizeClick);
  await sleep(2000);

  // 옵션 리스트에서 "100" 찾기
  const optionClick = await page.evaluate(() => {
    const items = document.querySelectorAll('[class*="option"], [class*="Option"], li, [role="option"]');
    for (const item of items) {
      const text = item.innerText.trim();
      if (text === '100' || text === '100개' || text === '100 / 페이지') {
        item.click();
        return 'clicked: ' + text;
      }
    }
    return '100 option not found';
  });
  console.log('100개 선택:', optionClick);
  await sleep(4000);

  // 2. 이제 보이는 모든 키워드 수집
  const allKeywords = await page.evaluate(() => {
    const kwSpans = document.querySelectorAll('.keyword, [class*="keyword"], span[class*="sc-"]');
    const kws = [];
    kwSpans.forEach(s => {
      const text = s.innerText.trim();
      if (text && text.length > 1 && text.length < 25 && text !== '키워드' && !text.startsWith('키워드') && /[가-힣a-zA-Z]/.test(text)) {
        kws.push(text);
      }
    });
    // 중복 제거
    return [...new Set(kws)];
  });
  console.log(`\n=== 전체 키워드 ${allKeywords.length}개 ===`);
  allKeywords.forEach((k, i) => console.log(`  [${i+1}] ${k}`));

  await b.close();
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(3000);

  // "chevron_right" 아이콘 클릭 - 자세히 보기 버튼들
  const chevrons = await saPage.$$('[class*=chevron_right], [class*=chevron]');
  console.log(`chevron 버튼 수: ${chevrons.length}`);

  for (let i = 0; i < Math.min(chevrons.length, 3); i++) {
    console.log(`\n=== chevron ${i+1} 클릭 ===`);
    try {
      await chevrons[i].click();
      await saPage.waitForTimeout(4000);
      const text = await saPage.evaluate(() => document.body.innerText);
      console.log(`URL: ${saPage.url()}`);
      console.log(text.substring(0, 3000));
    } catch(e) {
      console.log(`클릭 실패: ${e.message}`);
    }
  }

  // 만약 위 방식으로 안 되면, 사이드바 "리포트" 메뉴로 이동
  if (saPage.url().includes('summary')) {
    console.log('\n=== 리포트 메뉴로 직접 이동 ===');
    // 리포트 하위 메뉴들 보기 위해 expand_more 클릭
    const expandBtns = await saPage.$$('text=expand_more');
    console.log(`expand_more 버튼 수: ${expandBtns.length}`);
    if (expandBtns.length > 0) {
      await expandBtns[0].click();
      await saPage.waitForTimeout(2000);
      const text = await saPage.evaluate(() => document.body.innerText);
      console.log(text.substring(0, 3000));
    }
  }

  await browser.close();
})();

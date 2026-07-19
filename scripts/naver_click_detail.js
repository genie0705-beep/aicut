const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (!saPage) { console.log('탭 없음'); await browser.close(); return; }

  await saPage.bringToFront();
  await saPage.goto('https://searchadvisor.naver.com/console/site/summary?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await saPage.waitForTimeout(2000);

  // locator로 "자세히 보기" 버튼 찾아서 클릭
  const detailBtns = saPage.locator('a:has-text("자세히 보기")');
  const count = await detailBtns.count();
  console.log(`자세히 보기 버튼 수: ${count}`);

  for (let i = 0; i < count; i++) {
    console.log(`\n=== 자세히 보기 ${i+1} 클릭 ===`);
    try {
      await detailBtns.nth(i).click();
      await saPage.waitForTimeout(5000);
      const url = saPage.url();
      console.log(`URL: ${url}`);
      const text = await saPage.evaluate(() => document.body.innerText);
      // 관련 데이터만 추출
      const lines = text.split('\n').filter(l => l.trim());
      const relevant = lines.filter(l => 
        l.includes('노출') || l.includes('클릭') || l.includes('수집') ||
        l.includes('색인') || l.includes('차트') || l.includes('전체') ||
        l.includes('페이지') || l.includes('완료') || l.includes('제한') ||
        l.includes('오류') || l.includes('차단') || l.includes('확인') ||
        /[0-9,]+\s*건/.test(l) || /[0-9]+%/.test(l) || 
        l === '자세히 보기' || /[0-9]/.test(l)
      );
      console.log(JSON.stringify(relevant.slice(0, 30), null, 2));
      
      // url이 바뀌면 summary로 돌아가기
      if (url.includes('summary')) break;
      await saPage.goBack();
      await saPage.waitForTimeout(2000);
    } catch(e) {
      console.log(`클릭 실패: ${e.message.substring(0, 80)}`);
    }
  }

  await browser.close();
})();

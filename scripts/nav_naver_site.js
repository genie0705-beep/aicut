const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // === 1. 서치어드바이저 - 사이트 상세 진단 ===
  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (saPage) {
    await saPage.bringToFront();
    await saPage.waitForTimeout(1000);

    // aicut.co.kr 사이트 링크 클릭
    const siteLink = await saPage.$('text=aicut.co.kr');
    if (siteLink) {
      await siteLink.click();
      await saPage.waitForTimeout(5000);
      console.log('=== 사이트 상세 페이지 ===');
      const text = await saPage.evaluate(() => document.body.innerText);
      console.log(text.substring(0, 6000));
      
      // 추가 진단 메뉴 찾기
      const menus = await saPage.$$eval('a, button, [role="button"], span', els => 
        els.filter(e => e.innerText.trim()).map(e => e.innerText.trim()).slice(0, 50)
      );
      console.log('\n=== 메뉴 목록 ===');
      console.log(JSON.stringify([...new Set(menus)], null, 2));
    } else {
      console.log('aicut.co.kr 링크 못 찾음');
    }
  } else {
    console.log('서치어드바이저 탭 없음');
  }

  await browser.close();
})();

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // === 1. 네이버 광고센터 ===
  const adPage = pages.find(p => p.url().includes('ads.naver.com/manage'));
  if (adPage) {
    console.log('=== 광고센터 ===');
    await adPage.bringToFront();
    await adPage.waitForTimeout(2000);
    
    // 비즈머니 & 쿠폰 클릭해서 상세보기
    // "쿠폰관리" 버튼 찾기
    const couponBtn = await adPage.$('text=쿠폰관리');
    if (couponBtn) {
      await couponBtn.click();
      await adPage.waitForTimeout(3000);
      console.log('쿠폰관리 페이지 이동');
      const text = await adPage.evaluate(() => document.body.innerText);
      console.log(text.substring(0, 3000));
    } else {
      // 쿠폰 버튼이 안 보이면 현재 페이지 데이터
      const text = await adPage.evaluate(() => document.body.innerText);
      console.log(text.substring(0, 2000));
    }
  } else {
    console.log('광고센터 탭 없음, 새로 열기');
  }

  // === 2. 서치어드바이저 웹마스터 도구 ===
  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (saPage) {
    console.log('\n=== 서치어드바이저 ===');
    await saPage.bringToFront();
    await saPage.waitForTimeout(1000);

    // '웹마스터 도구' 버튼 클릭
    const toolBtn = await saPage.$('text=웹마스터 도구');
    if (toolBtn) {
      await toolBtn.click();
      await saPage.waitForTimeout(5000);
      console.log('웹마스터 도구 이동');
      const text = await saPage.evaluate(() => document.body.innerText);
      console.log(text.substring(0, 4000));
    } else {
      console.log('웹마스터 도구 버튼 못 찾음');
      const text = await saPage.evaluate(() => document.body.innerText);
      console.log(text.substring(0, 2000));
    }
  } else {
    console.log('서치어드바이저 탭 없음');
  }

  await browser.close();
})();

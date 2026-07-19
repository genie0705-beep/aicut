const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const pages = ctx.pages();
    
    console.log('현재 탭 목록:');
    pages.forEach((p, i) => console.log(`  [${i}] ${p.url().substring(0, 120)}`));
    
    // ===== 네이버 검색광고 데이터 수집 =====
    console.log('\n=== [1] 네이버 검색광고 데이터 수집 ===');
    
    let hasSearchAdTab = false;
    // searchad / manage.searchad.naver.com 탭 찾기
    const adTab = pages.find(p => 
      p.url().includes('manage.searchad.naver.com') || 
      p.url().includes('searchad.naver.com')
    );
    
    if (adTab) {
      hasSearchAdTab = true;
      console.log('기존 광고센터 탭 발견, 데이터 수집 시도...');
      await adTab.bringToFront();
      await adTab.waitForTimeout(3000);
      
      // 현재 URL과 페이지 정보 수집
      console.log('광고센터 URL:', adTab.url());
      
      const adInfo = await adTab.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 8000)
        };
      });
      console.log('페이지 제목:', adInfo.title);
      console.log('페이지 텍스트:', adInfo.bodyText.substring(0, 4000));
    } else {
      console.log('기존 광고센터 탭 없음. 새 탭 열기 시도...');
      try {
        const newAdPage = await ctx.newPage();
        await newAdPage.goto('https://manage.searchad.naver.com', { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        });
        await newAdPage.waitForTimeout(5000);
        console.log('광고센터 접속 URL:', newAdPage.url());
        
        const pageInfo = await newAdPage.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodyText: document.body.innerText.substring(0, 8000)
          };
        });
        console.log('페이지 제목:', pageInfo.title);
        console.log('페이지 텍스트:', pageInfo.bodyText.substring(0, 4000));
      } catch (err) {
        console.log('광고센터 접속 실패:', err.message);
      }
    }
    
    // ===== GA4 데이터 수집 =====
    console.log('\n=== [2] GA4 데이터 수집 ===');
    
    const gaTab = pages.find(p => p.url().includes('analytics.google.com'));
    
    if (gaTab) {
      console.log('기존 GA4 탭 발견:', gaTab.url().substring(0, 120));
      await gaTab.bringToFront();
      await gaTab.waitForTimeout(3000);
      
      const gaInfo = await gaTab.evaluate(() => {
        return {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 8000)
        };
      });
      console.log('GA4 페이지 정보:');
      console.log('bodyText:', gaInfo.bodyText.substring(0, 6000));
    } else {
      console.log('기존 GA4 탭 없음. 새 탭 열기 시도...');
      try {
        const newGaPage = await ctx.newPage();
        await newGaPage.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/defaulthome', {
          waitUntil: 'domcontentloaded',
          timeout: 25000
        });
        await newGaPage.waitForTimeout(8000);
        console.log('GA4 접속 URL:', newGaPage.url().substring(0, 120));
        
        const gaInfo = await newGaPage.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodyText: document.body.innerText.substring(0, 8000)
          };
        });
        console.log('GA4 bodyText:', gaInfo.bodyText.substring(0, 6000));
      } catch (err) {
        console.log('GA4 접속 실패:', err.message);
      }
    }
    
    console.log('\n=== 수집 완료 ===');
    // 연결만 종료, 브라우저 유지
    browser.disconnect();
  } catch (err) {
    console.error('치명적 오류:', err.message);
    process.exit(1);
  }
})();

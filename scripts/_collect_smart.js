/**
 * 광고봇 - 정밀 데이터 수집 (3차)
 * 
 * 네이버 광고: SPA 내비게이션 클릭으로 보고서 접근
 * GA4: 페이지/화면 데이터 수집
 */
const { chromium } = require('playwright');
const fs = require('fs');

const OUTPUT = 'scripts/_collected_smart.json';

(async () => {
  const result = {};
  const errors = [];

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  try {
    // ===== [1] 네이버 광고 - SPA 내비게이션 =====
    console.log('===== [1] 네이버 광고 SPA 탐색 =====');
    let adPage = pages.find(p => p.url().includes('ads.naver.com'));

    if (adPage) {
      await adPage.bringToFront();
      await adPage.waitForTimeout(2000);
      console.log('광고 페이지:', adPage.url());

      // 대시보드 데이터 스크린샷 (for reference)
      const dashInfo = await adPage.evaluate(() => {
        const text = document.body.innerText;
        const lines = text.split('\n').filter(l => l.trim());
        return { lines: lines.slice(0, 100) };
      });
      result.naver_dashboard = dashInfo;
      
      // Try clicking "검색 광고" navigation link
      try {
        const searchAdLink = await adPage.$('a:has-text("검색 광고")');
        if (searchAdLink) {
          console.log('"검색 광고" 링크 클릭 시도...');
          await searchAdLink.click();
          await adPage.waitForTimeout(4000);
          console.log('이동 후 URL:', adPage.url());

          const searchAdInfo = await adPage.evaluate(() => {
            const text = document.body.innerText;
            return {
              url: window.location.href,
              bodyText: text.substring(0, 8000)
            };
          });
          result.naver_search_ads = searchAdInfo;
          console.log('검색광고 페이지 내용 (일부):');
          console.log(searchAdInfo.bodyText.substring(0, 3000));
        }
      } catch(e) {
        console.log('검색 광고 클릭 실패:', e.message);
        errors.push('Naver 검색광고 클릭: ' + e.message);
      }

      // Try clicking "대시보드" date picker (if visible, change to 30 days)
      // Note: date inputs might need a different approach
      
    } else {
      console.log('네이버 광고 탭 없음');
      errors.push('Naver ads 탭 없음');
    }

    // ===== [2] GA4 - 페이지/화면 보고서 =====
    console.log('\n===== [2] GA4 페이지 데이터 =====');
    let gaPage = pages.find(p => p.url().includes('analytics.google.com'));

    if (gaPage) {
      await gaPage.bringToFront();
      await gaPage.waitForTimeout(2000);
      console.log('GA4 현재 URL:', gaPage.url().substring(0, 150));

      // Try SPA hash navigation for 페이지/화면 report
      try {
        await gaPage.evaluate(() => {
          // Navigate via hash change for pages & screens report
          window.location.hash = '#/p538910436/reports/pagesandscreens';
        });
        await gaPage.waitForTimeout(8000);
        console.log('GA4 hash nav 후 URL:', gaPage.url().substring(0, 150));

        const gaPageData = await gaPage.evaluate(() => {
          const text = document.body.innerText;
          return {
            url: window.location.href,
            bodyText: text.substring(0, 10000)
          };
        });
        result.ga4_pages = gaPageData;
        console.log('GA4 페이지/화면 (일부):');
        console.log(gaPageData.bodyText.substring(0, 5000));
      } catch(e) {
        console.log('GA4 페이지/화면 실패:', e.message);
        errors.push('GA4 pages: ' + e.message);
      }

      // Try 트래픽 획득 보고서
      try {
        await gaPage.evaluate(() => {
          window.location.hash = '#/p538910436/reports/trafficacquisition';
        });
        await gaPage.waitForTimeout(8000);
        console.log('\n트래픽 획득 URL:', gaPage.url().substring(0, 150));

        const trafficData = await gaPage.evaluate(() => {
          const text = document.body.innerText;
          return {
            url: window.location.href,
            bodyText: text.substring(0, 10000)
          };
        });
        result.ga4_traffic = trafficData;
        console.log('트래픽 획득 (일부):');
        console.log(trafficData.bodyText.substring(0, 5000));
      } catch(e) {
        console.log('트래픽 획득 실패:', e.message);
        errors.push('GA4 traffic: ' + e.message);
      }

    } else {
      console.log('GA4 탭 없음');
      errors.push('GA4 탭 없음');
    }

    result._errors = errors;
    result._collected_at = new Date().toISOString();
    fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 2), 'utf-8');
    console.log('\n===== 3차 수집 완료 =====');
    if (errors.length) console.log('오류:', errors);

  } catch (err) {
    console.error('치명적 오류:', err.message);
    process.exit(1);
  }
  process.exit(0);
})();

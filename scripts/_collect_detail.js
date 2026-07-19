/**
 * 광고봇 상세 데이터 수집 (2차)
 * 
 * 네이버 광고: 캠페인 목록 / 키워드별 성과
 * GA4: 페이지별 조회수 (포스팅별 유입)
 */
const { chromium } = require('playwright');
const fs = require('fs');

const OUTPUT_FILE = 'scripts/_collected_detail.json';

(async () => {
  const result = { naver_campaigns: null, naver_keywords: null, ga4_pages: null };
  const errors = [];

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  try {
    // =========================================================
    // [1] 네이버 광고 - 전체 캠페인 페이지
    // =========================================================
    console.log('===== [1] 네이버 광고 - 전체 캠페인 =====');
    let adPage = pages.find(p => p.url().includes('ads.naver.com/manage'));
    
    if (!adPage) {
      adPage = pages.find(p => p.url().includes('manage.searchad.naver.com'));
    }

    if (adPage) {
      await adPage.bringToFront();
      await adPage.waitForTimeout(2000);
      
      // 전체 캠페인 페이지로 이동
      try {
        await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/campaigns', {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        await adPage.waitForTimeout(5000);
        console.log('캠페인 페이지 URL:', adPage.url());
        
        const campInfo = await adPage.evaluate(() => {
          const text = document.body.innerText;
          return {
            url: window.location.href,
            bodyText: text.substring(0, 10000)
          };
        });
        console.log('=== 캠페인 페이지 ===');
        console.log(campInfo.bodyText.substring(0, 6000));
        result.naver_campaigns = campInfo;
      } catch (err) {
        console.log('캠페인 페이지 이동 실패:', err.message);
        errors.push('Naver 캠페인 페이지: ' + err.message);
      }
      
      // 보고서 페이지로 이동 (키워드 성과)
      try {
        await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/reports', {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        await adPage.waitForTimeout(5000);
        console.log('\n보고서 페이지 URL:', adPage.url());
        
        const reportInfo = await adPage.evaluate(() => {
          const text = document.body.innerText;
          return {
            url: window.location.href,
            bodyText: text.substring(0, 10000)
          };
        });
        console.log('=== 보고서 페이지 ===');
        console.log(reportInfo.bodyText.substring(0, 6000));
        result.naver_keywords = reportInfo;
      } catch (err) {
        console.log('보고서 페이지 이동 실패:', err.message);
        errors.push('Naver 보고서 페이지: ' + err.message);
      }
    } else {
      console.log('네이버 광고 탭 없음');
      errors.push('Naver 광고 탭 없음');
    }

    // =========================================================
    // [2] GA4 - 페이지 및 화면 데이터
    // =========================================================
    console.log('\n===== [2] GA4 - 페이지 데이터 =====');
    let gaPage = pages.find(p => p.url().includes('analytics.google.com'));

    if (gaPage) {
      await gaPage.bringToFront();
      await gaPage.waitForTimeout(2000);
      
      // 페이지 및 화면 보고서로 이동
      try {
        await gaPage.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/pagesandscreens', {
          waitUntil: 'domcontentloaded',
          timeout: 25000
        });
        await gaPage.waitForTimeout(8000);
        console.log('GA4 페이지 URL:', gaPage.url().substring(0, 150));
        
        const pageInfo = await gaPage.evaluate(() => {
          const text = document.body.innerText;
          return {
            url: window.location.href,
            bodyText: text.substring(0, 12000)
          };
        });
        console.log('=== GA4 페이지/화면 ===');
        console.log(pageInfo.bodyText.substring(0, 8000));
        result.ga4_pages = pageInfo;
      } catch (err) {
        console.log('GA4 페이지/화면 이동 실패:', err.message);
        errors.push('GA4 페이지/화면: ' + err.message);
      }
    } else {
      console.log('GA4 탭 없음');
      errors.push('GA4 탭 없음');
    }

    // =========================================================
    // 저장
    // =========================================================
    result._errors = errors;
    result._collected_at = new Date().toISOString();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
    console.log('\n===== 2차 수집 완료 =====');
    if (errors.length > 0) console.log('오류:', errors);
    
  } catch (err) {
    console.error('치명적 오류:', err.message);
    process.exit(1);
  }

  process.exit(0);
})();

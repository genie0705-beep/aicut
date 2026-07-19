/**
 * 광고봇 데이터 수집 스크립트
 * 네이버 검색광고 + GA4 데이터 수집
 * 최근 30일 기준 (2026-06-19 ~ 2026-07-18)
 * 
 * 주의: browser.close() 호출 금지 - 모든 탭 종료 방지
 */
const { chromium } = require('playwright');
const fs = require('fs');

const OUTPUT_FILE = 'scripts/_collected_data.json';

(async () => {
  const result = { naver_ads: {}, ga4: {} };
  const errors = [];

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  try {
    // =========================================================
    // [1A] 서치어드바이저 데이터 (Tab [2])
    // =========================================================
    console.log('\n===== [1A] 서치어드바이저 수집 =====');
    const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
    if (saPage) {
      await saPage.bringToFront();
      await saPage.waitForTimeout(3000);
      console.log('서치어드바이저 URL:', saPage.url());

      const saData = await saPage.evaluate(() => {
        const text = document.body.innerText;
        const lines = text.split('\n').filter(l => l.trim()).map(l => l.trim());
        return {
          title: document.title,
          lines: lines.slice(0, 200),
          rawText: text.substring(0, 10000)
        };
      });
      console.log('서치어드바이저 데이터 수집 완료 (', saData.lines.length, 'lines )');
      console.log('=== 서치어드바이저 본문 (일부) ===');
      console.log(saData.rawText.substring(0, 6000));
      result.naver_ads.search_advisor = saData;
    } else {
      console.log('서치어드바이저 탭 없음');
      errors.push('searchadvisor: 탭 없음');
    }

    // =========================================================
    // [1B] 네이버 검색광고 관리센터 (manage.searchad.naver.com)
    // =========================================================
    console.log('\n===== [1B] 네이버 검색광고 관리센터 =====');
    let adPage = pages.find(p => p.url().includes('manage.searchad.naver.com'));
    
    if (!adPage) {
      console.log('광고센터 탭 없음. 새 탭 생성...');
      adPage = await ctx.newPage();
      try {
        await adPage.goto('https://manage.searchad.naver.com', {
          waitUntil: 'domcontentloaded',
          timeout: 20000
        });
        await adPage.waitForTimeout(5000);
      } catch (err) {
        console.log('광고센터 접속 실패:', err.message);
        errors.push('manage.searchad 접속 실패: ' + err.message);
      }
    } else {
      console.log('기존 광고센터 탭 발견');
      await adPage.bringToFront();
      await adPage.waitForTimeout(3000);
    }

    if (adPage) {
      console.log('광고센터 URL:', adPage.url());
      const adInfo = await adPage.evaluate(() => {
        const text = document.body.innerText;
        return {
          title: document.title,
          url: window.location.href,
          bodyText: text.substring(0, 10000)
        };
      });
      console.log('=== 광고센터 본문 (일부) ===');
      console.log(adInfo.bodyText.substring(0, 6000));
      result.naver_ads.manage_center = adInfo;
    }

    // =========================================================
    // [2] GA4 데이터 수집
    // =========================================================
    console.log('\n===== [2] GA4 데이터 수집 =====');
    let gaPage = pages.find(p => p.url().includes('analytics.google.com'));

    if (!gaPage) {
      console.log('GA4 탭 없음. 새 탭 생성...');
      gaPage = await ctx.newPage();
      try {
        await gaPage.goto('https://analytics.google.com/analytics/web/#/p538910436/reports/defaulthome', {
          waitUntil: 'domcontentloaded',
          timeout: 25000
        });
        await gaPage.waitForTimeout(8000);
      } catch (err) {
        console.log('GA4 접속 실패:', err.message);
        errors.push('GA4 접속 실패: ' + err.message);
      }
    } else {
      console.log('기존 GA4 탭 발견:', gaPage.url().substring(0, 120));
      await gaPage.bringToFront();
      await gaPage.waitForTimeout(3000);
    }

    if (gaPage) {
      console.log('GA4 URL:', gaPage.url().substring(0, 120));
      const gaInfo = await gaPage.evaluate(() => {
        const text = document.body.innerText;
        return {
          title: document.title,
          url: window.location.href,
          bodyText: text.substring(0, 12000)
        };
      });
      console.log('=== GA4 본문 (일부) ===');
      console.log(gaInfo.bodyText.substring(0, 8000));
      result.ga4 = gaInfo;
      
      // 전환 이벤트 수집을 위해 GA4 전환 페이지 이동
      console.log('\n--- GA4 전환 페이지 이동 시도 ---');
      try {
        await gaPage.evaluate(() => {
          window.location.hash = '#/p538910910/reports/conversions';
          // Try overview conversions URL
          window.location.hash = '#/p538910936/reports/conversions-overview';
        });
        await gaPage.waitForTimeout(5000);
        
        const convInfo = await gaPage.evaluate(() => {
          const text = document.body.innerText;
          return {
            url: window.location.href,
            bodyText: text.substring(0, 8000)
          };
        });
        console.log('GA4 전환 페이지:');
        console.log(convInfo.bodyText.substring(0, 4000));
        result.ga4.conversions = convInfo;
      } catch(err) {
        console.log('GA4 전환 페이지 이동 실패:', err.message);
        errors.push('GA4 전환 페이지 이동 실패: ' + err.message);
      }
    }

    // =========================================================
    // [3] 저장
    // =========================================================
    result._errors = errors;
    result._collected_at = new Date().toISOString();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
    console.log('\n===== 수집 완료 =====');
    console.log('저장 위치:', OUTPUT_FILE);
    if (errors.length > 0) {
      console.log('오류 발생:', errors);
    }
    
  } catch (err) {
    console.error('치명적 오류:', err.message);
    process.exit(1);
  }

  // 브라우저 연결 해제 대신 프로세스 종료 (브라우저 유지)
  process.exit(0);
})();

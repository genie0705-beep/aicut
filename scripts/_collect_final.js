/**
 * 광고봇 - 최종 정밀 수집
 * 
 * GA4 올바른 해시 네비게이션 시도
 * Naver ads - 대시보드 30일 기간 변경 시도
 */
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const result = {};
  const errors = [];

  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  try {
    // ===== [1] GA4 - 정확한 해시 네비게이션 =====
    console.log('===== [1] GA4 깊이 탐색 =====');
    let gaPage = pages.find(p => p.url().includes('analytics.google.com'));
    
    if (gaPage) {
      await gaPage.bringToFront();
      await gaPage.waitForTimeout(2000);
      console.log('현재 URL:', gaPage.url());

      // 시도 1: 전체 hash로 페이지/화면
      const hashRoutes = [
        '#/a227543683p538910436/reports/pagesandscreens',
        '#/a227543683p538910436/reports/trafficacquisition',
        '#/a227543683p538910436/reports/lifecycleengagement-overview',
        '#/a227543683p538910436/reports/useracquisition'
      ];

      for (const route of hashRoutes) {
        try {
          console.log(`\n--- ${route} ---`);
          await gaPage.evaluate((hash) => {
            window.location.hash = hash;
          }, route);
          await gaPage.waitForTimeout(7000);
          console.log('이동 후 URL:', gaPage.url().substring(0, 150));
          
          const pageData = await gaPage.evaluate(() => {
            const text = document.body.innerText;
            const lines = text.split('\n').filter(l => l.trim()).map(l => l.trim());
            const title = document.title;
            return {
              title,
              url: window.location.href.substring(0, 150),
              lines: lines.slice(0, 80),
              rawText: text.substring(0, 8000)
            };
          });
          
          const routeName = route.split('/').pop();
          result['ga4_' + routeName] = pageData;
          console.log('페이지 제목:', pageData.title);
          console.log(pageData.rawText.substring(0, 4000));
        } catch(e) {
          console.log('실패:', e.message);
          errors.push('GA4 ' + route + ': ' + e.message);
        }
      }
    } else {
      errors.push('GA4 탭 없음');
    }

    // ===== [2] 네이버 광고 - 대시보드 기간 변경 =====
    console.log('\n===== [2] 네이버 광고 탐색 =====');
    let adPage = pages.find(p => p.url().includes('ads.naver.com'));
    
    if (!adPage) {
      adPage = pages.find(p => p.url().includes('manage.searchad.naver.com'));
    }

    if (adPage) {
      // 대시보드로 먼저 이동
      await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      }).catch(() => {});
      await adPage.waitForTimeout(5000);
      console.log('대시보드 URL:', adPage.url());

      // 클릭 가능한 모든 요소 확인
      const allElements = await adPage.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button, [role="button"], [role="tab"]'));
        return links.slice(0, 50).map(el => ({
          tag: el.tagName,
          text: el.innerText?.trim()?.substring(0, 40),
          href: el.href?.substring(0, 80) || '',
          role: el.getAttribute('role'),
          class: el.className?.substring(0, 40)
        }));
      });
      console.log('클릭 가능 요소:');
      allElements.forEach((e, i) => {
        if (e.text) console.log(`  [${i}] ${e.tag}: ${e.text}`);
      });
      result.naver_elements = allElements;

      // Try clicking each nav link to see if we can navigate
      for (const navText of ['전체 캠페인', '검색 광고', '보고서']) {
        try {
          const link = await adPage.$(`text="${navText}"`);
          if (link) {
            console.log(`\n"${navText}" 클릭...`);
            await link.click();
            await adPage.waitForTimeout(4000);
            console.log('이동 후:', adPage.url());
            
            const navData = await adPage.evaluate(() => {
              const text = document.body.innerText;
              return {
                url: window.location.href,
                bodyText: text.substring(0, 6000)
              };
            });
            result['naver_' + navText] = navData;
            console.log(navData.bodyText.substring(0, 3000));
            
            // Go back to dashboard
            await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', {
              waitUntil: 'domcontentloaded', timeout: 15000
            }).catch(() => {});
            await adPage.waitForTimeout(3000);
          }
        } catch(e) {
          console.log(`"${navText}" 클릭 실패:`, e.message);
        }
      }

      // 페이지 전체 정보 수집
      await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', {
        waitUntil: 'domcontentloaded', timeout: 15000
      }).catch(() => {});
      await adPage.waitForTimeout(3000);
      
      const fullInfo = await adPage.evaluate(() => {
        const text = document.body.innerText;
        const lines = text.split('\n').filter(l => l.trim());
        return { lines, rawText: text.substring(0, 12000) };
      });
      result.naver_full_dashboard = {
        lines: fullInfo.lines,
        rawText: fullInfo.rawText
      };
      console.log('\n=== 대시보드 전체 라인 ===');
      fullInfo.lines.forEach(l => console.log(l));
      
    } else {
      errors.push('네이버 광고 탭 없음');
    }

    console.log('\n===== 완료 =====');
    console.log('오류:', errors);
    fs.writeFileSync('scripts/_collected_final.json', JSON.stringify(result, null, 2), 'utf-8');

  } catch(err) {
    console.error('치명적 오류:', err.message);
    process.exit(1);
  }
  process.exit(0);
})();

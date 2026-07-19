const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  let gaPage = null;
  for (const p of pages) {
    if (p.url().includes('analytics.google.com')) {
      gaPage = p;
      break;
    }
  }
  
  // 방법: GA4 이벤트 보고서에서 전환 토글 버튼 찾기
  // GA4에서는 이벤트 보고서의 각 행 오른쪽에 전환 설정 스위치가 있음
  
  // 이벤트 보고서 페이지로 이동 (URL 직접)
  const urls = [
    'https://analytics.google.com/analytics/web/#/p538910436/reports/event',
    'https://analytics.google.com/analytics/web/#/a227543683p538910436/reports/event',
    'https://analytics.google.com/analytics/web/#/a227543683p538910436/report/event'
  ];
  
  for (const url of urls) {
    await gaPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await gaPage.waitForTimeout(2000);
    const finalUrl = gaPage.url();
    console.log('시도:', url.substring(0, 80), '→', finalUrl.substring(0, 100));
    if (finalUrl.includes('reports') || finalUrl.includes('report')) {
      break;
    }
  }
  
  // 현재 페이지에서 'generate_lead'가 보이면 전환 설정 찾기
  const pageText = await gaPage.evaluate(() => document.body?.innerText?.substring(0, 2000) || '');
  console.log('\\n페이지 텍스트에 generate_lead 포함:', pageText.includes('generate_lead'));
  
  // 이벤트 보고서 테이블에서 generate_lead 행 찾아서 액션 버튼 클릭
  const result = await gaPage.evaluate(() => {
    // GA4 이벤트 보고서의 테이블 구조
    // 모든 행에서 generate_lead 찾기
    const allElements = document.querySelectorAll('*');
    let found = null;
    
    for (const el of allElements) {
      if ((el.innerText || '').trim() === 'generate_lead') {
        found = el;
        break;
      }
    }
    
    if (!found) return 'generate_lead 텍스트를 가진 요소 없음';
    
    // 해당 요소의 행(row) 찾기
    let row = found;
    for (let i = 0; i < 5; i++) {
      if (row.parentElement) {
        row = row.parentElement;
        const role = row.getAttribute('role');
        if (role === 'row' || role === 'gridcell' || row.tagName === 'TR' || row.tagName === 'MAT-ROW') {
          break;
        }
      }
    }
    
    // 행 내의 모든 버튼, 스위치 찾기
    const interactive = row.querySelectorAll('button, [role=switch], [role=checkbox], label, .mat-slide-toggle');
    const clickable = [];
    
    for (const el of interactive) {
      if (el.offsetParent !== null) {
        try {
          el.click();
          clickable.push(el.tagName + ': ' + (el.getAttribute('aria-label') || el.innerText?.substring(0, 20) || ''));
        } catch(e) {
          clickable.push(el.tagName + ' - click failed: ' + e.message);
        }
      }
    }
    
    return {
      rowTag: row.tagName,
      rowRole: row.getAttribute('role'),
      rowText: (row.innerText || '').substring(0, 100),
      elementsFound: interactive.length,
      clicked: clickable
    };
  }).catch(e => ({error: e.message}));
  
  console.log('\\n결과:', JSON.stringify(result, null, 2));
  
  await gaPage.waitForTimeout(3000);
  
  // 변경 확인
  const after = await gaPage.evaluate(() => document.body?.innerText?.substring(0, 500) || '');
  console.log('\\n변경 후:', after.substring(0, 300));
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });

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
  
  // 관리 페이지로 이동
  await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await gaPage.waitForTimeout(3000);
  
  // 인덱스 18번 mat-list-item 클릭 (이벤트)
  const clicked = await gaPage.evaluate(() => {
    const items = document.querySelectorAll('mat-list-item');
    if (items.length > 18) {
      items[18].click();
      return 'clicked index 18: ' + (items[18].innerText || '').trim().substring(0, 20);
    }
    return 'not enough items: ' + items.length;
  });
  
  console.log('1:', clicked);
  await gaPage.waitForTimeout(5000);
  
  // 이벤트 설정 페이지 확인
  const pageData = await gaPage.evaluate(() => {
    const root = document.querySelector('ga-hybrid-app-root') || document.querySelector('body');
    return root?.innerText?.substring(0, 4000) || 'no data';
  });
  
  console.log('\\n=== 이벤트 설정 페이지 ===');
  console.log(pageData);
  
  // 'generate_lead' 찾아서 전환 토글 ON
  // 이벤트 목록에서 generate_lead 찾기
  const hasGenerateLead = pageData.includes('generate_lead');
  console.log('\\ngenerate_lead 발견:', hasGenerateLead);
  
  // 이 페이지에 generate_lead가 보이면 전환 토글 스위치 찾기
  if (hasGenerateLead) {
    const toggleResult = await gaPage.evaluate(() => {
      // generate_lead 행 찾기
      const cells = document.querySelectorAll('td, mat-cell, [role=gridcell]');
      let foundRow = null;
      for (const cell of cells) {
        if ((cell.innerText || '').trim() === 'generate_lead') {
          foundRow = cell.closest('tr, [role=row], mat-row') || cell.parentElement;
          break;
        }
      }
      
      if (foundRow) {
        // 행 내에서 토글/스위치 찾기
        const toggles = foundRow.querySelectorAll('[role=switch], input[type=checkbox], .mat-slide-toggle, button[aria-checked]');
        for (const t of toggles) {
          if (t.offsetParent !== null) {
            t.click();
            return 'toggle clicked: ' + (t.getAttribute('aria-label') || t.tagName);
          }
        }
        return 'toggle not found in row: ' + (foundRow.innerText || '').substring(0, 100);
      }
      return 'row not found';
    });
    console.log('\\n토글 결과:', toggleResult);
    
    await gaPage.waitForTimeout(2000);
    
    // 변경 후 데이터 확인
    const afterData = await gaPage.evaluate(() => {
      const root = document.querySelector('ga-hybrid-app-root') || document.querySelector('body');
      return root?.innerText?.substring(0, 500);
    });
    console.log('\\n변경 후:', afterData);
  }
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });

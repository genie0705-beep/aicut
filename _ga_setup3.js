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
  
  // 관리 페이지인지 확인
  const currentUrl = gaPage.url();
  console.log('현재 URL:', currentUrl.substring(0, 150));
  
  // 관리 페이지가 아니면 이동
  if (!currentUrl.includes('/admin')) {
    await gaPage.goto('https://analytics.google.com/analytics/web/#/a227543683p538910436/admin', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await gaPage.waitForTimeout(3000);
    console.log('관리 페이지로 이동:', gaPage.url().substring(0, 150));
  }
  
  // '데이터 표시' 아래 '이벤트' mat-list-item 찾아서 클릭
  // 먼저 '데이터 표시' 섹션이 보이도록 스크롤
  const clicked = await gaPage.evaluate(() => {
    // '이벤트' 텍스트를 가진 모든 mat-list-item 찾기
    const items = document.querySelectorAll('mat-list-item');
    let eventClicked = false;
    
    for (const item of items) {
      const text = (item.innerText || '').trim();
      // '보고서 > 이벤트'와 구분: 관리 페이지의 '데이터 표시' 섹션 아래에 있는 것
      // 관리 페이지에서는 '데이터 표시' 텍스트가 보여야 함
      if (text === '이벤트') {
        // 부모에 '데이터 표시'가 있는지 확인 (같은 mat-list 내에서)
        const parentList = item.closest('mat-list');
        if (parentList) {
          const listText = parentList.innerText || '';
          if (listText.includes('데이터 표시')) {
            item.click();
            eventClicked = true;
            return 'clicked events in data display section';
          }
        }
      }
    }
    
    if (!eventClicked) {
      // 모든 mat-list-item 목록 출력
      const allItems = [];
      document.querySelectorAll('mat-list-item').forEach((item, i) => {
        const txt = (item.innerText || '').trim().substring(0, 30);
        if (txt) allItems.push(i + ': ' + txt);
      });
      return 'not found. items: ' + allItems.join(', ');
    }
    
    return 'done';
  }).catch(e => 'Error: ' + e.message);
  
  console.log('1:', clicked);
  await gaPage.waitForTimeout(5000);
  
  const pageData = await gaPage.evaluate(() => {
    const root = document.querySelector('ga-hybrid-app-root') || document.querySelector('body');
    return root?.innerText?.substring(0, 3000) || 'no data';
  }).catch(e => 'Error: ' + e.message);
  
  console.log('\\n=== 페이지 ===');
  console.log(pageData);
  
  // URL 변경 확인
  console.log('\\nURL:', gaPage.url().substring(0, 200));
  
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });

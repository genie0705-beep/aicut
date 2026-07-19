const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // GA4 탭 찾기
  const gaPage = pages.find(p => p.url().includes('analytics.google.com'));
  if (!gaPage) {
    console.log('GA4 탭을 찾을 수 없음');
    await browser.close();
    process.exit(1);
  }
  
  console.log('GA4 탭 발견:', gaPage.url().substring(0, 120));
  await gaPage.bringToFront();
  await gaPage.waitForTimeout(3000);
  
  // GA4 페이지 데이터 추출 - 인사이트 홈 데이터
  const gaData = await gaPage.evaluate(() => {
    const result = {};
    
    // 활성 사용자, 신규 사용자 등 주요 지표 수집
    const allText = document.body.innerText;
    
    // 최근 30일/7일 활성 사용자
    const userMatch = allText.match(/활성\s*사용자[^0-9]*([0-9,]+)/);
    if (userMatch) result.활성사용자 = userMatch[1];
    
    // 세션 수
    const sessionMatch = allText.match(/세션[^0-9]*([0-9,]+)/);
    if (sessionMatch) result.세션 = sessionMatch[1];
    
    // 신규 사용자
    const newUserMatch = allText.match(/신규\s*사용자[^0-9]*([0-9,]+)/);
    if (newUserMatch) result.신규사용자 = newUserMatch[1];
    
    // 평균 참여 시간
    const engageMatch = allText.match(/평균\s*참여\s*시간[^0-9]*([0-9:,]+)/);
    if (engageMatch) result.평균참여시간 = engageMatch[1];
    
    // 총 수익
    const revenueMatch = allText.match(/총\s*수익[^0-9]*([0-9,]+원|[0-9,.]+)/);
    if (revenueMatch) result.총수익 = revenueMatch[1];
    
    // 화면에 보이는 주요 숫자 캡처
    const cards = document.querySelectorAll('[data-testid]');
    const cardTexts = [];
    cards.forEach(c => {
      const text = c.innerText.trim();
      if (text && text.length < 100) cardTexts.push(text);
    });
    result.카드텍스트 = cardTexts.slice(0, 20);
    
    // 유입 채널 데이터 (표 영역)
    const tableTexts = [];
    const tables = document.querySelectorAll('table, [role="table"], [role="grid"]');
    tables.forEach(t => {
      const rows = t.querySelectorAll('tr, [role="row"]');
      rows.forEach(r => {
        const cells = r.querySelectorAll('td, th, [role="cell"], [role="columnheader"]');
        if (cells.length > 0) {
          const rowData = Array.from(cells).map(c => c.innerText.trim()).join(' | ');
          tableTexts.push(rowData);
        }
      });
    });
    result.테이블데이터 = tableTexts.slice(0, 50);
    
    // 전체 body 텍스트 (분석용)
    result.bodyText = allText.substring(0, 5000);
    
    return result;
  });
  
  console.log(JSON.stringify(gaData, null, 2));
  
  await browser.close();
})();

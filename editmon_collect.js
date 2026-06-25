const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const ctx = browser.contexts()[0];
    const pages = ctx.pages();
    
    // editmon 탭 찾기
    const editPage = pages.find(p => p.url().includes('editmon'));
    if (!editPage) {
      console.log('editmon 탭을 찾을 수 없습니다.');
      await ctx.close();
      return;
    }
    
    await editPage.bringToFront();
    await editPage.waitForTimeout(3000);
    
    console.log('editmon URL:', editPage.url());
    
    // 페이지 내용 분석 - 이메일/업체정보 수집
    const data = await editPage.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      const results = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const rowData = {};
          cells.forEach((cell, idx) => {
            const text = cell.textContent.trim().replace(/\s+/g, ' ');
            if (text) {
              rowData[`col${idx}`] = text;
            }
          });
          if (Object.keys(rowData).length > 0) {
            results.push(rowData);
          }
        }
      });
      
      // 테이블 헤더 찾기
      const headers = document.querySelectorAll('th');
      const headerTexts = [];
      headers.forEach(h => headerTexts.push(h.textContent.trim()));
      
      return {
        headers: headerTexts,
        data: results.slice(0, 50),
        totalRows: results.length,
        pageTitle: document.title
      };
    }).catch(e => ({ error: e.message }));
    
    console.log('\n=== 페이지 정보 ===');
    console.log('제목:', data.pageTitle);
    console.log('헤더:', JSON.stringify(data.headers));
    console.log('데이터 행:', data.totalRows);
    
    if (data.data && data.data.length > 0) {
      console.log('\n=== 수집 데이터 (최대 50행) ===');
      data.data.forEach((row, i) => {
        console.log(`\n[${i+1}]`);
        Object.entries(row).forEach(([key, val]) => {
          console.log(`  ${key}: ${val}`);
        });
      });
    }
    
    // 이메일 패턴 찾기
    const emails = await editPage.evaluate(() => {
      const body = document.body.innerHTML;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const found = body.match(emailRegex) || [];
      return [...new Set(found)];
    }).catch(e => []);
    
    if (emails.length > 0) {
      console.log('\n=== 수집된 이메일 ===');
      emails.forEach((email, i) => console.log(`  ${i+1}. ${email}`));
    }
    
    await ctx.close();
  } catch(e) {
    console.error('오류:', e.message);
  }
})();

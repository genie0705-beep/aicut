const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();

  // === 1. 서치어드바이저 - 키워드 상세 ===
  const saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (saPage) {
    await saPage.bringToFront();
    // 노출/클릭 페이지로 이동
    await saPage.goto('https://searchadvisor.naver.com/console/site/report/expose?site=https://aicut.co.kr', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await saPage.waitForTimeout(3000);
    
    // 키워드 테이블의 실제 데이터
    const keywordData = await saPage.evaluate(() => {
      const result = [];
      const rows = document.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length >= 5) {
          const rowData = Array.from(cells).map(c => c.innerText.trim());
          result.push(rowData);
        }
      });
      return result;
    });
    console.log('=== 키워드 TOP 30 ===');
    keywordData.forEach((row, i) => {
      if (i === 0) console.log('헤더:', JSON.stringify(row));
      else console.log(`${i}:`, JSON.stringify(row));
    });
  }

  // === 2. 광고센터 - 쿠폰 페이지 ===
  const adPage = pages.find(p => p.url().includes('ads.naver.com/manage'));
  if (adPage) {
    await adPage.bringToFront();
    // 쿠폰 페이지로 이동
    await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/voucher', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await adPage.waitForTimeout(4000);
    
    const voucherText = await adPage.evaluate(() => document.body.innerText);
    console.log('\n=== 쿠폰 페이지 ===');
    console.log(voucherText.substring(0, 3000));
  }

  await browser.close();
})();

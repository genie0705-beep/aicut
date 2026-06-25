const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Close any modal
  await adPage.evaluate(() => {
    document.querySelectorAll('button').forEach(btn => {
      if (btn.textContent.trim() === '닫기' && btn.offsetParent !== null) btn.click();
    });
  });
  await adPage.waitForTimeout(500);
  
  // Get full text and find keywords with bids
  const text = await adPage.evaluate(() => document.body.innerText);
  const lines = text.split('\n');
  
  console.log('=== KEYWORD & BID ANALYSIS ===');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Print all unique looking lines that might be keyword related
    if (line.includes('원') && line.length < 50 && !line.includes('0원') && !line.includes('(') && !line.includes(':')) {
      const prevLine = lines[i-1]?.trim() || '';
      console.log(`Line ${i}: prev="${prevLine}" cur="${line}"`);
    }
  }
  
  // Also print lines around "SNS영상편집" to see table structure
  console.log('\n=== CONTEXT AROUND SNS영상편집 ===');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('SNS영상') || lines[i].includes('광고영상제작')) {
      for (let j = Math.max(0, i-1); j <= Math.min(lines.length-1, i+5); j++) {
        console.log(`  [${j}] ${lines[j].trim()}`);
      }
      console.log('  ---');
    }
  }
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));

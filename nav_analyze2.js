const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  const adPage = pages.find(p => p.url().includes('ads.naver.com'));
  if (!adPage) { console.log('Not found'); await browser.close(); return; }
  
  await adPage.bringToFront();
  await adPage.waitForTimeout(1000);
  
  // Navigate directly to the ad group
  await adPage.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'networkidle' });
  await adPage.waitForTimeout(3000);
  
  // Get page HTML structure to understand the table
  const html = await adPage.evaluate(() => {
    // Get all text from the page for keyword analysis
    const body = document.body;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
    const texts = [];
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (text && text.length > 0) {
        texts.push(text.substring(0, 100));
      }
    }
    return texts;
  });
  
  // Filter for keyword-related text
  const keywords = html.filter(t => 
    t.includes('편집') || t.includes('영상') || t.includes('제작') || 
    t.includes('마케팅') || t.includes('광고') || t.includes('촬영') ||
    t.includes('유튜브') || t.includes('숏폼') || t.includes('SNS') ||
    t.includes('콘텐츠') || t.includes('인스타') || t.includes('쇼핑') ||
    t.includes('입찰가') || t.includes('노출가능') || t.includes('중지') ||
    t.includes('키워드') || t.includes('OFF') || t.includes('원') && t.length < 20
  );
  
  console.log('Filtered texts:');
  console.log(JSON.stringify(keywords, null, 2));
  
  await browser.close();
})().catch(e => console.error('Error:', e.message));

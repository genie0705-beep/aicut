const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // Find any search advisor page or open new
  let saPage = pages.find(p => p.url().includes('searchadvisor.naver.com'));
  if (saPage) {
    await saPage.close().catch(() => {});
  }
  
  saPage = await ctx.newPage();
  await saPage.goto('https://searchadvisor.naver.com/console/board', { waitUntil: 'domcontentloaded' });
  await saPage.waitForTimeout(2000);
  console.log('URL:', saPage.url());
  
  // Get full HTML and save it for analysis
  const html = await saPage.content();
  console.log('Full HTML length:', html.length);
  
  // Look for "수집" or "요청" in text
  const fullText = await saPage.textContent('body');
  const lines = fullText.split('\n').filter(l => l.trim());
  
  const kwLines = lines.filter(l => 
    l.includes('수집') || l.includes('요청') || l.includes('크롤') || 
    l.includes('crawl') || l.includes('request') || l.includes('등록')
  );
  console.log('\n=== Lines with keywords ===');
  kwLines.forEach(l => console.log(l.trim().substring(0, 200)));
  
  // Find all interactive elements using more selectors
  const allInteractive = await saPage.locator('a, button, [role="button"], [tabindex]:not([tabindex="-1"]), [onclick]').all();
  console.log('\n=== All interactive elements ===');
  for (let i = 0; i < allInteractive.length; i++) {
    const text = await allInteractive[i].textContent().catch(() => '');
    const visible = await allInteractive[i].isVisible().catch(() => false);
    const tag = await allInteractive[i].evaluate(el => el.tagName + (el.className ? '.' + el.className.split(' ')[0] : '')).catch(() => '?');
    if (visible && text.trim()) {
      console.log(`[${i}] ${tag}:`, JSON.stringify(text.trim().substring(0, 80)));
    }
  }
  
  // Check for tabs or sections in the page
  const sections = await saPage.locator('section, [role="tabpanel"], [role="tab"], .tab, [class*="tab"], [class*="menu"], nav').all();
  console.log('\n=== Sections/Nav ===');
  for (let i = 0; i < sections.length; i++) {
    const text = await sections[i].textContent().catch(() => '');
    const visible = await sections[i].isVisible().catch(() => false);
    const tag = await sections[i].evaluate(el => el.tagName + '.' + (el.className || '')).catch(() => '?');
    if (visible) {
      console.log(`[${i}] ${tag}:`, JSON.stringify(text.trim().substring(0, 150)));
    }
  }
  
  await browser.close().catch(() => {});
})().catch(e => { console.error('Error:', e.message); process.exit(1); });

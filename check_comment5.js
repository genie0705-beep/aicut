const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  await page.goto('https://blog.naver.com/lg4600', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  // Get the PrologueList frame content
  const frames = page.frames();
  const prologueFrame = frames.find(f => f.url().includes('PrologueList'));
  
  if (prologueFrame) {
    console.log('Prologue frame URL:', prologueFrame.url());
    
    // Check for clickable post items
    const postItems = await prologueFrame.evaluate(() => {
      // The posts are probably in some list structure
      const items = document.querySelectorAll('li, div[class*="post"], a[href*="blog.naver.com"], .post_subject a, .subject a, .title a');
      const results = [];
      items.forEach(item => {
        const text = item.textContent?.trim()?.substring(0, 50) || '';
        const href = item.href || '';
        const cls = item.className?.substring(0, 60) || '';
        const tag = item.tagName;
        if (text.length > 5 || href) {
          results.push({ tag, text, href: href.substring(0, 120), cls });
        }
      });
      return results.slice(0, 20);
    });
    
    console.log('Post items:');
    postItems.forEach(item => {
      console.log(`  <${item.tag}> class="${item.cls}" text="${item.text}" href="${item.href}"`);
    });
    
    // Also get the full innerHTML of the frame body (first 3000 chars)
    const html = await prologueFrame.evaluate(() => document.body?.innerHTML?.substring(0, 5000) || '');
    console.log('\nBody HTML (first 5000):');
    console.log(html);
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));

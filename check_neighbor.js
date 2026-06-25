const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const pages = browser.contexts()[0].pages();
  // Use a blog page to check neighbor button structure
  const anyPage = await browser.contexts()[0].newPage();
  
  await anyPage.goto('https://blog.naver.com/lg4600', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await anyPage.waitForTimeout(3000);
  
  console.log('URL:', anyPage.url());
  
  // Check all buttons/links on the page
  const neighborEls = await anyPage.evaluate(() => {
    const results = [];
    // Search all elements for neighbor-related text or class
    const allEls = document.querySelectorAll('*');
    allEls.forEach(el => {
      const text = el.textContent?.trim() || '';
      const cls = el.className?.substring(0, 80) || '';
      const tag = el.tagName;
      // Look for elements with '이웃', 'neighbor', 'buddy', 'add' in text or class
      if (text.includes('이웃') || cls.toLowerCase().includes('neighbor') || 
          cls.toLowerCase().includes('buddy') || cls.toLowerCase().includes('add') ||
          text.includes('추가') || el.id?.toLowerCase().includes('neighbor') ||
          el.id?.toLowerCase().includes('buddy')) {
        results.push({
          tag,
          id: el.id?.substring(0, 40),
          text: text.substring(0, 40),
          cls: cls,
          visible: el.offsetParent !== null,
          y: Math.round(el.getBoundingClientRect().y)
        });
      }
    });
    return results;
  });
  
  console.log('Neighbor-related elements:');
  neighborEls.forEach(el => {
    console.log(`  <${el.tag}> id=${el.id} text="${el.text}" class=${el.cls} visible=${el.visible} y=${el.y}`);
  });
  
  // Also check all iframes
  const frames = anyPage.frames();
  console.log(`\nFrames: ${frames.length}`);
  frames.forEach((f, i) => {
    console.log(`  Frame ${i}: ${f.url().substring(0, 120)}`);
  });
  
  // Check the main frame content for buttons
  const buttons = await anyPage.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).filter(el => el.offsetParent !== null).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim()?.substring(0, 30) || '',
      class: el.className?.substring(0, 50),
      href: el.href?.substring(0, 100) || '',
      y: Math.round(el.getBoundingClientRect().y)
    })).filter(el => el.y > 0 && el.y < 500);
  });
  
  console.log('\nButtons in main frame (top 20):');
  buttons.slice(0, 20).forEach(b => console.log(`  <${b.tag}> y=${b.y} text="${b.text}" class=${b.class}`));
  
  await anyPage.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));

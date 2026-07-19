const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  // Go to blog
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  // Find the frame with 글쓰기
  const frames = page.frames();
  const mainFrame = frames[1]; // PrologueList frame
  
  // Click 글쓰기 in the menu frame
  console.log('Clicking 글쓰기...');
  await mainFrame.evaluate(() => {
    const div = document.querySelector('#MyMenudiv');
    if (div && div.textContent.includes('글쓰기')) {
      // Find the actual clickable element - it's likely an <a> inside the div
      const links = div.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent.trim() === '글쓰기') {
          link.click();
          return { clicked: true, href: link.href };
        }
      }
      return { clicked: false, reason: '글쓰기 link not found in div', html: div.innerHTML.slice(0, 300) };
    }
    return { clicked: false, reason: 'div not found' };
  }).then(r => console.log('Result:', JSON.stringify(r)));

  await page.waitForTimeout(5000);
  
  // Check all tabs/windows
  const contexts = browser.contexts();
  console.log(`\nContexts: ${contexts.length}`);
  for (const ctx2 of contexts) {
    const pages = ctx2.pages();
    console.log(`Pages in context: ${pages.length}`);
    for (const p of pages) {
      const url = p.url();
      console.log(`  ${url.slice(0, 120)}`);
    }
  }

  // Check all frames again
  const frames2 = page.frames();
  console.log(`\nFrames after click: ${frames2.length}`);
  for (let i = 0; i < frames2.length; i++) {
    try {
      const url = frames2[i].url();
      const hasSE = await frames2[i].evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
      const text = await frames2[i].evaluate(() => document.body.innerText.slice(0, 100)).catch(() => '?');
      console.log(`[${i}] SE:${hasSE} ${url.slice(0,100)}`);
    } catch(e) {}
  }

  // Try to find any popup / new window
  const allPages = browser.contexts().flatMap(c => c.pages());
  console.log(`\nAll pages: ${allPages.length}`);
  for (const p of allPages) {
    const url = p.url();
    console.log(`  ${url.slice(0, 120)}`);
    if (url.includes('SmartEditor') || url.includes('PostWrite')) {
      console.log('  ✅ FOUND SMARTEDITOR PAGE!');
    }
  }

  // Check for popups
  // Also click on the page directly to trigger popup
  // Check what happens to window.open
  await page.waitForTimeout(3000);
  
  // Log all pages again
  const allPages2 = browser.contexts().flatMap(c => c.pages());
  console.log(`\nAll pages after wait: ${allPages2.length}`);
  for (const p of allPages2) {
    console.log(`  ${p.url().slice(0, 120)}`);
    const hasSE = await p.evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
    console.log(`  SE:${hasSE}`);
  }
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  const postFrame = page.frames().find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('No PostView'); await page.close(); await browser.close(); return; }
  
  // Click comment button and scroll
  const btn = await postFrame.$('#btn_comment_2');
  if (btn) {
    await btn.click();
    console.log('Clicked comment button');
    await page.waitForTimeout(3000);
  }
  
  // Scroll to bottom
  await postFrame.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  
  // Check for comment elements
  const info = await postFrame.evaluate(() => {
    // Check for textarea
    const tas = document.querySelectorAll('textarea');
    const textareas = Array.from(tas).map(t => ({
      placeholder: t.placeholder,
      id: t.id,
      className: t.className.substring(0, 50),
      visible: t.offsetParent !== null,
      y: t.getBoundingClientRect().y
    }));
    
    // Check for contenteditable
    const ces = document.querySelectorAll('[contenteditable]');
    const contenteditables = Array.from(ces).map(c => ({
      id: c.id,
      className: c.className.substring(0, 50),
      visible: c.offsetParent !== null,
      y: c.getBoundingClientRect().y
    }));
    
    // Check for comment section
    const commentEls = document.querySelectorAll('[class*="comment"], [class*="Comment"], #comment');
    const comments = Array.from(commentEls).map(e => ({
      id: e.id,
      cls: e.className.substring(0, 60),
      visible: e.offsetParent !== null,
      y: e.getBoundingClientRect().y,
      text: e.textContent.trim().substring(0, 80)
    }));
    
    // Check for iframes in PostView
    const subFrames = document.querySelectorAll('iframe');
    const iframes = Array.from(subFrames).map(f => ({
      src: f.src.substring(0, 120),
      id: f.id,
      visible: f.offsetParent !== null
    }));
    
    return { textareas, contenteditables, comments, iframes, scrollHeight: document.body.scrollHeight };
  });
  
  console.log(JSON.stringify(info, null, 2));
  
  await page.close();
  await browser.close();
})().catch(e => console.log(e.message));

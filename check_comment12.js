const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  // Get the PostView frame
  const postFrame = page.frames().find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('No PostView'); await page.close(); await browser.close(); return; }
  
  // Try clicking the 댓글쓰기 button
  const writeBtn = await postFrame.$('a._naverCommentWriteBtn, a.btn_write_comment');
  
  if (writeBtn) {
    console.log('Found write comment button, clicking...');
    await writeBtn.click();
    await page.waitForTimeout(3000);
  } else {
    // Try the floating comment button
    const floatBtn = await postFrame.$('#btn_comment_2, a.btn_comment');
    if (floatBtn) {
      console.log('Found floating comment button, clicking...');
      await floatBtn.click();
      await page.waitForTimeout(3000);
    }
  }
  
  // Now check for ALL frames including recently created ones
  const frames = page.frames();
  console.log('Total frames:', frames.length);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    
    try {
      // Check for textarea
      const hasTextarea = await f.evaluate(() => {
        const ta = document.querySelector('textarea');
        if (ta) return { placeholder: ta.placeholder, id: ta.id, visible: ta.offsetParent !== null, y: ta.getBoundingClientRect().y };
        return null;
      });
      
      // Check for contenteditable
      const hasCE = await f.evaluate(() => {
        const ce = document.querySelector('[contenteditable]');
        if (ce) return { id: ce.id, className: ce.className.substring(0, 40), visible: ce.offsetParent !== null };
        return null;
      });
      
      if (hasTextarea || hasCE) {
        console.log(`Frame ${i} [${url.substring(0,120)}]:`, JSON.stringify({textarea: hasTextarea, ce: hasCE}));
      }
      
      // Check for SE editors
      if (url.includes('SE') || url.includes('se2') || url.includes('smart')) {
        console.log(`Frame ${i} (SE-related): ${url.substring(0,150)}`);
      }
    } catch(e) {}
  }
  
  await page.close();
  await browser.close();
})().catch(e => console.log(e.message));

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  const postFrame = page.frames().find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('No PostView'); await page.close(); await browser.close(); return; }
  
  // Check for u_cbox elements (Naver common comment system)
  const cboxInfo = await postFrame.evaluate(() => {
    const results = {};
    
    // Check for u_cbox
    const cbox = document.querySelector('.u_cbox, [class*="u_cbox"]');
    results.u_cbox = cbox ? {
      id: cbox.id,
      cls: cbox.className.substring(0, 80),
      html: cbox.innerHTML.substring(0, 500).replace(/</g, '<'),
      text: cbox.textContent.trim().substring(0, 200)
    } : null;
    
    // Check for comment area in post-area
    const postArea = document.querySelector('#post-area');
    results.hasPostArea = !!postArea;
    
    // Check for all elements with "comment" in class
    const commentEls = document.querySelectorAll('[class*="comment"], [class*="Comment"], [id*="comment"], [id*="Comment"]');
    results.commentElements = Array.from(commentEls).slice(0, 10).map(el => ({
      tag: el.tagName,
      id: el.id,
      cls: el.className.substring(0, 60),
      visible: el.offsetParent !== null,
      y: el.getBoundingClientRect().y
    }));
    
    return results;
  });
  
  console.log('Comment box info:', JSON.stringify(cboxInfo, null, 2));
  
  // Also check for the _naverCommentWriteBtn
  const writeBtns = await postFrame.$$eval('a._naverCommentWriteBtn, a.btn_write_comment', els => 
    els.map(el => ({
      text: el.textContent.trim().substring(0, 20),
      visible: el.offsetParent !== null,
      y: el.getBoundingClientRect().y,
      href: el.href || ''
    }))
  );
  console.log('\nWrite buttons:', JSON.stringify(writeBtns));
  
  await page.close();
  await browser.close();
})().catch(e => console.log(e.message));

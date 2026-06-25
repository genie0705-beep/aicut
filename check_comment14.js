const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  
  const postFrame = page.frames().find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('No PostView'); await page.close(); await browser.close(); return; }
  
  // Check initial state of comment area
  const beforeState = await postFrame.evaluate(() => {
    const wrapComment = document.querySelector('.wrap_postcomment');
    const areaComment = document.querySelector('.area_comment');
    return {
      wrapHtml: wrapComment ? wrapComment.innerHTML.substring(0, 500).replace(/</g, '<') : 'not found',
      areaHtml: areaComment ? areaComment.innerHTML.substring(0, 500).replace(/</g, '<') : 'not found',
      postAreaBottom: document.querySelector('#post-area') ? document.querySelector('#post-area').innerHTML.substring(0, 200).replace(/</g, '<') : 'no post-area'
    };
  });
  
  console.log('Before click - wrap_postcomment:', beforeState.wrapHtml.substring(0, 300));
  console.log('\nBefore click - area_comment:', beforeState.areaHtml.substring(0, 300));
  
  // Click comment button
  const btn = await postFrame.$('#btn_comment_2');
  if (btn) {
    console.log('\nClicking comment button...');
    await btn.click();
    await page.waitForTimeout(3000);
    
    const afterState = await postFrame.evaluate(() => {
      const wrapComment = document.querySelector('.wrap_postcomment');
      return {
        wrapHtml: wrapComment ? wrapComment.innerHTML.substring(0, 1000).replace(/</g, '<') : 'not found'
      };
    });
    
    console.log('\nAfter click - wrap_postcomment:', afterState.wrapHtml.substring(0, 500));
    
    // Check for any iframe that loaded
    const iframes = await postFrame.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map(f => ({
        src: f.src.substring(0, 200),
        id: f.id,
        visible: f.offsetParent !== null,
        y: f.getBoundingClientRect().y
      }));
    });
    
    console.log('\nIframes after click:', JSON.stringify(iframes, null, 2));
  }
  
  await page.close();
  await browser.close();
})().catch(e => console.log(e.message));

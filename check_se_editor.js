const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  // Get the PostView frame
  const postFrame = page.frames().find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('No PostView'); await page.close(); await browser.close(); return; }
  
  // Try clicking comment buttons
  for (const sel of ['#btn_comment_2', 'a._naverCommentWriteBtn', 'a.btn_write_comment', 'a.btn_comment']) {
    const btn = await postFrame.$(sel).catch(() => null);
    if (btn) {
      console.log('Clicking:', sel);
      await btn.click().catch(() => {});
      await page.waitForTimeout(2000);
    }
  }
  
  // Check ALL frames with 'smart' in URL
  const frames = page.frames();
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    if (url.includes('smart') || url.includes('Smart') || url.includes('SE') || url.includes('editor')) {
      console.log(`\nFrame ${i}: ${url.substring(0,200)}`);
      try {
        const info = await f.evaluate(() => {
          return {
            textareas: document.querySelectorAll('textarea').length,
            contentEditables: document.querySelectorAll('[contenteditable]').length,
            bodyText: (document.body?.innerText || '').substring(0, 200).replace(/\n/g, ' | ')
          };
        });
        console.log('  Info:', JSON.stringify(info));
      } catch(e) {
        console.log('  Error:', e.message.substring(0, 60));
      }
    }
  }
  
  // Also check PostView frame inner iframes
  const subIframes = await postFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('iframe')).map(f => ({
      src: f.src.substring(0, 200),
      id: f.id,
      className: f.className?.substring(0, 50)
    }));
  });
  console.log('\nSub-iframes in PostView:');
  subIframes.forEach(sf => console.log(`  id="${sf.id}" src="${sf.src}"`));
  
  // Get the full HTML of PostView to look for comment structure
  const html = await postFrame.evaluate(() => {
    const body = document.body?.innerHTML || '';
    const idx = body.indexOf('comment');
    if (idx > 0) return body.substring(Math.max(0, idx-300), idx+500).replace(/</g, '<').substring(0, 1200);
    return 'Comment section not found in HTML';
  });
  console.log('\nHTML around "comment":', html);
  
  await page.close();
  await browser.close();
})().catch(e => console.log(e.message));

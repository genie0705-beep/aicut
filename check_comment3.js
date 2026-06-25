const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  
  // Auto-dismiss dialogs
  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message().substring(0, 100));
    await dialog.dismiss().catch(() => {});
  });
  
  // Use the existing blog tab to navigate to AICUT's latest post with comments
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=223738510723', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  // Find all frames
  const frames = page.frames();
  console.log(`Frames: ${frames.length}`);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    if (url.includes('Comment') || url.includes('comment') || url.includes('blog.naver.com/PostView')) {
      console.log(`\nFrame ${i}: ${url.substring(0, 200)}`);
      try {
        const text = await f.evaluate(() => document.body?.innerText?.substring(0, 500) || 'Frame empty');
        console.log('Text snippet:', text.replace(/\n/g, ' / ').substring(0, 200));
      } catch(e) {
        console.log(`  Text error: ${e.message.substring(0, 50)}`);
      }
      
      try {
        const inputs = await f.evaluate(() => {
          return Array.from(document.querySelectorAll('textarea'))
            .map(el => ({
              placeholder: (el.placeholder || '').substring(0, 40),
              id: (el.id || '').substring(0, 30),
              class: (el.className || '').substring(0, 50)
            }));
        });
        if (inputs.length > 0) console.log('Textareas:', JSON.stringify(inputs, null, 2));
      } catch(e) {}
      
      try {
        const btns = await f.evaluate(() => {
          return Array.from(document.querySelectorAll('button'))
            .map(el => ({
              text: (el.textContent?.trim() || '').substring(0, 30),
              id: (el.id || '').substring(0, 30),
              class: (el.className || '').substring(0, 50)
            }));
        });
        if (btns.length > 0) console.log('Buttons:', JSON.stringify(btns, null, 2));
      } catch(e) {}
    }
  }
  
  await page.close().catch(() => {});
  await browser.close();
})().catch(e => console.error('Error:', e.message));

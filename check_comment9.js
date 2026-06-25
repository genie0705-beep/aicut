const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const page = await browser.contexts()[0].newPage();
  page.on('dialog', async d => await d.dismiss().catch(() => {}));
  
  await page.goto('https://blog.naver.com/lg4600/224271601694', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  const postFrame = page.frames().find(f => f.url().includes('PostView'));
  if (!postFrame) { console.log('No PostView frame'); await page.close(); await browser.close(); return; }
  
  // Click the comment button
  const btn = await postFrame.$('#btn_comment_2');
  if (btn) {
    await btn.click();
    console.log('Clicked comment button');
    await page.waitForTimeout(3000);
  } else {
    console.log('Comment button not found');
  }
  
  // Check all frames again
  const frames = page.frames();
  console.log(`Frames after click: ${frames.length}`);
  
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    const url = f.url();
    console.log(`\nFrame ${i}: ${url.substring(0, 150)}`);
    
    if (url.includes('PostView') || url.includes('Comment') || url.includes('SE') || url.includes('se_module') || url.includes('blog.naver.com')) {
      try {
        // Check for textarea or contenteditable elements
        const editable = await f.evaluate(() => {
          const ta = document.querySelector('textarea');
          const ce = document.querySelector('[contenteditable]');
          
          // Check for SE2 editor
          const seEditors = document.querySelectorAll('[class*="se_"], [class*="smart"], [class*="editor"]');
          const seInfo = Array.from(seEditors).slice(0, 5).map(el => ({
            tag: el.tagName,
            id: el.id?.substring(0, 30),
            cls: el.className?.substring(0, 50)
          }));
          
          return {
            textarea: ta ? { placeholder: ta.placeholder, id: ta.id, visible: ta.offsetParent !== null } : null,
            contentEditable: ce ? { id: ce.id, visible: ce.offsetParent !== null } : null,
            seEditors: seInfo
          };
        });
        
        if (editable.textarea || editable.contentEditable || editable.seEditors.length > 0) {
          console.log('Found editable:', JSON.stringify(editable, null, 2));
          
          // Also check for forms
          const forms = await f.evaluate(() => {
            return Array.from(document.querySelectorAll('form')).map(form => ({
              action: form.action?.substring(0, 100),
              id: form.id?.substring(0, 30)
            }));
          });
          if (forms.length > 0) console.log('Forms:', JSON.stringify(forms, null, 2));
        }
      } catch(e) {
        console.log(`  Error: ${e.message.substring(0, 60)}`);
      }
    }
  }
  
  await page.close();
  await browser.close();
})().catch(e => console.log(e.message));

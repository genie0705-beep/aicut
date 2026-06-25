const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('visily.ai')) { page = pages[i]; break; }
  }
  if (!page) { console.log('Visily not found'); await b.close(); return; }

  await page.bringToFront();
  await new Promise(r => setTimeout(r, 2000));

  // Close popups
  for (let j = 0; j < 3; j++) {
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // Click on 'Generate with AI' 
  await page.evaluate(() => {
    const els = document.querySelectorAll('span, div, button');
    for (const el of els) {
      if (el.innerText && el.innerText.trim() === 'Generate with AI' && el.offsetParent !== null) {
        el.click();
        return true;
      }
    }
    return false;
  });
  
  await new Promise(r => setTimeout(r, 3000));

  // Find all input/textarea fields
  const fields = await page.evaluate(() => {
    const results = [];
    const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
    inputs.forEach(el => {
      if (el.offsetParent !== null) {
        results.push({
          tag: el.tagName,
          type: el.type || '',
          placeholder: el.getAttribute('placeholder') || '',
          value: el.value || el.innerText || '',
          id: el.id || '',
          classPart: (el.className || '').substring(0, 50)
        });
      }
    });
    return results;
  });

  console.log('Fields after AI click:');
  fields.forEach(f => {
    console.log(f.tag + ' | type=' + f.type + ' | ph=' + f.placeholder + ' | val=' + f.value.substring(0, 40));
  });

  if (fields.length === 0) {
    // Check what's visible
    const txt = await page.evaluate(() => {
      const body = document.body.innerText;
      const idx = body.indexOf('Generate with AI');
      return body.substring(Math.max(0, idx - 100), idx + 800).replace(/\n/g, ' ');
    });
    console.log('\nNo input found. Context:', txt.substring(0, 600));
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message));

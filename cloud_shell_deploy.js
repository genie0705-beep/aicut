const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  
  // Navigate to hosting page
  await page.goto('https://console.firebase.google.com/project/aicut-28ab5/hosting/sites/aicut-28ab5', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // Open Cloud Shell
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const shellBtn = btns.find(b => b.innerText?.trim().includes('Cloud Shell'));
    if (shellBtn) { shellBtn.click(); return true; }
    return false;
  });
  
  console.log('Clicked Cloud Shell button');
  await new Promise(r => setTimeout(r, 5000));
  
  // Check if Cloud Shell iframe appeared
  const frames = page.frames();
  console.log('Total frames:', frames.length);
  frames.forEach((f, i) => console.log('Frame ' + i + ': ' + (f.url() || '').substring(0, 100)));
  
  // Look for Cloud Shell frame
  const shellFrame = frames.find(f => f.url().includes('cloud-shell'));
  if (shellFrame) {
    console.log('Cloud Shell frame found!');
    const txt = await shellFrame.evaluate(() => document.body.innerText.substring(0, 1000));
    console.log('Shell text:', txt.replace(/\n/g, ' ').substring(0, 500));
  } else {
    console.log('No Cloud Shell frame yet, checking page...');
    const txt = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log('Page:', txt.replace(/\n/g, ' ').substring(0, 800));
  }
  
  await b.close();
})().catch(e => console.log('ERR:', e.message));

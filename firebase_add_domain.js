const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  let pages = ctx.pages();
  let page = null;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].url().includes('console.firebase.google.com') && pages[i].url().includes('hosting')) {
      page = pages[i];
      break;
    }
  }
  if (!page) { console.log('No Firebase page'); await b.close(); return; }

  await page.bringToFront();
  await new Promise(r => setTimeout(r, 1000));

  // Try clicking the button via Playwright locator
  try {
    const btn = page.locator('button').filter({ hasText: '커스텀 도메인 추가' }).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout: 5000 });
    console.log('Clicked button via locator');
  } catch(e) {
    console.log('Locator click failed:', e.message.substring(0, 80));
    
    // Fallback: click by coordinates
    const coords = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.innerText.includes('커스텀 도메인') && b.offsetParent !== null);
      if (!target) return null;
      const rect = target.getBoundingClientRect();
      return { x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
    });
    
    if (coords) {
      console.log('Button at:', coords.x, coords.y);
      await page.mouse.click(coords.x, coords.y);
      console.log('Clicked via coordinates');
    }
  }

  await new Promise(r => setTimeout(r, 3000));

  // Check dialog
  const dialogText = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    if (dlg && dlg.offsetParent !== null) return dlg.innerText.substring(0, 500).replace(/\n/g, ' ').trim();
    return 'no dialog';
  });
  console.log('Dialog:', dialogText);

  if (dialogText !== 'no dialog' && dialogText.includes('도메인')) {
    // Type domain
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if (inp.offsetParent !== null && inp.type === 'text') {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          setter.call(inp, 'aicut.co.kr');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
      }
      return false;
    });
    console.log('Domain typed');
    await new Promise(r => setTimeout(r, 1000));

    // Click '계속'
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const contBtn = btns.find(b => b.innerText.trim() === '계속' && b.offsetParent !== null);
      if (contBtn) { contBtn.click(); return true; }
      return false;
    });
    console.log('Clicked 계속');
    await new Promise(r => setTimeout(r, 3000));

    // Show DNS records
    const fullText = await page.evaluate(() => document.body.innerText.replace(/\n/g, ' ').trim());
    const recStart = fullText.indexOf('레코드 유형');
    if (recStart > 0) {
      console.log('=== Firebase DNS 설정 ===');
      console.log(fullText.substring(Math.max(0, recStart - 200), recStart + 1500));
    } else {
      const acmeStart = fullText.indexOf('ACME');
      if (acmeStart > 0) {
        console.log(fullText.substring(Math.max(0, acmeStart - 100), acmeStart + 1000));
      }
    }
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message));

const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let page = null;
  for (const p of pages) { if (p.url().includes('instagram.com')) { page = p; break; } }
  if (!page) { console.log('NO INSTA'); b.close(); return; }
  
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  await page.bringToFront();
  await sleep(2000);
  
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  
  // Click create button
  console.log('Clicking create...');
  const createBtn = page.locator('[aria-label="새로운 게시물"]');
  if (await createBtn.count() > 0) {
    const parent = createBtn.locator('..');
    await parent.click();
  } else {
    // Try svg approach
    await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      for (const svg of svgs) {
        const title = svg.querySelector('title');
        if (title && title.textContent === '새로운 게시물') {
          let el = svg.parentElement;
          while (el && el.tagName !== 'A' && el.tagName !== 'BUTTON' && !el.getAttribute('href')) {
            el = el.parentElement;
          }
          if (el) { el.click(); return; }
        }
      }
    });
  }
  await sleep(3000);
  
  // Take screenshot to see what's showing
  await page.screenshot({ path: 'insta_step1_create.png' });
  console.log('Screenshot after create');
  
  // Get all visible text content
  const text1 = await page.evaluate(() => {
    return document.body.innerText.substring(0, 2000);
  });
  console.log('TEXT:', text1.replace(/\s+/g, ' ').trim().substring(0, 500));
  
  // Get modal/overlay info
  const overlay = await page.evaluate(() => {
    // Get all visible modals/overlays/dialogs
    const results = [];
    document.querySelectorAll('[role="dialog"], [role="presentation"], [class*="overlay"], [class*="modal"], [class*="dialog"]').forEach(el => {
      if (el.offsetParent !== null) {
        const text = el.innerText.replace(/\s+/g, ' ').trim().substring(0, 200);
        results.push({ tag: el.tagName, role: el.getAttribute('role'), cls: el.className.substring(0, 60), text });
      }
    });
    return results;
  });
  console.log('OVERLAY:', JSON.stringify(overlay, null, 2));
  
  b.close();
})().catch(e => console.error('ERR:', e.message));

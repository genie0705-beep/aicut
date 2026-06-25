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
  
  // Navigate to insta home
  try { await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await sleep(4000);
  
  // Check for create button
  const state1 = await page.evaluate(() => {
    // Look for all SVG titles
    const titles = [];
    document.querySelectorAll('svg title').forEach(t => titles.push(t.textContent));
    
    // Look for aria-labels
    const aria = [];
    document.querySelectorAll('[aria-label]').forEach(el => {
      const label = el.getAttribute('aria-label');
      if (label && (label.includes('게시') || label.includes('Post') || label.includes('New') || label.includes('새'))) {
        aria.push({ tag: el.tagName, label });
      }
    });
    
    return { svgTitles: titles.slice(0, 10), ariaLabels: aria.slice(0, 10) };
  });
  console.log('STATE1:', JSON.stringify(state1, null, 2));
  
  // Try clicking via aria-label
  const clicked = await page.evaluate(() => {
    const el = document.querySelector('[aria-label="새로운 게시물"], [aria-label="New post"]');
    if (el) { el.closest('[role="button"]')?.click() || el.click(); return true; }
    return false;
  });
  console.log('CREATE CLICKED:', clicked);
  await sleep(2000);
  
  // After clicking create, check for menu options
  const state2 = await page.evaluate(() => {
    const buttons = [];
    document.querySelectorAll('button, [role="button"], [role="menuitem"]').forEach(el => {
      if (el.offsetParent !== null) {
        const t = el.innerText?.trim().substring(0, 30);
        if (t) buttons.push(t);
      }
    });
    return buttons.slice(0, 20);
  });
  console.log('STATE2 (menus):', JSON.stringify(state2));
  
  // Check for file input
  const files = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    return Array.from(inputs).map(i => ({ id: i.id, accept: i.accept, visible: i.offsetParent !== null }));
  });
  console.log('FILE INPUTS:', JSON.stringify(files));
  
  await page.screenshot({ path: 'insta_state.png' });
  console.log('SCREENSHOT SAVED');
  
  b.disconnect();
})().catch(e => console.error('ERR:', e.message.substring(0, 200)));

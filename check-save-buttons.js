const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const dnsPage = browser.contexts()[0].pages().find(p => p.url().includes('app.hosting.kr') && p.url().includes('dns'));
  if (!dnsPage) { console.error('DNS page not found'); await browser.close(); return; }

  // Check buttons in the y=900-1170 range (where the inline forms are)
  const formButtons = await dnsPage.evaluate(() => {
    const results = [];
    const allBtns = document.querySelectorAll('button, [data-testid="Check"], [data-testid="Close"], [data-testid="Save"], [data-testid="Cancel"]');
    allBtns.forEach(el => {
      const rect = el.getBoundingClientRect();
      const tag = el.tagName;
      const testid = el.getAttribute('data-testid') || '';
      const text = el.textContent?.trim().slice(0, 20) || '';
      
      if (rect.y >= 900 && rect.y <= 1170 && rect.width > 0) {
        const classStr = typeof el.className === 'string' ? el.className.slice(0, 60) : '';
        results.push({ tag, testid, text, x: rect.x.toFixed(0), y: rect.y.toFixed(0), w: rect.width.toFixed(0), h: rect.height.toFixed(0), class: classStr });
      }
    });
    return results;
  });
  
  console.log('=== Buttons in y=900..1170 (inline forms) ===');
  for (const b of formButtons) {
    console.log(`  ${b.tag} testid="${b.testid}" text="${b.text}" @(${b.x},${b.y}) ${b.w}x${b.h} class="${b.class}"`);
  }
  
  // Also check for SVG elements (check/cancel icons)
  const formSvgs = await dnsPage.evaluate(() => {
    const results = [];
    document.querySelectorAll('svg').forEach((svg, idx) => {
      const rect = svg.getBoundingClientRect();
      if (rect.y >= 900 && rect.y <= 1170 && rect.width >= 16) {
        results.push({ idx, y: rect.y.toFixed(0), x: rect.x.toFixed(0), w: rect.width.toFixed(0), h: rect.height.toFixed(0), html: svg.outerHTML.slice(0, 150) });
      }
    });
    return results;
  });
  
  console.log('\n=== SVG elements in y=900..1170 ===');
  for (const s of formSvgs) {
    console.log(`  [${s.idx}] @(${s.x},${s.y}) ${s.w}x${s.h} ${s.html}`);
  }
  
  // Get a comprehensive view of the entire form area
  const fullFormArea = await dnsPage.evaluate(() => {
    const results = [];
    const check = document.querySelector('[data-testid="Check"]');
    const close = document.querySelector('[data-testid="Close"]');
    
    if (check) {
      const rect = check.getBoundingClientRect();
      results.push({ type: 'Check', tag: check.tagName, x: rect.x, y: rect.y, w: rect.width, h: rect.height });
    }
    if (close) {
      const rect = close.getBoundingClientRect();
      results.push({ type: 'Close', tag: close.tagName, x: rect.x, y: rect.y, w: rect.width, h: rect.height });
    }
    
    // Look for any element with data-testid containing "Check" or "check" or "Save" or "save"
    document.querySelectorAll('[data-testid*="heck" i], [data-testid*="heck" i], [data-testid*="save" i], [data-testid*="Save" i], [data-testid*="lose" i], [data-testid*="ose" i]').forEach(el => {
      const rect = el.getBoundingClientRect();
      results.push({ type: el.getAttribute('data-testid'), tag: el.tagName, x: rect.x, y: rect.y, w: rect.width, h: rect.height });
    });
    
    // Also search all elements with aria-label 
    document.querySelectorAll('[aria-label*="check" i], [aria-label*="save" i], [aria-label*="confirm" i], [aria-label*="cancel" i], [aria-label*="delete" i], [aria-label*="close" i]').forEach(el => {
      const rect = el.getBoundingClientRect();
      results.push({ type: 'aria-' + el.getAttribute('aria-label'), tag: el.tagName, x: rect.x, y: rect.y, w: rect.width, h: rect.height });
    });
    
    return results;
  });
  
  console.log('\n=== Check/Save/Cancel elements ===');
  for (const el of fullFormArea) {
    console.log(`  ${el.type} ${el.tag} @(${el.x.toFixed(0)},${el.y.toFixed(0)}) ${el.w.toFixed(0)}x${el.h.toFixed(0)}`);
  }
  
  await browser.close();
}

main().catch(err => { console.error('Error:', err); process.exit(1); });

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('editmon'));
  if (!p) { console.log('no editmon tab'); return; }
  
  await p.bringToFront();
  await p.waitForTimeout(2000);
  
  // Find clickable post links
  const info = await p.evaluate(() => {
    const all = document.querySelectorAll('a, td, .subject, [onclick]');
    const results = [];
    all.forEach((el, i) => {
      const t = el.textContent.trim();
      if (t.length > 5 && t.length < 100 && !t.includes('광고') && !t.includes('안내')) {
        results.push({
          idx: i,
          tag: el.tagName,
          text: t.substring(0, 60),
          href: el.href || '',
          onclick: (el.getAttribute('onclick') || '').substring(0, 60)
        });
      }
    });
    return results.slice(0, 20);
  });
  
  console.log('Links found:', info.length);
  info.forEach((l, i) => console.log((i+1) + '.', l.text.substring(0, 50)));
  
  if (info.length > 0) {
    // Try clicking first link
    const first = info[0];
    console.log('Clicking:', first.text);
    
    if (first.href && first.href.startsWith('http')) {
      await p.goto(first.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(e => console.log('goto error:', e.message));
    } else if (first.onclick) {
      await p.evaluate((fn) => { try { eval(fn); } catch(e) {} }, first.onclick);
    }
    await p.waitForTimeout(2000);
    
    const detail = await p.evaluate(() => ({
      url: window.location.href.substring(0, 100),
      text: document.body.innerText.substring(0, 1000).replace(/\n/g, ' ').trim()
    }));
    console.log('Result:', JSON.stringify(detail, null, 2));
  }
})();

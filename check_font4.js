const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // Test Nanum Gothic rendering via setContent (not file://)
  await page.setContent('<div id="test" style="font-family: Nanum Gothic; font-size: 48px; font-weight: 800;">Nanum Gothic 한글 ABC123</div>');
  await page.waitForTimeout(500);
  
  const info = await page.evaluate(() => {
    const el = document.getElementById('test');
    if (!el) return { error: 'no element' };
    const computed = window.getComputedStyle(el);
    return { 
      font: computed.fontFamily,
      width: el.offsetWidth,
      height: el.offsetHeight
    };
  });
  console.log('=== setContent (Nanum Gothic) ===');
  console.log(JSON.stringify(info));
  
  // Now test via file:// with Nanum Gothic
  const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body { font-family: "Nanum Gothic", sans-serif; font-size: 48px; font-weight: 800; }</style></head><body>Nanum Gothic file:// 한글</body></html>';
  const fs = require('fs');
  fs.writeFileSync('C:/Users/paul/.openclaw/workspace/_font_test.html', html);
  
  await page.goto('file:///C:/Users/paul/.openclaw/workspace/_font_test.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  
  const info2 = await page.evaluate(() => {
    const el = document.body;
    const computed = window.getComputedStyle(el);
    return {
      font: computed.fontFamily,
      textWidth: el.offsetWidth,
      textHeight: el.offsetHeight
    };
  });
  console.log('\n=== file:// (Nanum Gothic) ===');
  console.log(JSON.stringify(info2));
  
  await page.close();
  await b.close();
})();

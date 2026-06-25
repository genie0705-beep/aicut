const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // Test Malgun Gothic rendering in Playwright's connected browser
  await page.setContent('<div id="t1" style="font-family: Malgun Gothic; font-size: 48px; font-weight: 800;">Malgun Gothic 테스트</div><div id="t2" style="font-family: sans-serif; font-size: 48px; font-weight: 800;">sans-serif 테스트</div><div id="t3" style="font-family: Gulim; font-size: 48px;">Gulim 테스트</div><div id="t4" style="font-family: Dotum; font-size: 48px;">Dotum 테스트</div><div id="t5" style="font-family: Batang; font-size: 48px;">Batang 테스트</div>');
  await page.waitForTimeout(500);
  
  const widths = await page.evaluate(() => {
    const results = {};
    ['t1', 't2', 't3', 't4', 't5'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) {
        results[id] = {
          fontFamily: window.getComputedStyle(el).fontFamily,
          width: el.offsetWidth
        };
      }
    });
    return results;
  });
  
  console.log('=== 폰트 렌더링 폭 비교 ===');
  Object.entries(widths).forEach(([key, val]) => {
    console.log(`  ${key}: ${val.fontFamily} → 폭=${val.width}px`);
  });
  
  // Compare widths to detect if Malgun Gothic is actually rendering
  const isMalgunReal = widths.t1 && widths.t2 && widths.t1.width !== widths.t2.width;
  console.log(`\nMalgun Gothic ≠ sans-serif: ${isMalgunReal ? '✅ 실제 적용됨' : '❌ fallback (sans-serif와 동일)'}`);
  
  // Check if Gulim works (another common Windows Korean font)
  const isGulimReal = widths.t3 && widths.t2 && widths.t3.width !== widths.t2.width;
  console.log(`Gulim ≠ sans-serif: ${isGulimReal ? '✅ 실제 적용됨' : '❌ fallback'}`);
  
  await page.close();
  await b.close();
})();

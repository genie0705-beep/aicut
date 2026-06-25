const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 700 });
  
  // Test 1: Direct DOM element rendering with specific fonts
  await page.setContent(`
    <div style="font-family: 'Nanum Gothic', sans-serif; font-size: 48px; font-weight: 800;">쇼핑몰 테스트1</div>
    <div style="font-family: 'Malgun Gothic', sans-serif; font-size: 48px; font-weight: 800;">쇼핑몰 테스트2</div>
    <div style="font-family: 'Noto Sans KR', sans-serif; font-size: 48px; font-weight: 800;">쇼핑몰 테스트3</div>
    <div style="font-family: sans-serif; font-size: 48px; font-weight: 800;">쇼핑몰 테스트4</div>
  `);
  await page.waitForTimeout(500);
  
  const widths = await page.evaluate(() => {
    const divs = document.querySelectorAll('div');
    return Array.from(divs).map(function(d) {
      const s = window.getComputedStyle(d);
      return {
        font: s.fontFamily,
        width: d.offsetWidth,
        text: d.innerText.substring(0, 10)
      };
    });
  });
  
  console.log('=== DOM 폰트 렌더링 폭 비교 ===');
  widths.forEach(function(w) { console.log('  ' + w.font.substring(0, 40) + ' → ' + w.width + 'px : ' + w.text); });
  
  // Check if any Korean font renders differently from sans-serif
  const sansWidth = widths.find(function(w) { return w.font.includes('sans-serif') && !w.font.includes('Nanum') && !w.font.includes('Malgun') && !w.font.includes('Noto'); });
  const otherWidths = widths.filter(function(w) { return w.font !== (sansWidth ? sansWidth.font : ''); });
  
  console.log('\n=== 한글 렌더링 가능 폰트 ===');
  if (sansWidth) {
    otherWidths.forEach(function(w) {
      const diff = w.width - sansWidth.width;
      console.log('  ' + (diff !== 0 ? '✅' : '❌') + ' ' + w.font.substring(0, 40) + ' diff=' + diff + 'px');
    });
  }
  
  await page.close();
  await b.close();
})();

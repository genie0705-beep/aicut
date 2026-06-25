const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 700 });
  
  // Test font availability in this Chrome instance
  const fonts = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const c = canvas.getContext('2d');
    
    const testFonts = [
      'Noto Sans KR',
      'Malgun Gothic', 
      'Nanum Gothic',
      'sans-serif',
      'serif'
    ];
    
    const results = [];
    testFonts.forEach(function(font) {
      c.font = '48px ' + font;
      const w = c.measureText('한글테스트').width;
      c.font = '48px serif';
      const serifW = c.measureText('한글테스트').width;
      results.push({
        font: font,
        width: Math.round(w),
        serifWidth: Math.round(serifW),
        diff: Math.round((w - serifW) * 10) / 10,
        available: Math.abs(w - serifW) > 2
      });
    });
    return results;
  });
  
  console.log('=== Playwright Chrome 폰트 가용성 ===');
  console.log('(폰트 설치 후 Chrome 재시작 필요할 수 있음)');
  console.log('');
  fonts.forEach(function(f) {
    console.log('  ' + (f.available ? '✅' : '❌') + ' ' + f.font.padEnd(20) + 
      ' width=' + f.width + ' serif=' + f.serifWidth + 
      ' diff=' + (f.diff >= 0 ? '+' : '') + f.diff);
  });
  
  const notoAvail = fonts.find(function(f) { return f.font === 'Noto Sans KR' && f.available; });
  if (notoAvail) {
    console.log('\n✅ Noto Sans KR 사용 가능! PNG 생성 가능');
  } else {
    console.log('\n❌ Noto Sans KR이 이 Chrome에 없습니다.');
    console.log('   원인: Chrome이 폰트 설치 전에 실행됨');
    console.log('   해결: Chrome 완전히 종료 후 재시작 필요');
  }
  
  await page.close();
  await b.close();
})();

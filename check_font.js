const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 700 });
  
  await page.goto('file:///C:/Users/paul/.openclaw/workspace/blog_img_shop.html', { 
    waitUntil: 'networkidle', timeout: 15000 
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  
  const fontInfo = await page.evaluate(() => {
    const main = document.querySelector('.main');
    const badge = document.querySelector('.badge');
    
    const computedMain = main ? window.getComputedStyle(main) : null;
    const computedBadge = badge ? window.getComputedStyle(badge) : null;
    
    // Check loaded fonts
    const loadedFonts = [];
    try {
      const fontFaces = document.fonts.values();
      let face = fontFaces.next();
      while (!face.done) {
        loadedFonts.push({ 
          family: face.value.family, 
          style: face.value.style, 
          weight: face.value.weight, 
          status: face.value.status 
        });
        face = fontFaces.next();
      }
    } catch(e) {
      loadedFonts.push({ error: e.message.substring(0, 50) });
    }
    
    return {
      mainFont: computedMain ? computedMain.fontFamily : 'no main',
      mainSize: computedMain ? computedMain.fontSize : '',
      mainWeight: computedMain ? computedMain.fontWeight : '',
      badgeFont: computedBadge ? computedBadge.fontFamily : '',
      loadedFonts: loadedFonts.slice(0, 10)
    };
  });
  
  console.log('=== 폰트 로딩 상태 ===');
  console.log(JSON.stringify(fontInfo, null, 2));
  
  console.log('\n=== 해석 ===');
  const mainFont = fontInfo.mainFont || '';
  if (mainFont.includes('Noto Sans KR')) {
    console.log('✅ Noto Sans KR 적용됨');
  } else if (mainFont.includes('Malgun Gothic')) {
    console.log('⚠️ Malgun Gothic fallback (Noto Sans KR 로딩 실패)');
  } else if (mainFont.includes('sans-serif')) {
    console.log('⚠️ 기본 sans-serif fallback (둘 다 실패)');
  } else {
    console.log('❌ 예상치 못한 폰트:', mainFont);
  }
  
  await page.close();
  await b.close();
})();

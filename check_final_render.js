const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 700, height: 700 });
  
  await page.goto('file:///C:/Users/paul/.openclaw/workspace/blog_img_shop.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  
  // Take screenshot for visual check
  await page.screenshot({ path: 'C:/Users/paul/.openclaw/workspace/_final_test.png', fullPage: false });
  
  // Check actual rendered text vs expected
  const renderCheck = await page.evaluate(() => {
    const main = document.querySelector('.main');
    const badge = document.querySelector('.badge');
    if (!main || !badge) return { error: 'elements not found' };
    
    // Get all text nodes and their actual rendered text
    const mainText = main.innerText || '';
    const badgeText = badge.innerText || '';
    
    // Check for any broken/unrendered characters (?) 
    const brokenChars = (mainText + badgeText).split('').filter(function(c) { return c === '?' || c === '□' || c === '�'; });
    
    // Measure rendered width of Korean text
    const testEl = document.createElement('span');
    testEl.style.fontFamily = "'Nanum Gothic', 'Malgun Gothic', sans-serif";
    testEl.style.fontSize = '48px';
    testEl.style.fontWeight = '800';
    testEl.style.position = 'absolute';
    testEl.style.top = '-9999px';
    testEl.textContent = '쇼핑몰';
    document.body.appendChild(testEl);
    const nanumWidth = testEl.offsetWidth;
    
    // Compare with sans-serif
    testEl.style.fontFamily = 'sans-serif';
    const sansWidth = testEl.offsetWidth;
    
    document.body.removeChild(testEl);
    
    return {
      mainText: mainText,
      badgeText: badgeText,
      brokenCharCount: brokenChars.length,
      widthNanumGothic: nanumWidth,
      widthSansSerif: sansWidth,
      isRenderingKorean: nanumWidth !== sansWidth
    };
  });
  
  console.log('=== 최종 렌더링 검증 ===');
  console.log(JSON.stringify(renderCheck, null, 2));
  
  if (renderCheck.isRenderingKorean) {
    console.log('\n✅ Nanum Gothic 한글 정상 렌더링!');
  } else {
    console.log('\n❌ Nanum Gothic != sans-serif (폴백 사용 중)');
  }
  
  console.log('\n📸 스크린샷: _final_test.png');
  
  await page.close();
  await b.close();
})();

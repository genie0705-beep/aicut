const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // Check what font files are actually available
  const available = await page.evaluate(() => {
    const testWords = ['한글테스트', 'English'];
    const fonts = ['Malgun Gothic', 'Gulim', 'Dotum', 'Batang', 'Nanum Gothic', 
                   'NanumGothic', 'Apple SD Gothic Neo', 'Noto Sans KR', 
                   'Arial', 'Times New Roman', 'Courier New',
                   'Segoe UI', 'Tahoma', 'Verdana',
                   '맑은 고딕', '굴림', '돋움', '바탕'];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const results = [];
    fonts.forEach(function(font) {
      testWords.forEach(function(word) {
        ctx.font = '24px ' + font;
        const w1 = ctx.measureText(word).width;
        ctx.font = '24px serif';
        const w2 = ctx.measureText(word).width;
        
        if (Math.abs(w1 - w2) > 1) {
          results.push({ font: font, word: word, width: w1, diff: Math.round((w1 - w2) * 10) / 10 });
        }
      });
    });
    
    return results;
  });
  
  console.log('=== 사용 가능한 폰트 목록 (serif와 차이나는 것) ===');
  if (available.length === 0) {
    console.log('(한글 폰트 없음 — 모두 fallback)');
  } else {
    available.forEach(function(a) { 
      console.log('  ✅ ' + a.font + ' (' + a.word + ') 폭=' + a.width + ' diff=' + a.diff); 
    });
  }
  
  // Check if there's at least ONE Korean-capable font
  const koreanFonts = available.filter(function(a) { return a.word === '한글테스트'; });
  console.log('\n한글 사용 가능 폰트:', koreanFonts.length > 0 ? koreanFonts.map(function(f) { return f.font; }).join(', ') : '❌ 없음');
  
  await page.close();
  await b.close();
})();

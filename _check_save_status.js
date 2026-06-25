const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // 새 페이지 열기
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 복구 팝업 확인
  const popup = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t.includes('이어서')) {
        btn.click();
        return '있음 - 이어서 작성';
      }
    }
    return '없음';
  });
  console.log('복구 팝업:', popup);
  
  if (popup.includes('있음')) {
    await page.waitForTimeout(3000);
    
    // 저장된 데이터 확인
    const data = await page.evaluate(() => {
      const r = {};
      try {
        const ed = SmartEditor._editors['blogpc001'];
        r.title = ed.getDocumentTitle();
      } catch (e) { r.title = ''; }
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if ((inp.placeholder || '').includes('글감')) {
          r.tags = inp.value.split('#').filter(t => t.trim().length > 0).length;
        }
      }
      return r;
    });
    
    console.log('제목:', data.title || '(없음)');
    console.log('해시태그:', data.tags + '개');
    console.log(data.title && data.tags >= 30 ? '✅ 저장 정상' : '❌ 데이터 부족');
  } else {
    console.log('❌ 저장 데이터 없음');
  }
  
  await b.close();
})();

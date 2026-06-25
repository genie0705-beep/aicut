const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('=== iframe type() 테스트 ===\n');
  
  // iframe contentEditable 찾기
  const frame = page.frameLocator('iframe').first();
  const editable = frame.locator('[contenteditable="true"]');
  const cnt = await editable.count();
  console.log('contentEditable 요소:', cnt > 0 ? '✅' : '❌');
  
  if (cnt > 0) {
    // JavaScript로 iframe body에 직접 focus
    await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
        iframe.contentDocument.body.focus();
      }
    });
    await page.waitForTimeout(500);
    await page.keyboard.type('테스트 문단입니다. iframe 직접 입력 테스트.', { delay: 5 });
    await page.waitForTimeout(1000);
    
    // 저장
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
    });
    await page.waitForTimeout(3000);
    
    // 저장 확인
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // 복구 팝업 - 이어서 작성
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const t = (btn.innerText || '').trim();
        if (t.includes('이어서')) { btn.click(); return; }
      }
    });
    await page.waitForTimeout(3000);
    
    // 데이터 확인
    const check = await page.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        const title = ed.getDocumentTitle();
        const d = ed.getDocumentData();
        const comps = d.document ? d.document.components : [];
        return { title, count: comps.length, types: comps.map(c => c.type).join(', ') };
      } catch (e) { return { error: e.message }; }
    });
    console.log('\n저장 확인:', JSON.stringify(check));
    console.log('iframe type() -> 저장:', check.count > 1 ? '✅ 성공' : '❌ 실패');
  }
  
  await b.close();
})();

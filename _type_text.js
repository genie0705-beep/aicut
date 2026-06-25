const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Title
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅ 제목');
  await page.waitForTimeout(1000);
  
  // Click on the editor canvas at the text module position  
  const clickPos = await page.evaluate(() => {
    const modules = document.querySelectorAll('.se-module-text');
    // Second module is body (first is title)
    const body = modules[1];
    if (body) {
      const r = body.getBoundingClientRect();
      return { x: r.x + 50, y: r.y + 10 };
    }
    return null;
  });
  
  if (!clickPos) { console.log('❌ body module not found'); await b.close(); return; }
  
  console.log('Clicking at:', clickPos.x, clickPos.y);
  await page.mouse.click(clickPos.x, clickPos.y);
  await page.waitForTimeout(1500);
  
  // Check what's focused now
  const activeInfo = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return 'no active element';
    return el.tagName + ' ' + (el.className || '').substring(0, 40) + ' at ' + el.getBoundingClientRect().x + ',' + el.getBoundingClientRect().y;
  });
  console.log('Active:', activeInfo);
  
  // Type text directly via keyboard
  const textToType = '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"';
  console.log('Typing...');
  await page.keyboard.type(textToType, { delay: 30 });
  await page.waitForTimeout(2000);
  
  const check = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    return { textLength: w ? w.innerText.length : 0, preview: w ? w.innerText.substring(0, 80) : '' };
  });
  console.log('After typing:', JSON.stringify(check));
  
  await page.screenshot({ path: 'editor_typed.png' });
  await b.close();
})();

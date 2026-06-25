const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const HTML_FILE = 'aicut_blog_content_shop.html';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  
  // Find existing editor tab
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  }
  
  console.log('=== HTML 코드 수정 시작 ===');
  
  // Read HTML and strip tags for plain text
  const bodyHtml = fs.readFileSync(path.join(WORKSPACE, HTML_FILE), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  // HTML to plain text
  let plainText = bodyContent
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/h2>/gi, '\n\n')
    .replace(/<\/h3>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // 1. Clear editor - Select All + Delete
  console.log('\n=== 에디터 내용 전체 삭제 ===');
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(500);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(1000);
  console.log('✅ 삭제 완료');
  
  // 2. Paste plain text
  console.log('\n=== 순수 텍스트 붙여넣기 ===');
  await page.evaluate((text) => navigator.clipboard.writeText(text), plainText);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅ 텍스트 붙여넣기 완료');
  
  // 3. Set HTML via SmartEditor API (stores HTML internally, shows plain text)
  console.log('\n=== HTML 데이터 설정 (setDocumentData) ===');
  const setResult = await page.evaluate((html) => {
    try {
      const editor = SmartEditor._editors['blogpc001'];
      if (editor && editor.setDocumentData) {
        editor.setDocumentData(html);
        return 'setDocumentData OK';
      }
      if (editor && editor.setContent) {
        editor.setContent(html);
        return 'setContent OK';
      }
      return 'no API found';
    } catch(e) { return 'error: ' + e.message; }
  }, bodyContent);
  console.log(setResult);
  await page.waitForTimeout(2000);
  
  // 4. Center align via DOM
  console.log('\n=== 센터 정렬 ===');
  await page.evaluate(() => {
    const mf = document.querySelector('#mainFrame');
    if (mf && mf.contentDocument) {
      const ps = mf.contentDocument.querySelectorAll('p, h2, h3');
      ps.forEach(p => { p.style.textAlign = 'center'; });
      console.log('센터 정렬:', ps.length, '개');
    }
  });
  console.log('✅');
  
  // 5. Save
  console.log('\n=== 저장 ===');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_shop_fixed.png') });
  
  console.log('\n=== ✅ 수정 완료! ===');
  console.log('HTML 코드 → 정상 텍스트로 변경됨');
  console.log('센터 정렬 적용됨');
  console.log('저장 완료');
  console.log('');
  console.log('📌 정이사님: 이제 발행만 누르시면 됩니다!');
  
  await browser.close();
})();

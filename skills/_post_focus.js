// SE4 — focus body → clipboard paste (MEMORY.md 방식 확실히 구현)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 기존 페이지 dialog 핸들러
  for (const p of ctx.pages()) {
    p.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  }
  
  let blogPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com/aicut')) { blogPage = p; break; }
  }
  if (!blogPage) {
    blogPage = await ctx.newPage();
    blogPage.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  }
  
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(8000);
  
  // 2. 제목
  console.log('2️⃣ 제목 설정...');
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && ed.setDocumentTitle) ed.setDocumentTitle('초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터');
  });
  await blogPage.waitForTimeout(1000);
  
  // 3. HTML 준비
  console.log('3️⃣ HTML 준비...');
  let html = fs.readFileSync('aicut_blog_chobok.html', 'utf8');
  const imgs = ['aicut_blog_chobok_main.png','aicut_blog_chobok_card1.png','aicut_blog_chobok_card2.png','aicut_blog_chobok_card3.png','aicut_blog_chobok_cta.png'];
  for (const f of imgs) {
    const fp = path.join(__dirname, '..', f);
    if (fs.existsSync(fp)) {
      html = html.replace(new RegExp(`src="${f}"`, 'g'), `src="data:image/png;base64,${fs.readFileSync(fp).toString('base64')}"`);
    }
  }
  
  // 4. 클립보드 복사
  console.log('4️⃣ 클립보드 복사...');
  await blogPage.evaluate((h) => {
    return navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }) })]);
  }, html);
  await blogPage.waitForTimeout(1000);
  
  // 5. focusFirstText로 본문 포커스 → Ctrl+V
  console.log('5️⃣ 본문 포커스...');
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    // focusFirstText로 커서를 본문 첫 텍스트로 이동
    if (ed._canvasScrollingService && ed._canvasScrollingService.focusFirstText) {
      ed._canvasScrollingService.focusFirstText();
    } else if (ed._canvasScrollingService && ed._canvasScrollingService.focusToFirstComp) {
      ed._canvasScrollingService.focusToFirstComp();
    }
  });
  await blogPage.waitForTimeout(2000);
  
  // 6. Ctrl+A → Ctrl+V
  console.log('6️⃣ Ctrl+V...');
  await blogPage.keyboard.press('Control+a');
  await blogPage.waitForTimeout(500);
  await blogPage.keyboard.press('Control+v');
  await blogPage.waitForTimeout(8000);
  
  // 7. 내용 확인
  const check = await blogPage.evaluate(() => {
    const ds = window.SmartEditor._editors['blogpc001']._documentService;
    const text = ds.getContentText ? ds.getContentText() : 'no method';
    const body = document.querySelector('.se-body');
    return { 
      textLen: text.length, 
      textSample: text.slice(0, 100),
      bodyLen: body ? body.innerHTML.length : 0
    };
  });
  console.log('7️⃣ 내용 확인:', JSON.stringify(check));
  
  // 8. 저장
  console.log('8️⃣ 저장...');
  await blogPage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.innerText.trim() === '저장') b.click();
    });
  });
  await blogPage.waitForTimeout(2000);
  
  await blogPage.screenshot({ path: 'debug_blog_done.png', fullPage: false });
  console.log('✅ 완료!');
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
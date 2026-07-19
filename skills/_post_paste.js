// SE4 — 본문 영역 클릭 → Ctrl+V 붙여넣기
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  const blogPage = await ctx.newPage();
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(8000);
  
  // 2. 제목 설정
  console.log('2️⃣ 제목 입력...');
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && ed.setDocumentTitle) {
      ed.setDocumentTitle('초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터');
    }
  });
  await blogPage.waitForTimeout(1000);
  
  // 3. HTML 준비
  console.log('3️⃣ HTML 준비...');
  let html = fs.readFileSync('aicut_blog_chobok.html', 'utf8');
  const imgs = ['aicut_blog_chobok_main.png','aicut_blog_chobok_card1.png','aicut_blog_chobok_card2.png','aicut_blog_chobok_card3.png','aicut_blog_chobok_cta.png'];
  for (const f of imgs) {
    const fp = path.join(__dirname, '..', f);
    if (fs.existsSync(fp)) {
      const b64 = fs.readFileSync(fp).toString('base64');
      html = html.replace(new RegExp(`src="${f}"`, 'g'), `src="data:image/png;base64,${b64}"`);
    }
  }
  
  // 4. 클립보드 복사
  console.log('4️⃣ 클립보드 복사...');
  await blogPage.evaluate((h) => {
    return navigator.clipboard.write([
      new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }) })
    ]);
  }, html);
  await blogPage.waitForTimeout(1000);
  
  // 5. 본문 영역 클릭 (se-canvas 안의 내용 영역)
  console.log('5️⃣ 본문 영역 클릭...');
  await blogPage.evaluate(() => {
    // SE4 본문 영역 찾기
    const body = document.querySelector('.se-body');
    if (body) {
      // 내부의 contenteditable이나 첫 요소 클릭
      const inner = body.querySelector('[contenteditable], p, div');
      if (inner) {
        inner.click();
        return 'clicked: ' + (inner.tagName) + (inner.className ? '.'+inner.className.slice(0,30) : '');
      }
      body.click();
      return 'clicked: se-body';
    }
    return 'no se-body found';
  });
  await blogPage.waitForTimeout(2000);
  
  // 스크린샷 (클릭 후 상태)
  await blogPage.screenshot({ path: 'debug_before_paste.png', fullPage: false });
  
  // 6. 기존 내용 전체 선택 후 Ctrl+V
  console.log('6️⃣ Ctrl+V...');
  await blogPage.keyboard.press('Control+a');
  await blogPage.waitForTimeout(500);
  await blogPage.keyboard.press('Control+v');
  await blogPage.waitForTimeout(8000);
  
  // 7. 내용 확인
  const postCheck = await blogPage.evaluate(() => {
    const body = document.querySelector('.se-body');
    if (body) return { innerLen: body.innerHTML.length, textLen: body.innerText.length, textSample: body.innerText.slice(0, 100) };
    return null;
  });
  console.log('7️⃣ 본문 확인:', JSON.stringify(postCheck));
  
  // 8. 저장
  console.log('8️⃣ 저장...');
  await blogPage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.innerText.trim() === '저장') { b.click(); }
    });
  });
  await blogPage.waitForTimeout(3000);
  
  await blogPage.screenshot({ path: 'debug_blog_done.png', fullPage: false });
  console.log('✅ 저장 완료');
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
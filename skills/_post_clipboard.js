// SE4 — 클립보드 붙여넣기 방식 (MEMORY.md 방식)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let blogPage = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com')) {
      blogPage = p;
      blogPage.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
      break;
    }
  }
  if (!blogPage) {
    blogPage = await ctx.newPage();
    blogPage.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  }
  
  // 1. 글쓰기 페이지
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(5000);
  
  // 2. 제목
  console.log('2️⃣ 제목 입력...');
  // 기존 draft 내용 지우고 새 제목
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && ed.setDocumentTitle) {
      ed.setDocumentTitle('초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터');
    }
  });
  await blogPage.waitForTimeout(1000);
  
  // 3. HTML 준비 (base64 이미지 인라인)
  console.log('3️⃣ HTML 준비...');
  let html = fs.readFileSync('aicut_blog_chobok.html', 'utf8');
  const imgs = ['aicut_blog_chobok_main.png','aicut_blog_chobok_card1.png','aicut_blog_chobok_card2.png','aicut_blog_chobok_card3.png','aicut_blog_chobok_cta.png'];
  for (const f of imgs) {
    const p = path.join(__dirname, '..', f);
    if (fs.existsSync(p)) {
      const b64 = fs.readFileSync(p).toString('base64');
      html = html.replace(new RegExp(`src="${f}"`, 'g'), `src="data:image/png;base64,${b64}"`);
    }
  }
  
  // 4. 클립보드에 HTML 복사
  console.log('4️⃣ 클립보드 복사...');
  await blogPage.evaluate((h) => {
    return navigator.clipboard.write([
      new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }) })
    ]);
  }, html);
  await blogPage.waitForTimeout(1000);
  
  // 5. 에디터 본문 영역 찾기 (iframe 내부)
  console.log('5️⃣ 에디터 iframe 찾기...');
  const editorFrame = await blogPage.evaluate(() => {
    // SE4는 main content를 iframe 안에 로드
    const iframes = document.querySelectorAll('iframe');
    for (const f of iframes) {
      const src = f.src || '';
      if (src.includes('se2') || src.includes('editor') || f.id.includes('se')) {
        return { id: (f.id || ''), src: src.slice(0, 100) };
      }
    }
    // SmartEditor 앱 프레임 찾기
    const seRoot = document.querySelector('#__se_app, .se-app, [data-editor]');
    if (seRoot) {
      const ce = seRoot.querySelector('[contenteditable]');
      if (ce) return { tag: ce.tagName, contentEditable: true };
    }
    return null;
  });
  console.log('   에디터 프레임:', JSON.stringify(editorFrame));
  
  // 6. Tab으로 본문 이동 후 Ctrl+V
  console.log('6️⃣ 본문 이동 후 Ctrl+V...');
  await blogPage.keyboard.press('Tab');
  await blogPage.waitForTimeout(500);
  await blogPage.keyboard.press('Tab');
  await blogPage.waitForTimeout(500);
  await blogPage.keyboard.press('Control+v');
  await blogPage.waitForTimeout(5000);
  
  // 7. 저장
  console.log('7️⃣ 저장...');
  await blogPage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.innerText.trim() === '저장') { b.click(); }
    });
  });
  await blogPage.waitForTimeout(3000);
  
  // 8. 스크린샷
  await blogPage.screenshot({ path: 'debug_blog_final.png', fullPage: true });
  console.log('\n✅ 완료! 스크린샷: debug_blog_final.png');
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
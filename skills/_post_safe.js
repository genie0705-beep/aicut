// SE4 — dialog 핸들러 on all existing pages, then clean navigation
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 모든 기존 페이지에 dialog 핸들러 설정 (수동 dismiss)
  for (const p of ctx.pages()) {
    p.on('dialog', async dialog => {
      try { await dialog.dismiss(); } catch(e) {}
    });
  }
  
  // 모든 창 닫기 (선택사항) - 하지만 기존 탭 유지
  // blog 탭 찾기
  let blogPage = null;
  const pages = ctx.pages();
  console.log('전체 탭:', pages.length);
  
  for (const p of pages) {
    if (p.url().includes('blog.naver.com')) {
      blogPage = p;
      console.log('블로그 탭 찾음:', p.url().slice(0, 80));
      break;
    }
  }
  
  if (!blogPage) {
    blogPage = await ctx.newPage();
    blogPage.on('dialog', async dialog => {
      try { await dialog.dismiss(); } catch(e) {}
    });
    console.log('새 탭 생성');
  }
  
  // navigate to postwrite
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(8000);
  console.log('   URL:', blogPage.url());
  
  // 2. 제목
  console.log('2️⃣ 제목 설정...');
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && ed.setDocumentTitle) {
      ed.setDocumentTitle('초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터');
    }
  });
  await blogPage.waitForTimeout(1500);
  
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
  
  // 4. setDocumentData
  console.log('4️⃣ setDocumentData...');
  const result = await blogPage.evaluate((h) => {
    const ed = window.SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    try {
      if (ds.resetDocumentData) ds.resetDocumentData();
      ds.setDocumentData(h, { type: 'text/html' });
      return 'success';
    } catch(e) {
      return 'error: ' + e.message;
    }
  }, html);
  console.log('   결과:', result);
  
  await blogPage.waitForTimeout(3000);
  
  // 5. 내용 확인
  const check = await blogPage.evaluate(() => {
    const ds = window.SmartEditor._editors['blogpc001']._documentService;
    const text = ds.getContentText ? ds.getContentText() : null;
    return { textLen: text ? text.length : 0, text: text ? text.slice(0, 100) : null };
  });
  console.log('5️⃣ 내용 확인:', JSON.stringify(check));
  
  // 6. 저장
  console.log('6️⃣ 저장...');
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
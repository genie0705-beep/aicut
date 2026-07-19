// SE4 — 기존 블로그 탭 활용, dialog 문제 회피
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 기존 블로그 탭 찾기
  let blogPage = null;
  for (const p of ctx.pages()) {
    const url = p.url();
    if (url.includes('blog.naver.com/aicut') && url.includes('postwrite')) {
      blogPage = p;
      console.log('기존 postwrite 탭 사용');
      break;
    }
  }
  
  if (!blogPage) {
    // 기존 aicut 블로그 탭 찾기
    for (const p of ctx.pages()) {
      const url = p.url();
      if (url.includes('blog.naver.com/aicut')) {
        blogPage = p;
        console.log('기존 블로그 탭 사용:', url.slice(0, 80));
        break;
      }
    }
  }
  
  if (!blogPage) {
    console.log('새 탭 생성');
    blogPage = await ctx.newPage();
  }
  
  // dialog 핸들러를 context 수준에서 처리
  ctx.on('page', page => {
    page.on('dialog', async dialog => {
      try {
        await dialog.dismiss();
      } catch(e) {}
    });
  });
  
  // 글쓰기 페이지로 이동
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
  
  // 4. documentService.setDocumentData + refresh
  console.log('4️⃣ setDocumentData 시도...');
  const result = await blogPage.evaluate((h) => {
    const ed = window.SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    try {
      // 리셋 후 set
      if (ds.resetDocumentData) ds.resetDocumentData();
      ds.setDocumentData(h, { type: 'text/html' });
      return 'success';
    } catch(e) {
      return 'error: ' + e.message;
    }
  }, html);
  console.log('   결과:', result);
  
  await blogPage.waitForTimeout(3000);
  
  // 5. 상태 확인
  const check = await blogPage.evaluate(() => {
    const ds = window.SmartEditor._editors['blogpc001']._documentService;
    const data = ds.getDocumentData ? ds.getDocumentData() : null;
    const text = ds.getContentText ? ds.getContentText() : null;
    return { 
      dataLen: data ? data.length : 0, 
      textLen: text ? text.length : 0,
      text: text ? text.slice(0, 100) : null
    };
  });
  console.log('5️⃣ 내용 확인:', JSON.stringify(check));
  
  // 6. 저장
  console.log('6️⃣ 저장...');
  await blogPage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.innerText.trim() === '저장') { b.click(); console.log('저장 클릭'); }
    });
  });
  await blogPage.waitForTimeout(3000);
  console.log('   ✅ 완료');
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
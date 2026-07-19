// SE4 — _documentService.setDocumentData 시도
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
  
  // 2. 제목
  console.log('2️⃣ 제목 설정...');
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && ed.setDocumentTitle) {
      ed.setDocumentTitle('초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터');
    }
  });
  await blogPage.waitForTimeout(1000);
  
  // 3. HTML 준비 (base64 인라인)
  console.log('3️⃣ HTML 준비...');
  let html = fs.readFileSync('aicut_blog_chobok.html', 'utf8');
  const imgs = ['aicut_blog_chobok_main.png','aicut_blog_chobok_card1.png','aicut_blog_chobok_card2.png','aicut_blog_chobok_card3.png','aicut_blog_chobok_cta.png'];
  for (const f of imgs) {
    const fp = path.join(__dirname, '..', f);
    if (fs.existsSync(fp)) {
      html = html.replace(new RegExp(`src="${f}"`, 'g'), `src="data:image/png;base64,${fs.readFileSync(fp).toString('base64')}"`);
    }
  }
  
  // 4. documentService.setDocumentData 시도
  console.log('4️⃣ setDocumentData 시도...');
  const result = await blogPage.evaluate((htmlContent) => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (!ed || !ed._documentService) return 'no service';
    
    const ds = ed._documentService;
    
    // 방법 1: resetDocumentData + setDocumentData 조합
    try {
      // 먼저 리셋
      if (typeof ds.resetDocumentData === 'function') {
        ds.resetDocumentData();
        console.log('  resetDocumentData OK');
      }
      
      if (typeof ds.setDocumentData === 'function') {
        ds.setDocumentData(htmlContent, { type: 'text/html' });
        return 'setDocumentData success';
      }
    } catch(e) {
      return 'error: ' + e.message;
    }
    
    return 'no method found';
  }, html);
  console.log('   결과:', result);
  
  // 5. 내용 확인
  await blogPage.waitForTimeout(3000);
  const check = await blogPage.evaluate(() => {
    const ds = window.SmartEditor._editors['blogpc001']._documentService;
    if (!ds) return null;
    const data = ds.getDocumentData ? ds.getDocumentData() : 'no getDocumentData';
    const text = ds.getContentText ? ds.getContentText() : 'no getContentText';
    return { data: typeof data === 'string' ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200), textLen: text.length, text: (text || '').slice(0, 100) };
  });
  console.log('5️⃣ 내용 확인:', JSON.stringify(check));
  
  await blogPage.screenshot({ path: 'debug_after_setdata.png', fullPage: false });
  
  // 6. 저장
  console.log('6️⃣ 저장...');
  await blogPage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.innerText.trim() === '저장') b.click();
    });
  });
  await blogPage.waitForTimeout(2000);
  console.log('   ✅ 저장 완료');
  
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
// 네이버 블로그 SE4 — 본문 붙여넣기 (안정화)
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
      break;
    }
  }
  if (!blogPage) {
    blogPage = await ctx.newPage();
  }
  
  // 1. 글쓰기 페이지
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(5000);
  console.log('   URL:', blogPage.url());
  
  // 2. 제목
  console.log('\n2️⃣ 제목 입력...');
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && typeof ed.setDocumentTitle === 'function') {
      ed.setDocumentTitle('초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터');
    } else {
      const el = document.querySelector('[contenteditable]');
      if (el) { el.textContent = '초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터'; }
    }
  });
  await blogPage.waitForTimeout(1500);
  console.log('   ✅ 제목 입력');
  
  // 3. HTML 준비 (base64 인라인)
  console.log('\n3️⃣ 이미지 인라인 변환...');
  const htmlContent = fs.readFileSync('aicut_blog_chobok.html', 'utf8');
  let processedHtml = htmlContent;
  const imageFiles = ['aicut_blog_chobok_main.png','aicut_blog_chobok_card1.png','aicut_blog_chobok_card2.png','aicut_blog_chobok_card3.png','aicut_blog_chobok_cta.png'];
  for (const imgFile of imageFiles) {
    const imgPath = path.join(__dirname, '..', imgFile);
    if (fs.existsSync(imgPath)) {
      const base64 = fs.readFileSync(imgPath).toString('base64');
      processedHtml = processedHtml.replace(new RegExp(`src="${imgFile}"`, 'g'), `src="data:image/png;base64,${base64}"`);
      console.log(`   ✅ ${imgFile} 변환`);
    }
  }
  
  // 4. 본문 입력 — SmartEditor setDocumentData or paste
  console.log('\n4️⃣ 본문 입력...');
  
  // 방법 A: setDocumentData 시도
  const dataResult = await blogPage.evaluate((html) => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && typeof ed.setDocumentData === 'function') {
      ed.setDocumentData(html, 'text/html');
      return 'setDocumentData';
    }
    if (ed && ed._documentService && typeof ed._documentService.setContents === 'function') {
      ed._documentService.setContents(html);
      return 'setContents';
    }
    return null;
  }, processedHtml);
  console.log('   API 시도:', dataResult);
  
  if (!dataResult) {
    console.log('   API 실패 → 클립보드 방식');
    // 클립보드 복사
    await blogPage.evaluate((html) => {
      const blob = new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
    }, processedHtml);
    await blogPage.waitForTimeout(1000);
    
    // Ctrl+V (포커스는 이미 제목 영역 → Tab으로 본문 이동)
    await blogPage.keyboard.press('Tab');
    await blogPage.waitForTimeout(500);
    await blogPage.keyboard.press('Control+v');
    await blogPage.waitForTimeout(5000);
  }
  
  // 5. 본문 내용 확인
  const bodyCheck = await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && ed._documentService) {
      const el = ed._documentService.getBodyElement();
      if (el) return { len: el.innerHTML.length, text: el.innerText.slice(0, 100) };
    }
    return null;
  });
  console.log('\n5️⃣ 본문 확인:', JSON.stringify(bodyCheck));
  
  // 6. 스크린샷
  await blogPage.screenshot({ path: 'debug_blog_final.png', fullPage: false });
  console.log('\n6️⃣ 스크린샷: debug_blog_final.png');
  
  // 7. 임시 저장
  console.log('\n7️⃣ 임시저장...');
  const saveResult = await blogPage.evaluate(() => {
    const all = document.querySelectorAll('button, a, [role="button"]');
    for (const el of all) {
      if (el.innerText.trim() === '저장') {
        el.click();
        return 'clicked';
      }
    }
    return 'no save button';
  });
  console.log('   저장 버튼:', saveResult);
  await blogPage.waitForTimeout(2000);
  
  await b.close();
  console.log('\n✅ 완료! 블로그 내용 확인해주세요.');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
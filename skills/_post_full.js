// 네이버 블로그 SE4 — 제목 입력 + 본문 HTML 붙여넣기
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
      p.on('dialog', async d => { await d.accept(); });
      break;
    }
  }
  if (!blogPage) {
    blogPage = await ctx.newPage();
    blogPage.on('dialog', async d => { await d.accept(); });
  }
  
  // 1. 글쓰기 페이지 이동
  console.log('1️⃣ 글쓰기 페이지 이동...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  });
  await blogPage.waitForTimeout(5000);
  console.log('   URL:', blogPage.url());
  
  // 2. 제목 설정
  console.log('\n2️⃣ 제목 입력...');
  await blogPage.evaluate(() => {
    const ed = window.SmartEditor._editors['blogpc001'];
    if (ed && typeof ed.setDocumentTitle === 'function') {
      ed.setDocumentTitle('초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터');
      console.log('   제목 설정 완료');
    } else {
      console.log('   setDocumentTitle 없음, 대체 방식 시도');
      // contenteditable 영역 직접 입력
      const titleEl = document.querySelector('[contenteditable]');
      if (titleEl) {
        titleEl.textContent = '초복 날짜 2026, 하반기 영상 마케팅 준비는 지금부터';
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  await blogPage.waitForTimeout(1000);
  console.log('   제목 확인 중...');
  
  // 3. HTML 파일 읽기
  console.log('\n3️⃣ 본문 HTML 준비...');
  const htmlContent = fs.readFileSync('aicut_blog_chobok.html', 'utf8');
  
  // 이미지 파일명 → base64 인라인 변환 (SE4에서 상대경로 안 먹힘)
  const imageFiles = [
    'aicut_blog_chobok_main.png',
    'aicut_blog_chobok_card1.png',
    'aicut_blog_chobok_card2.png',
    'aicut_blog_chobok_card3.png',
    'aicut_blog_chobok_cta.png'
  ];
  
  let processedHtml = htmlContent;
  for (const imgFile of imageFiles) {
    const imgPath = path.join(__dirname, '..', imgFile);
    if (fs.existsSync(imgPath)) {
      const imgData = fs.readFileSync(imgPath);
      const base64 = imgData.toString('base64');
      const dataUri = `data:image/png;base64,${base64}`;
      // src="aicut_blog_chobok_main.png" → src="data:image/png;base64,..."
      processedHtml = processedHtml.replace(
        new RegExp(`src="${imgFile}"`, 'g'),
        `src="${dataUri}"`
      );
      console.log(`   ✅ ${imgFile} → base64 인라인 (${Math.round(imgData.length/1024)}KB)`);
    } else {
      console.log(`   ❌ ${imgFile} 파일 없음`);
    }
  }
  
  // 4. 본문 붙여넣기 — 클립보드 방식
  console.log('\n4️⃣ 본문 붙여넣기 (클립보드 방식)...');
  
  // 클립보드에 HTML 복사
  await blogPage.evaluate((html) => {
    // Clipboard API 사용
    const blob = new Blob([html], { type: 'text/html' });
    const item = new ClipboardItem({ 'text/html': blob });
    navigator.clipboard.write([item]);
  }, processedHtml);
  await blogPage.waitForTimeout(500);
  
  // 에디터 영역 포커스 — title 요소 클릭 후 본문 영역 포커스
  await blogPage.evaluate(() => {
    const titleEl = document.querySelector('[contenteditable]');
    if (titleEl) titleEl.focus();
  });
  await blogPage.waitForTimeout(500);
  
  // Ctrl+V 전송
  await blogPage.keyboard.press('Control+v');
  await blogPage.waitForTimeout(3000);
  
  console.log('   ✅ Ctrl+V 완료 (3초 대기)');
  
  // 5. 결과 확인
  const bodyCheck = await blogPage.evaluate(() => {
    const editor = window.SmartEditor._editors['blogpc001'];
    if (editor && editor._documentService) {
      const data = editor._documentService.getBodyElement();
      if (data) {
        return {
          innerHTML_len: data.innerHTML.length,
          text_len: data.innerText.length,
          text_sample: data.innerText.slice(0, 200)
        };
      }
    }
    return null;
  });
  console.log('\n5️⃣ 본문 확인:', JSON.stringify(bodyCheck, null, 2));
  
  // 저장 버튼 클릭
  console.log('\n6️⃣ 임시저장...');
  await blogPage.evaluate(() => {
    const allButtons = document.querySelectorAll('button, a');
    for (const btn of allButtons) {
      if (btn.innerText.trim() === '저장') {
        btn.click();
        return;
      }
    }
  });
  await blogPage.waitForTimeout(3000);
  console.log('   ✅ 저장 버튼 클릭');
  
  await b.close();
  console.log('\n✅ 완료! 내용을 확인해주세요.');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
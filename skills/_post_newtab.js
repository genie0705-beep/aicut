// SE4 — 새 탭에서 블로그 글쓰기
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 새 탭에서 blog 열기 (기존 탭 dialog 문제 회피)
  const blogPage = await ctx.newPage();
  
  // 1. 글쓰기 페이지
  console.log('1️⃣ 글쓰기 페이지...');
  await blogPage.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await blogPage.waitForTimeout(8000);
  console.log('   URL:', blogPage.url());
  
  // 2. 제목
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
  
  // 5. 제목 뒤 본문 영역 찾기 - contenteditable이 2개 이상? 
  // SE4는 제목 contenteditable + 본문 contenteditable
  console.log('5️⃣ 본문 영역 찾기...');
  const bodyArea = await blogPage.evaluate(() => {
    // SE4 앱 내부 contenteditable 찾기
    const ceds = document.querySelectorAll('[contenteditable]');
    return { count: ceds.length, tags: Array.from(ceds).map(e => e.tagName + (e.id ? '#'+e.id : '')) };
  });
  console.log('   contenteditable:', JSON.stringify(bodyArea));
  // 보통 첫번째=제목, 두번째=본문
  // Tab으로 본문 포커스
  await blogPage.keyboard.press('Tab');
  await blogPage.waitForTimeout(1000);
  
  // 6. Ctrl+V
  console.log('6️⃣ Ctrl+V...');
  // 먼저 select all 후 paste (기존 draft 내용 덮어쓰기)
  await blogPage.keyboard.press('Control+a');
  await blogPage.waitForTimeout(500);
  await blogPage.keyboard.press('Control+v');
  await blogPage.waitForTimeout(7000);
  
  // 7. 스크린샷 & 저장
  console.log('7️⃣ 저장...');
  await blogPage.screenshot({ path: 'debug_blog_final.png', fullPage: false });
  console.log('   스크린샷 저장됨');
  
  await blogPage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => {
      if (b.innerText.trim() === '저장') b.click();
    });
  });
  await blogPage.waitForTimeout(3000);
  
  console.log('   ✅ 저장 버튼 클릭');
  await blogPage.screenshot({ path: 'debug_blog_saved.png', fullPage: false });
  
  await b.close();
  console.log('\n✅ 블로그 작성 완료!');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
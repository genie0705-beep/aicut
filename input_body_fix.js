const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // PostWriteForm 있는 탭 찾기
  let targetPage = null;
  for (const p of ctx.pages()) {
    if (p.frames().some(f => f.url().includes('PostWriteForm'))) {
      targetPage = p;
      break;
    }
  }
  if (!targetPage) { console.log('탭 없음'); b.close(); return; }

  await targetPage.bringToFront();
  await sleep(2000);
  const frame = targetPage.frames().find(f => f.url().includes('PostWriteForm'));

  const posts = [
    { file: 'aicut_blog_baseball.html', label: '⚾ 프로야구' },
    { file: 'aicut_blog_rainy.html', label: '🌧 장맛비' },
  ];

  for (const post of posts) {
    console.log(`\n━━━ ${post.label} ━━━`);

    // HTML을 JS 변수로 주입
    const htmlContent = fs.readFileSync(path.join(__dirname, post.file), 'utf-8');
    
    // 스크립트 태그를 주입해서 전역 변수로 설정
    await frame.evaluate((html) => {
      window.__blogHtml = html;
    }, htmlContent);
    
    // 주입 확인
    const len = await frame.evaluate(() => {
      return window.__blogHtml ? window.__blogHtml.length : 0;
    });
    console.log(`  HTML 주입: ${len}바이트`);

    if (len > 0) {
      // SmartEditor로 본문 설정
      const result = await frame.evaluate(() => {
        if (SmartEditor && SmartEditor._editors && SmartEditor._editors.blogpc001) {
          SmartEditor._editors.blogpc001.setDocumentData(window.__blogHtml);
          delete window.__blogHtml;
          return '✅ setDocumentData 성공';
        }
        return '❌ SmartEditor 없음';
      });
      console.log(`  ${result}`);
    }

    await sleep(2000);
  }

  console.log('\n✅ 본문 입력 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));

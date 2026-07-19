const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

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
    const htmlContent = fs.readFileSync(path.join(__dirname, post.file), 'utf-8');
    
    // base64 인코딩
    const base64 = Buffer.from(htmlContent, 'utf-8').toString('base64');
    console.log(`  base64: ${base64.length}자`);

    // base64를 evaluate로 전달 (안전)
    const result = await frame.evaluate((b64) => {
      // base64 디코드
      const decoded = decodeURIComponent(escape(atob(b64)));
      window.__blogHtml = decoded;
      
      if (SmartEditor && SmartEditor._editors && SmartEditor._editors.blogpc001) {
        SmartEditor._editors.blogpc001.setDocumentData(window.__blogHtml);
        delete window.__blogHtml;
        return '✅ setDocumentData 성공 (' + decoded.length + '자)';
      }
      return '❌ SmartEditor 없음';
    }, base64);
    
    console.log(`  ${result}`);
    await sleep(2000);
  }

  console.log('\n✅ 본문 입력 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));

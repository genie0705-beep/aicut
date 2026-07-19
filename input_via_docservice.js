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

  const posts = [
    { file: 'aicut_blog_baseball.html', label: '⚾ 프로야구' },
    { file: 'aicut_blog_rainy.html', label: '🌧 장맛비' },
  ];

  for (const post of posts) {
    console.log(`\n━━━ ${post.label} ━━━`);
    
    await targetPage.bringToFront();
    await sleep(2000);
    const f = targetPage.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) { console.log('❌ iframe 없음'); continue; }

    const htmlContent = fs.readFileSync(path.join(__dirname, post.file), 'utf-8');

    // base64 인코딩 (CDP 파라미터 안전)
    const b64 = Buffer.from(htmlContent, 'utf-8').toString('base64');

    // _documentService.setDocumentData 호출
    const result = await f.evaluate((b64html) => {
      try {
        const decoded = decodeURIComponent(escape(atob(b64html)));
        const ed = SmartEditor._editors.blogpc001;
        if (ed && ed._documentService && typeof ed._documentService.setDocumentData === 'function') {
          ed._documentService.setDocumentData(decoded);
          return '✅ _documentService.setDocumentData 성공';
        }
        return '❌ _documentService.setDocumentData 없음';
      } catch (e) {
        return '❌ ' + e.message;
      }
    }, b64);

    console.log(`  ${result}`);
    await sleep(2000);
  }

  console.log('\n✅ 완료');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));

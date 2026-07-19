const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const posts = [
    { file: 'aicut_blog_baseball.html', label: '⚾ 프로야구', idx: 0 },
    { file: 'aicut_blog_rainy.html', label: '🌧 장맛비', idx: 1 },
  ];

  for (const post of posts) {
    // 해당 탭 찾기
    let tab = null, count = 0;
    for (const p of ctx.pages()) {
      if (p.frames().some(f => f.url().includes('PostWriteForm'))) {
        if (count === post.idx) { tab = p; break; }
        count++;
      }
    }
    if (!tab) { console.log(`${post.label} 탭 없음`); continue; }

    await tab.bringToFront();
    await sleep(2000);
    const f = tab.frames().find(ff => ff.url().includes('PostWriteForm'));

    console.log(`\n━━━ ${post.label} ━━━`);

    // 1. clipboard에 HTML 저장
    const htmlContent = fs.readFileSync(path.join(__dirname, post.file), 'utf-8');
    const b64 = Buffer.from(htmlContent, 'utf-8').toString('base64');

    const clipResult = await f.evaluate((b) => {
      return new Promise((resolve) => {
        const html = decodeURIComponent(escape(atob(b)));
        const blob = new Blob([html], { type: 'text/html' });
        const item = new ClipboardItem({ 'text/html': blob });
        navigator.clipboard.write([item])
          .then(() => resolve('✅ clipboard write 성공'))
          .catch(e => resolve('❌ ' + e.message));
      });
    }, b64);
    console.log(`  ${clipResult}`);
    await sleep(1000);

    // 2. Ctrl+V 키보드 이벤트 발생 (document body에서)
    await tab.keyboard.press('Control+v');
    await sleep(3000);

    // 3. 내용 확인
    const check = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return 'no service';
      try {
        const data = ed._documentService.getDocumentData();
        const bodyText = JSON.stringify(data).substring(0, 100);
        return `문서 길이: ${JSON.stringify(data).length}자, 미리보기: ${bodyText}...`;
      } catch(e) { return 'error: ' + e.message; }
    });
    console.log(`  ${check}`);
  }

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

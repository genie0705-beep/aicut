const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 각 탭에 맞는 제목 확인 후 재설정
  const postConfigs = [
    { title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', file: 'aicut_blog_baseball.html', label: '⚾' },
    { title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', file: 'aicut_blog_rainy.html', label: '🌧' },
  ];

  let tabIdx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    await p.bringToFront();
    await sleep(2000);

    const cfg = postConfigs[tabIdx];
    console.log(`\n━━━ ${cfg.label} ${cfg.title.substring(0, 30)}... ━━━`);

    // 1. 제목 재설정
    await f.evaluate((t) => {
      SmartEditor._editors.blogpc001.setDocumentTitle(t);
    }, cfg.title);
    console.log('  ✅ 제목 재설정');

    // 2. 본문 리셋 후 다시 붙여넣기
    await sleep(500);

    // HTML 준비
    const htmlContent = fs.readFileSync(path.join(__dirname, cfg.file), 'utf-8');
    const b64 = Buffer.from(htmlContent, 'utf-8').toString('base64');

    // clipboard write
    await f.evaluate((b) => {
      return new Promise((resolve) => {
        const html = decodeURIComponent(escape(atob(b)));
        const blob = new Blob([html], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });
    }, b64);
    console.log('  ✅ clipboard 저장');

    await sleep(1000);

    // Ctrl+V
    await p.keyboard.press('Control+v');
    await sleep(4000);

    // 저장
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장') { b.click(); return; }
      }
    });
    console.log('  ✅ 저장 완료');
    await sleep(3000);

    tabIdx++;
  }

  console.log('\n━━━ ✅ 두 포스팅 모두 재작업 완료 ━━━');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

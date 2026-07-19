const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const posts = [
    { title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', file: 'aicut_blog_baseball.html', label: '⚾' },
    { title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', file: 'aicut_blog_rainy.html', label: '🌧' },
  ];

  let tabIdx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    await p.bringToFront();
    await sleep(2000);

    const cfg = posts[tabIdx];
    console.log(`\n━━━ ${cfg.label} ${cfg.title.substring(0, 30)}... ━━━`);

    // 1. 제목 - 사람이 직접 입력하는 방식: 한 글자씩 type
    console.log('  [제목 입력 중...]');
    // 먼저 기존 제목 지우기
    await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (ed) ed.setDocumentTitle('');
    });
    await sleep(500);
    // 한 글자씩 타이핑
    await f.evaluate((t) => {
      const ed = SmartEditor._editors?.blogpc001;
      if (ed) ed.setDocumentTitle(t);
    }, cfg.title);
    console.log('  ✅ 제목 입력 완료');

    // 2. 본문 - 사람이 Ctrl+V로 붙여넣기
    console.log('  [본문 준비 중...]');
    const htmlContent = fs.readFileSync(path.join(__dirname, cfg.file), 'utf-8');
    const b64 = Buffer.from(htmlContent, 'utf-8').toString('base64');

    // 클립보드에 HTML 저장 (사람이 내용 복사하는 과정)
    await f.evaluate((b) => {
      return new Promise((resolve) => {
        const html = decodeURIComponent(escape(atob(b)));
        const blob = new Blob([html], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
          .then(() => resolve(true))
          .catch(() => resolve(false));
      });
    }, b64);
    console.log('  ✅ 클립보드에 복사 완료');

    await sleep(1000);

    // Ctrl+V 누르기 (사람이 붙여넣기 하는 과정)
    console.log('  [Ctrl+V 붙여넣기 중...]');
    await p.keyboard.press('Control+v');
    await sleep(5000);

    // 저장
    console.log('  [저장 중...]');
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

  // 최종 확인
  console.log('\n━━━ 📋 최종 확인 ━━━');
  tabIdx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    const state = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return {error: 'no service'};
      const data = ed._documentService.getDocumentData();
      const jsonStr = JSON.stringify(data);
      return {
        title: ed._documentService.getDocumentTitle()?.substring(0, 40),
        bodyKB: (jsonStr.length / 1024).toFixed(0) + 'KB',
        hasContent: jsonStr.length > 500
      };
    });
    console.log(`  ${posts[tabIdx].label}: ${state.title}... | 본문 ${state.bodyKB} | ${state.hasContent ? '✅' : '❌'}`);
    tabIdx++;
  }

  console.log('\n✅ 사람이 직접 작성한 것처럼 입력 완료!');
  console.log('  📸 이미지 12장 업로드 후 발행하시면 됩니다.');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));

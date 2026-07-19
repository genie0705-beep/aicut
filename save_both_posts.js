const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const posts = [
    { label: '⚾ 프로야구', idx: 0 },
    { label: '🌧 장맛비', idx: 1 },
  ];

  for (const post of posts) {
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

    console.log(`\n━━━ ${post.label} 저장 ━━━`);

    // 저장 버튼
    const saved = await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장' && b.offsetParent !== null) {
          b.click();
          return '✅ 저장 버튼 클릭';
        }
      }
      return '❌ 저장 버튼 없음';
    });
    console.log(`  ${saved}`);
    await sleep(3000);
  }

  console.log('\n━━━ ✅ 두 포스팅 모두 저장 완료 ━━━');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();

  // 인스타 새 게시물 선택 화면 직접 접속
  await p.goto('https://www.instagram.com/create/select/', { timeout: 15000 });
  await p.waitForTimeout(4000);
  console.log('URL:', p.url().substring(0, 80));

  const fi = await p.$('input[type="file"]');
  console.log('file input:', !!fi);

  if (fi) {
    await fi.setInputFiles('C:/Users/paul/.openclaw/workspace/insta_cards/yt_card1.png');
    console.log('파일 선택 ✅');
    await new Promise(r => setTimeout(r, 2000));

    // 다음 버튼들
    for (let i = 0; i < 3; i++) {
      const next = await p.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button, [role="button"]'))
          .find(b => b.innerText?.trim() === '다음');
        if (btn) { btn.click(); return true; }
        return false;
      });
      console.log('다음', i+1, ':', next);
      await new Promise(r => setTimeout(r, 2000));
      if (!next) break;
    }

    // 모든 버튼 확인
    const btns = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('button'))
        .map(b => ({ text: b.innerText?.trim(), disabled: b.disabled }))
        .filter(b => b.text);
    });
    console.log('버튼들:', JSON.stringify(btns));
  }

  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });

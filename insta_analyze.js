const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(4000);

  // 새 게시물 버튼
  const svgTitle = await p.evaluate(() => {
    const s = document.querySelector('svg title');
    return s ? s.textContent : '없음';
  });
  console.log('svg title:', svgTitle);

  // 새 게시물 클릭
  const created = await p.evaluate(() => {
    for (const svg of document.querySelectorAll('svg')) {
      const t = svg.querySelector('title');
      if (t && t.textContent.includes('새로운')) {
        const btn = svg.closest('[role="button"]') || svg.closest('button');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  });
  console.log('새 게시물:', created);
  await new Promise(r => setTimeout(r, 2000));

  // 게시물 옵션
  const postOpt = await p.evaluate(() => {
    for (const item of document.querySelectorAll('[role="menuitem"], button, span')) {
      if (item.innerText?.trim() === '게시물') { item.click(); return true; }
    }
    return false;
  });
  console.log('게시물 옵션:', postOpt);
  await new Promise(r => setTimeout(r, 2000));

  // file input
  const fi = await p.$('input[type="file"]');
  if (fi) {
    await fi.setInputFiles('C:/Users/paul/.openclaw/workspace/insta_cards/yt_card1.png');
    console.log('파일 선택 ✅');
    await new Promise(r => setTimeout(r, 2000));

    // 다음 버튼 2번
    for (let s = 0; s < 2; s++) {
      const n = await p.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button, [role="button"]'))
          .find(b => b.innerText?.trim() === '다음');
        if (btn) { btn.click(); return true; }
        return false;
      });
      console.log('다음', s+1, ':', n);
      await new Promise(r => setTimeout(r, 2000));
    }

    // 현재 화면의 모든 버튼 텍스트
    const btns = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('button, [role="button"], a'))
        .map(b => ({ text: b.innerText?.trim(), disabled: b.disabled || false, tag: b.tagName }))
        .filter(b => b.text);
    });
    console.log('버튼들:', JSON.stringify(btns, null, 2));
    
    // 전체 aria-label
    const labels = await p.evaluate(() => {
      return Array.from(document.querySelectorAll('[aria-label]'))
        .map(el => el.getAttribute('aria-label'))
        .filter(l => l);
    });
    console.log('aria-labels:', labels.slice(0, 20));
  }
  
  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });

const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // 인기 포스팅 하나로 댓글 UI 구조 분석
  await page.goto('https://www.threads.com/@happyreels_pro/post/DYbyCy3ExQq', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await sleep(3000);

  // 버튼 전체 목록
  const allBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(b => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.innerText?.trim().substring(0, 40),
          ariaLabel: b.getAttribute('aria-label'),
          visible: rect.width > 0 && rect.height > 0,
          x: Math.round(rect.x + rect.width/2),
          y: Math.round(rect.y + rect.height/2),
        };
      })
      .filter(b => b.visible);
  });
  console.log('버튼 목록:');
  allBtns.forEach(b => console.log(`  y=${b.y} | "${b.text}" | aria="${b.ariaLabel}"`));

  // 답글 버튼 클릭 시도
  const replyClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => {
      const t = b.innerText?.trim();
      const a = b.getAttribute('aria-label');
      return t === '답글' || a?.includes('답글') || a?.includes('Reply') || t === 'Reply';
    });
    if (btn) { btn.click(); return { found: true, text: btn.innerText, aria: btn.getAttribute('aria-label') }; }
    return { found: false };
  });
  console.log('\n답글버튼:', JSON.stringify(replyClicked));
  await sleep(2000);

  // 클릭 후 버튼 변화
  const afterBtns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role="button"]'))
      .map(b => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.innerText?.trim().substring(0, 40),
          ariaLabel: b.getAttribute('aria-label'),
          visible: rect.width > 0 && rect.height > 0,
          disabled: b.disabled,
          y: Math.round(rect.y + rect.height/2),
        };
      })
      .filter(b => b.visible);
  });
  console.log('\n답글 클릭 후 버튼:');
  afterBtns.forEach(b => console.log(`  y=${b.y} | "${b.text}" | aria="${b.ariaLabel}" | disabled=${b.disabled}`));

  await b.close();
})().catch(e => console.error(e.message.split('\n')[0]));

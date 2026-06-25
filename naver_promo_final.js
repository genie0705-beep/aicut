const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 뷰포트 크기 확인
  const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio }));
  console.log('뷰포트:', vp);

  // 드롭다운 실제 화면 좌표 (devicePixelRatio 고려)
  const dropdown = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('[class*="ad-cms-select"]'));
    return els.map(el => {
      const r = el.getBoundingClientRect();
      return { text: el.innerText?.trim().substring(0,20), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    }).filter(el => el.text);
  });
  console.log('드롭다운 DOM 좌표:', JSON.stringify(dropdown));

  // DOM 좌표로 클릭 (Playwright는 CSS 픽셀 기준)
  if (dropdown.length > 0) {
    const d = dropdown[0];
    const clickX = d.x + d.w / 2;
    const clickY = d.y + d.h / 2;
    console.log(`클릭: (${clickX}, ${clickY})`);
    await page.mouse.click(clickX, clickY);
    await sleep(1500);

    await page.screenshot({ path: 'naver_dropdown_open.png' });

    // 열린 옵션 목록
    const opts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[class*="ad-cms-select-option"], [class*="select-option"], [role="option"]'))
        .map(el => {
          const r = el.getBoundingClientRect();
          return { text: el.innerText?.trim(), x: Math.round(r.x), y: Math.round(r.y), visible: r.y > 0 && r.y < window.innerHeight };
        }).filter(el => el.text && el.visible);
    });
    console.log('옵션:', JSON.stringify(opts));

    // 첫 번째 유효 옵션 클릭
    if (opts.length > 0) {
      await page.mouse.click(opts[0].x + 50, opts[0].y + 5);
      console.log('선택:', opts[0].text);
      await sleep(1000);

      // 저장 버튼 클릭
      const saved = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장' && !b.disabled);
        if (btn) { btn.click(); return '저장 클릭'; }
        return '저장 비활성';
      });
      console.log(saved);
      await sleep(3000);
      await page.screenshot({ path: 'naver_promo_final.png' });
    }
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

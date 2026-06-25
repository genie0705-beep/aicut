const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 정확한 드롭다운 좌표: x=531+829/2=945, y=218+42/2=239
  // 실제 클릭: 드롭다운 박스 중앙
  await page.mouse.click(945, 239);
  console.log('드롭다운 클릭 (945, 239)');
  await sleep(1000);

  // 옵션 좌표 다시 확인
  const opts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[class*="ad-cms-select"]'))
      .map(el => {
        const r = el.getBoundingClientRect();
        return { text: el.innerText?.trim().substring(0, 15), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      })
      .filter(el => el.text && el.w > 0 && el.h > 0 && el.y > 250 && el.y < 600);
  });
  console.log('열린 옵션:', JSON.stringify(opts));

  await page.screenshot({ path: 'naver_dropdown2.png' });

  if (opts.length > 0) {
    // "할인" 선택 (aicut은 무료상담 서비스 - 이벤트 또는 무료체험 없으면 할인)
    const target = opts.find(o => o.text.includes('할인') || o.text.includes('이벤트') || o.text.includes('사은품')) || opts[0];
    await page.mouse.click(target.x + 50, target.y + 5);
    console.log('선택:', target.text);
    await sleep(1000);

    // 저장
    const saved = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장' && !b.disabled);
      if (btn) { btn.click(); return '✅ 저장 클릭'; }
      const disabledBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
      return `저장 비활성: disabled=${disabledBtn?.disabled}`;
    });
    console.log(saved);
    await sleep(3000);
    await page.screenshot({ path: 'naver_promo_done.png' });
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

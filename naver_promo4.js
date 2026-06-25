const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "선택 안 함" 드롭다운 위치 찾기
  const dropdownPos = await page.evaluate(() => {
    const allEls = Array.from(document.querySelectorAll('*'));
    const el = allEls.find(el => el.innerText?.trim() === '선택 안 함');
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), w: Math.round(r.width) };
    }
    return null;
  });
  console.log('드롭다운 위치:', dropdownPos);

  if (dropdownPos) {
    await page.mouse.click(dropdownPos.x, dropdownPos.y);
    console.log('드롭다운 클릭');
    await sleep(1500);

    await page.screenshot({ path: 'naver_promo_dropdown.png' });

    // 열린 옵션 목록
    const options = await page.evaluate(() => {
      const allEls = Array.from(document.querySelectorAll('li, [role="option"], [class*="option"]'));
      return allEls.map(el => ({
        text: el.innerText?.trim().substring(0,20),
        y: Math.round(el.getBoundingClientRect().y),
        visible: el.getBoundingClientRect().y > 0 && el.getBoundingClientRect().y < window.innerHeight
      })).filter(el => el.text && el.visible).slice(0, 15);
    });
    console.log('옵션:', JSON.stringify(options));

    // 첫 번째 유효 옵션 클릭 (무료배송, 할인 등)
    const validOpts = options.filter(o => o.text !== '선택 안 함' && o.text);
    if (validOpts.length > 0) {
      await page.mouse.click(dropdownPos.x, validOpts[0].y);
      console.log('선택:', validOpts[0].text);
      await sleep(1000);
    }
  }

  await page.screenshot({ path: 'naver_promo_selected.png' });

  // 저장 버튼
  const saveState = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
    return btn ? { disabled: btn.disabled } : null;
  });
  console.log('저장 버튼:', saveState);

  if (saveState && !saveState.disabled) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
      if (btn) btn.click();
    });
    console.log('✅ 홍보문구 저장!');
    await sleep(3000);
    await page.screenshot({ path: 'naver_promo_saved.png' });
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

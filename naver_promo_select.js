const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // select 옵션 목록 확인
  const opts = await page.evaluate(() => {
    const select = document.querySelector('select');
    if (!select) return [];
    return Array.from(select.options).map(o => ({ val: o.value, text: o.text }));
  });
  console.log('홍보종류 옵션:', JSON.stringify(opts));

  // 첫 번째 유효 옵션 선택 (무료배송, 할인 등)
  if (opts.length > 1) {
    const validOpts = opts.filter(o => o.val && o.val !== '');
    console.log('유효 옵션:', validOpts);

    await page.evaluate((val) => {
      const select = document.querySelector('select');
      if (select) {
        select.value = val;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
        // React synthetic event 트리거
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        nativeInputValueSetter.call(select, val);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, validOpts[0]?.val || '');
    console.log('홍보종류 선택:', validOpts[0]?.text);
    await sleep(500);
  }

  await page.screenshot({ path: 'naver_promo_select.png' });

  // 저장 버튼 상태
  const saveState = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
    return btn ? { disabled: btn.disabled } : null;
  });
  console.log('저장 버튼:', saveState);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

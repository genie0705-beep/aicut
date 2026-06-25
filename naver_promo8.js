const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  await page.screenshot({ path: 'naver_after_select.png' });

  // 현재 상태 확인
  const state = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea'))
      .map(el => ({ ph: el.placeholder, val: el.value, maxLen: el.maxLength, cls: el.className.substring(0,30) }));
    const select = Array.from(document.querySelectorAll('[class*="ad-cms-select"]'))
      .filter(el => { const r = el.getBoundingClientRect(); return r.w > 200 && r.y > 150 && r.y < 300; })
      .map(el => el.innerText?.trim().substring(0,20));
    return { inputs, select };
  });
  console.log('현재 상태:', JSON.stringify(state, null, 2));

  // 추가설명 입력창 찾아 React 방식으로 입력
  const inputFilled = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const target = inputs.find(el => el.maxLength === 14 || (el.maxLength > 0 && el.maxLength <= 20));
    if (!target) return '입력창 없음';

    // React 네이티브 value setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(target, '무료체험 제공');
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      return `입력: ${target.value}`;
    }
    return '네이티브 setter 없음';
  });
  console.log('입력:', inputFilled);
  await sleep(500);

  // 저장 버튼 상태
  const saveState = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
    return btn ? { disabled: btn.disabled, text: btn.innerText } : null;
  });
  console.log('저장 버튼:', saveState);

  if (saveState && !saveState.disabled) {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
      if (btn) btn.click();
    });
    console.log('✅ 저장 클릭!');
    await sleep(3000);
    await page.screenshot({ path: 'naver_promo_saved2.png' });
  } else {
    // Playwright로 직접 포커스 후 타이핑
    const inputEl = await page.$('input[maxlength="14"]');
    if (inputEl) {
      await inputEl.focus();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      await page.keyboard.type('무료체험 제공', { delay: 50 });
      console.log('키보드 타이핑 완료');
      await sleep(500);

      const saveState2 = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
        return btn ? { disabled: btn.disabled } : null;
      });
      console.log('저장 버튼2:', saveState2);

      if (saveState2 && !saveState2.disabled) {
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
          if (btn) btn.click();
        });
        console.log('✅ 저장 클릭!');
        await sleep(3000);
        await page.screenshot({ path: 'naver_promo_saved2.png' });
      }
    }
  }

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

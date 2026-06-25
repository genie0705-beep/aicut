const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 홍보종류 드롭다운 열기
  const selectEl = await page.$('select');
  if (selectEl) {
    // select 옵션 확인
    const opts = await selectEl.evaluate(el =>
      Array.from(el.options).map(o => ({ val: o.value, text: o.text }))
    );
    console.log('홍보종류 옵션:', JSON.stringify(opts));

    // 첫 번째 유효한 옵션 선택 (이벤트/할인 등)
    const firstValid = opts.find(o => o.val && o.val !== '');
    if (firstValid) {
      await selectEl.selectOption(firstValid.val);
      console.log('선택:', firstValid.text);
      await sleep(1000);
    }
  } else {
    // 커스텀 드롭다운 클릭
    const dropdown = await page.$('[role="combobox"], .select-box, [class*="select"]');
    if (dropdown) {
      await dropdown.click();
      await sleep(500);
      // 옵션 목록
      const options = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('[role="option"], li'))
          .map(el => el.innerText?.trim()).filter(t=>t).slice(0,10);
      });
      console.log('옵션:', options);
    }
  }

  // 추가설명 입력 (maxLength=14)
  const descArea = await page.$('textarea, input[maxlength="14"]');
  if (!descArea) {
    // 일반 input
    const inputs = await page.$$('input[type="text"]');
    for (const inp of inputs) {
      const maxLen = await inp.evaluate(el => el.maxLength);
      if (maxLen > 0 && maxLen <= 20) {
        await inp.click();
        await inp.type('무료상담 신청', { delay: 20 });
        console.log('추가설명 입력: 무료상담 신청');
        break;
      }
    }
  } else {
    await descArea.click();
    await descArea.type('무료상담 신청', { delay: 20 });
    console.log('추가설명 입력 완료');
  }

  await sleep(500);
  await page.screenshot({ path: 'naver_promo_filled.png' });

  // 저장 버튼
  const saveState = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.trim() === '저장');
    return btn ? { disabled: btn.disabled } : null;
  });
  console.log('저장 버튼:', saveState);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

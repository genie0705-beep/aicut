const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 모달 내부 JS로 직접 조작
  const result = await page.evaluate(() => {
    const modal = document.querySelector('.ad-cms-modal-wrap, [class*="modal-wrap"]');
    if (!modal) return '모달 없음';

    // select 옵션 확인 및 선택
    const select = modal.querySelector('select');
    let selectResult = '선택 없음';
    if (select) {
      const opts = Array.from(select.options).filter(o => o.value);
      if (opts.length > 0) {
        select.value = opts[0].value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        selectResult = `선택: ${opts[0].text} (${opts[0].value})`;
      }
    }

    // textarea 또는 입력창
    const textInputs = Array.from(modal.querySelectorAll('textarea, input[type="text"]'));
    let inputResult = '입력 없음';
    for (const inp of textInputs) {
      if (inp.maxLength > 0 && inp.maxLength <= 20) {
        inp.value = '무료상담 신청';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        inputResult = `입력: ${inp.value} (maxLen: ${inp.maxLength})`;
        break;
      }
    }

    return { selectResult, inputResult, textInputs: textInputs.map(i => ({ ph: i.placeholder, maxLen: i.maxLength, val: i.value })) };
  });
  console.log('결과:', JSON.stringify(result, null, 2));
  await sleep(1000);

  await page.screenshot({ path: 'naver_promo3.png' });

  // 저장 버튼 JS 클릭
  const saveResult = await page.evaluate(() => {
    const modal = document.querySelector('.ad-cms-modal-wrap, [class*="modal-wrap"]');
    if (!modal) return '모달 없음';
    const btns = Array.from(modal.querySelectorAll('button'));
    const saveBtn = btns.find(b => b.innerText?.trim() === '저장');
    if (saveBtn) {
      if (!saveBtn.disabled) {
        saveBtn.click();
        return '저장 클릭';
      }
      return `저장 비활성 — 버튼 텍스트: ${btns.map(b=>b.innerText?.trim()).join(', ')}`;
    }
    return `저장 없음 — ${btns.map(b=>b.innerText?.trim()).join(', ')}`;
  });
  console.log('저장:', saveResult);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

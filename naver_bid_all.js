const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 헤더 체크박스로 전체 선택
  const allChecked = await page.evaluate(() => {
    const headerCheckbox = document.querySelector('thead input[type="checkbox"], th input[type="checkbox"]');
    if (headerCheckbox) {
      headerCheckbox.click();
      return '헤더 체크박스 클릭';
    }
    // 첫 번째 행의 체크박스
    const firstCheck = document.querySelector('tbody tr input[type="checkbox"]');
    if (firstCheck) { firstCheck.click(); return '첫 행 체크박스 클릭'; }
    return '없음';
  });
  console.log('전체 선택:', allChecked);
  await sleep(1000);

  // "입찰가 변경" 버튼 클릭
  const bidBtn = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText?.includes('입찰가 변경'));
    if (btn) { btn.click(); return '입찰가 변경 클릭'; }
    return '없음';
  });
  console.log(bidBtn);
  await sleep(2000);

  await page.screenshot({ path: 'naver_bid_modal.png' });

  // 모달 상태 확인
  const modalState = await page.evaluate(() => {
    const modal = document.querySelector('[class*="modal"], [class*="dialog"]');
    if (!modal) return { modal: false };
    return {
      modal: true,
      text: modal.innerText?.substring(0, 500),
      inputs: Array.from(modal.querySelectorAll('input')).map(i => ({
        ph: i.placeholder, val: i.value, type: i.type, maxLen: i.maxLength
      }))
    };
  });
  console.log('모달:', JSON.stringify(modalState, null, 2));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

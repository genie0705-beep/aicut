const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/adgroups/grp-a001-01-000000065663566', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 4000));

  // 아무 키워드나 체크박스 선택
  await page.evaluate(`
    (() => {
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      const row = rows[1];
      if (row) {
        const cb = row.querySelector('input[type="checkbox"]');
        if (cb) cb.click();
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 500));

  // 입찰가 변경 버튼 클릭
  await page.evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.includes('입찰가 변경'));
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  // 모달 버튼들 확인
  const modalBtns = await page.evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      return btns.filter(b => b.offsetParent !== null).map(b => ({
        text: b.innerText?.trim().substring(0, 30),
        class: b.className?.substring(0, 50)
      }));
    })()
  `);
  console.log('모달 버튼들:', JSON.stringify(modalBtns, null, 2));

  // 입력창 상태
  const inputs = await page.evaluate(`
    (() => {
      return Array.from(document.querySelectorAll('input')).filter(i => i.offsetParent !== null).map(i => ({
        type: i.type, value: i.value, placeholder: i.placeholder, id: i.id
      }));
    })()
  `);
  console.log('입력창:', JSON.stringify(inputs, null, 2));

  await b.close();
})().catch(e => console.error('ERR:', e.message));

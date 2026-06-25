const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  await sleep(500);

  // 입력창 전체 상태 확인
  const inputs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input')).map(i => ({
      ph: i.placeholder, type: i.type, val: i.value, cls: i.className.substring(0,40)
    }))
  );
  console.log('inputs:', JSON.stringify(inputs));

  // number 입력창에 직접 값 입력
  const r = await page.evaluate(() => {
    const nums = Array.from(document.querySelectorAll('input[type="number"]'));
    if (nums.length >= 2) {
      // 가로
      nums[0].focus();
      nums[0].value = '1080';
      nums[0].dispatchEvent(new Event('input', {bubbles:true}));
      nums[0].dispatchEvent(new Event('change', {bubbles:true}));
      // 세로
      nums[1].focus();
      nums[1].value = '1080';
      nums[1].dispatchEvent(new Event('input', {bubbles:true}));
      nums[1].dispatchEvent(new Event('change', {bubbles:true}));
      return `입력 완료: ${nums[0].value} x ${nums[1].value}`;
    }
    return '입력창 없음';
  });
  console.log(r);
  await sleep(500);

  // 새 디자인 만들기 클릭
  const btnR = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '새 디자인 만들기');
    if (btn) { btn.click(); return '클릭 성공'; }
    return '없음: ' + btns.map(b=>b.innerText?.trim().substring(0,20)).filter(t=>t).join(' / ');
  });
  console.log('버튼:', btnR);

  await sleep(5000);
  console.log('URL:', page.url());
  await page.screenshot({ path: 'canva_editor3.png' });

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

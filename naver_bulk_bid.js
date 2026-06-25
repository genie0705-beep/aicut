const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "입찰가 일괄 변경" 클릭
  const r1 = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('li, [role="menuitem"], button, div, span'));
    const item = items.find(el => el.innerText?.trim() === '입찰가 일괄 변경');
    if (item) { item.click(); return '입찰가 일괄 변경 클릭'; }
    return '없음: ' + items.filter(el=>el.innerText?.trim().includes('입찰가')).map(el=>el.innerText?.trim()).join(' | ');
  });
  console.log(r1);
  await sleep(2000);

  await page.screenshot({ path: 'naver_bulk_bid.png' });

  // 모달 입력창 확인
  const modalState = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(el => ({
      type: el.type, ph: el.placeholder, val: el.value, maxLen: el.maxLength,
      x: Math.round(el.getBoundingClientRect().x),
      y: Math.round(el.getBoundingClientRect().y),
      visible: el.getBoundingClientRect().y > 0 && el.getBoundingClientRect().y < window.innerHeight
    })).filter(el => el.visible && el.type !== 'checkbox');
    const radios = Array.from(document.querySelectorAll('label')).map(el => ({
      text: el.innerText?.trim(), y: Math.round(el.getBoundingClientRect().y)
    })).filter(el => el.text && el.y > 0 && el.y < 900).slice(0,10);
    return { inputs: inputs.slice(0,10), radios };
  });
  console.log('모달 상태:', JSON.stringify(modalState, null, 2));

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

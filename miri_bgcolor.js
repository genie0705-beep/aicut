const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('miricanvas.com') && p.url().includes('design'));

  await sleep(500);

  // 배경색 흰색 박스 클릭 (색상 피커 열기)
  const bgColorClicked = await page.evaluate(() => {
    // "배경색" 텍스트 옆 흰색 박스 찾기
    const allEls = Array.from(document.querySelectorAll('[class*="color"], [class*="swatch"], [class*="bg"]'));
    // 라벨 "배경색" 찾아서 그 형제/자식 클릭
    const labels = Array.from(document.querySelectorAll('span, p, div, label'));
    const bgLabel = labels.find(el => el.innerText?.trim() === '배경색');
    if (bgLabel) {
      const parent = bgLabel.parentElement;
      if (parent) {
        const colorBox = parent.querySelector('button, [style*="background"]');
        if (colorBox) { colorBox.click(); return '배경색 박스 클릭: ' + colorBox.className; }
        parent.click();
        return '배경색 부모 클릭';
      }
    }
    return '못 찾음';
  });
  console.log(bgColorClicked);
  await sleep(1500);

  await page.screenshot({ path: 'miri_colorpicker.png' });
  
  // 색상 피커 확인
  const pickerState = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ ph: i.placeholder, val: i.value, type: i.type, cls: i.className.substring(0,40) }));
    return inputs;
  });
  console.log('inputs:', JSON.stringify(pickerState.slice(0,8)));

  await b.close();
})().catch(e => console.error('Error:', e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('canva.com'));

  await sleep(500);

  // "새 디자인 만들기" 버튼 스크롤 후 클릭
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim() === '새 디자인 만들기');
    if (btn) btn.scrollIntoView({ block: 'center' });
  });
  await sleep(500);

  // 스크린샷에서 실제 보이는 버튼 위치 (오른쪽 상단 보라색 버튼 ~1000, 122)
  await page.mouse.click(1000, 122);
  console.log('버튼 클릭 (1000, 122)');
  await sleep(6000);

  const url = page.url();
  console.log('URL:', url);
  await page.screenshot({ path: 'canva_aftermake.png' });

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

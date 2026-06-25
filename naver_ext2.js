const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "새 확장 소재" 버튼 클릭 (드롭다운 열기)
  const r1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText?.trim().includes('새 확장 소재'));
    if (btn) { btn.click(); return '새 확장 소재 클릭'; }
    return '없음';
  });
  console.log(r1);
  await sleep(1500);

  await page.screenshot({ path: 'naver_ext_dropdown.png' });

  // 드롭다운 메뉴 항목 확인
  const menuItems = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('li, [role="menuitem"], [role="option"], a, button'))
      .map(el => el.innerText?.trim())
      .filter(t => t && t.length < 20 && t.length > 1)
      .slice(0, 20);
    return items;
  });
  console.log('드롭다운 항목:', menuItems);

  await b.close();
})().catch(e=>console.error(e.message))
.finally(()=>setTimeout(()=>process.exit(0),1000));

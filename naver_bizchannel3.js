const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "구성요소 관리" 클릭
  const r1 = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a, span, li'));
    const btn = btns.find(el => el.innerText?.trim() === '구성요소 관리');
    if (btn) { btn.click(); return '구성요소 관리 클릭'; }
    return '없음';
  });
  console.log(r1);
  await sleep(2000);

  await page.screenshot({ path: 'naver_components.png' });

  // 서브메뉴 확인
  const submenu = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, li, button'))
      .map(el => el.innerText?.trim())
      .filter(t => t && t.length < 15 && (t.includes('비즈') || t.includes('채널') || t.includes('DA') || t.includes('디스플')))
      .slice(0, 10);
  });
  console.log('서브메뉴:', submenu);

  // "비즈채널" 클릭
  const r2 = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('a, li, button, span'));
    const el = els.find(e => e.innerText?.trim() === '비즈채널' || e.innerText?.trim().includes('비즈채널'));
    if (el) { el.click(); return '비즈채널 클릭'; }
    return '없음';
  });
  console.log(r2);
  await sleep(2000);

  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1500));
  console.log(text);
  await page.screenshot({ path: 'naver_bizchannel3.png' });

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

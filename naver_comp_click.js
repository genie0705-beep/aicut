const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "구성요소 관리" 좌측 메뉴 좌표 클릭 (스크린샷 기준 x=85, y=355)
  await page.mouse.click(85, 355);
  console.log('구성요소 관리 클릭');
  await sleep(1500);

  await page.screenshot({ path: 'naver_comp_open.png' });

  // 펼쳐진 서브메뉴 확인
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a, li, span, button'))
      .map(el => ({ text: el.innerText?.trim(), href: el.href || '' }))
      .filter(el => el.text && el.text.length < 20 && (el.text.includes('비즈채널') || el.text.includes('전환추적') || el.text.includes('소재')))
      .slice(0, 10);
  });
  console.log('서브메뉴:', JSON.stringify(links));

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // "비즈채널 관리 바로가기" 텍스트 포함 요소 찾기
  const pos = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find(e => e.innerText?.trim() === '비즈채널 관리 바로가기');
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), tag: el.tagName, cls: el.className.substring(0,40) };
    }
    return null;
  });
  console.log('비즈채널 관리 바로가기 위치:', pos);

  if (pos && pos.y > 0) {
    await page.mouse.click(pos.x, pos.y);
    console.log(`클릭: (${pos.x}, ${pos.y})`);
    await sleep(3000);

    // 새 탭 확인
    const newPages = ctx.pages();
    console.log('현재 탭 수:', newPages.length);
    newPages.forEach((p,i) => console.log(i, p.url()));

    const targetPage = newPages.find(p => p.url().includes('biz-channel') || p.url().includes('bizchannel')) || page;
    await targetPage.screenshot({ path: 'naver_bc_manage.png' });
    console.log('타겟 URL:', targetPage.url());
    console.log(await targetPage.evaluate(() => document.body.innerText.substring(0, 800)));
  }

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

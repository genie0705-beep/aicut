const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 캠페인 생성 페이지 이동
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/da/ad/create/campaign?campaignObjective=CONVERSION', { waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
  await sleep(3000);

  // "비즈채널 관리 바로가기" 링크 위치 찾기
  const linkPos = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const link = links.find(a => a.innerText?.includes('비즈채널 관리 바로가기'));
    if (link) {
      const r = link.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), href: link.href };
    }
    return null;
  });
  console.log('비즈채널 관리 링크:', linkPos);

  if (linkPos) {
    // 새 탭으로 열릴 수 있으므로 현재 탭에서 직접 이동
    if (linkPos.href) {
      await page.goto(linkPos.href, { waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
    } else {
      await page.mouse.click(linkPos.x, linkPos.y);
    }
    await sleep(3000);
  }

  console.log('URL:', page.url());
  await page.screenshot({ path: 'naver_da_bc_page.png' });
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log(text);

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

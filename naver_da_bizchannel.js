const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));
  await sleep(500);

  // 대표 URL 드롭다운에서 비즈채널 관리 링크 찾기
  const bizLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const link = links.find(a => a.href?.includes('biz-channel') || a.innerText?.includes('비즈채널 관리'));
    return link ? { href: link.href, text: link.innerText?.trim() } : null;
  });
  console.log('비즈채널 관리 링크:', bizLink);

  // "비즈채널 관리 바로가기" 클릭
  const r = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button, span'));
    const el = links.find(e => e.innerText?.includes('비즈채널 관리 바로가기'));
    if (el) { el.click(); return '클릭: ' + el.innerText.trim(); }
    return '없음';
  });
  console.log(r);
  await sleep(3000);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'naver_da_bizchannel.png' });

  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log(text);

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

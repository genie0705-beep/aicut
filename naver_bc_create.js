const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.find(p => p.url().includes('ads.naver.com'));

  // 검색광고 비즈채널 페이지로 이동해서 DA용 채널 추가 시도
  await page.goto('https://ads.naver.com/manage/ad-accounts/334739/sa/channels', { waitUntil:'domcontentloaded', timeout:20000 }).catch(()=>{});
  await sleep(3000);

  // "비즈채널 생성" 버튼 클릭
  const r = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(b => b.innerText?.trim() === '비즈채널 생성');
    if (btn) { btn.click(); return '비즈채널 생성 클릭'; }
    return '없음';
  });
  console.log(r);
  await sleep(2000);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'naver_bc_create.png' });
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log(text);

  await b.close();
})().catch(e => console.error(e.message))
.finally(() => setTimeout(() => process.exit(0), 1000));

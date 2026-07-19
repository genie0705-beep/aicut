const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('admin.blog.naver.com')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
  }

  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(4000);

  console.log('Frames:', page.frames().length);
  page.frames().forEach((f, i) => {
    const url = f.url();
    if (url && url !== 'about:blank') console.log(`  [${i}] ${url.substring(0, 120)}`);
  });

  // 통계 프레임 찾기
  const statFrame = page.frames().find(f => f.url().includes('stat.naver'));
  if (statFrame) {
    console.log('\n✅ Stat Frame:', statFrame.url());
    const t = await statFrame.evaluate(() => document.body.innerText);
    console.log(t);
  } else {
    console.log('통계 프레임 없음');
    // 페이지 전체 텍스트 확인
    const t = await page.evaluate(() => document.body.innerText);
    t.split('\n').filter(l => l.trim()).slice(0, 15).forEach(l => console.log(l));
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));

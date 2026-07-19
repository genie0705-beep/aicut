const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📊 네이버 블로그 통계 전체 추출 ===\n');

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
    await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await sleep(5000);
  }
  await page.bringToFront();
  await sleep(3000);

  // 오늘 통계 (일간)
  console.log('━━━ A. 오늘 일간 통계 ━━━');
  await page.goto('https://admin.blog.naver.com/aicut/stat/today', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(5000);

  // 모든 iframe 데이터 추출
  const allFrames = page.frames();
  console.log(`총 프레임: ${allFrames.length}`);
  for (let i = 0; i < allFrames.length; i++) {
    try {
      const f = allFrames[i];
      const url = f.url();
      
      // 통계 데이터가 있는 프레임만 (본문 영역)
      if (url.includes('naver') && !url.includes('nid.naver') && url !== 'about:blank') {
        const ft = await f.evaluate(() => document.body.innerText).catch(() => '');
        if (ft && ft.length > 10) {
          console.log(`\n--- Frame [${i}]: ${url.substring(0, 80)} ---`);
          ft.split('\n').filter(l => l.trim()).forEach((l, j) => console.log(`  ${j}: ${l.trim().substring(0, 120)}`));
        }
      }
    } catch(e) {}
  }

  // 주간 통계
  console.log('\n━━━ B. 주간 통계 ━━━');
  await page.goto('https://admin.blog.naver.com/aicut/stat/visitor', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(5000);

  for (const f of allFrames) {
    try {
      if (f.url().includes('naver') && !f.url().includes('nid.naver') && f.url() !== 'about:blank') {
        const ft = await f.evaluate(() => document.body.innerText).catch(() => '');
        if (ft && ft.length > 10) {
          console.log(`\n--- Frame: ${f.url().substring(0, 80)} ---`);
          ft.split('\n').filter(l => l.trim()).forEach((l, j) => console.log(`  ${j}: ${l.trim().substring(0, 120)}`));
        }
      }
    } catch(e) {}
  }

  // 키워드/유입 통계
  console.log('\n━━━ C. 유입 분석 ━━━');
  await page.goto('https://admin.blog.naver.com/aicut/stat/acquisition', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(5000);
  const frames2 = page.frames();
  for (const f of frames2) {
    try {
      if (f.url().includes('naver') && !f.url().includes('nid.naver') && f.url() !== 'about:blank') {
        const ft = await f.evaluate(() => document.body.innerText).catch(() => '');
        if (ft && ft.length > 10) {
          console.log(`\n--- Frame: ${f.url().substring(0, 80)} ---`);
          ft.split('\n').filter(l => l.trim()).forEach((l, j) => console.log(`  ${j}: ${l.trim().substring(0, 120)}`));
        }
      }
    } catch(e) {}
  }

  // 이웃 통계
  console.log('\n━━━ D. 이웃 현황 ━━━');
  await page.goto('https://admin.blog.naver.com/aicut/stat/neighbor', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(5000);
  const frames3 = page.frames();
  for (const f of frames3) {
    try {
      if (f.url().includes('naver') && !f.url().includes('nid.naver') && f.url() !== 'about:blank') {
        const ft = await f.evaluate(() => document.body.innerText).catch(() => '');
        if (ft && ft.length > 10) {
          console.log(`\n--- Frame: ${f.url().substring(0, 80)} ---`);
          ft.split('\n').filter(l => l.trim()).forEach((l, j) => console.log(`  ${j}: ${l.trim().substring(0, 120)}`));
        }
      }
    } catch(e) {}
  }

  b.close();
})().catch(e => console.error('FATAL:', e.message));

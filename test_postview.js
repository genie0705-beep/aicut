const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  await page.goto('https://blog.naver.com/aicut/224333770986', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(6000);

  // PostView 프레임
  const pf = page.frames().find(f => f.url().includes('PostView'));
  if (!pf) { console.log('PostView frame not found'); b.close(); return; }

  console.log('=== PostView Frame ===');
  console.log('URL:', pf.url().substring(0, 100));

  // PostView의 프레임 트리
  const subFrames = pf.frames();
  console.log('Sub-frames:', subFrames.length);
  subFrames.forEach((f, i) => {
    if (f.url() !== 'about:blank') console.log(`  [${i}] ${f.url().substring(0, 100)}`);
  });

  // PostView 자체에서 텍스트 확인
  let text = await pf.evaluate(() => document.body.innerText).catch(() => 'err');
  console.log('\nPostView body text (first 500 chars):', text.substring(0, 500));

  // PostView 안의 자식 iframe들 확인
  for (const sf of subFrames) {
    if (sf.url() !== 'about:blank') {
      try {
        const st = await sf.evaluate(() => document.body.innerText).catch(() => '');
        if (st && st.length > 10) {
          console.log(`\n--- Subframe ${sf.url().substring(0, 80)} ---`);
          st.split('\n').filter(l => l.trim()).slice(0, 20).forEach((l, i) => console.log(`  ${i}: ${l.substring(0, 100)}`));
        }
      } catch(e) {}
    }
  }

  b.close();
})().catch(e => console.log('ERR:', e.message));

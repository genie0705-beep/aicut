const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  // 다양한 가능한 URL 시도
  const urls = [
    'https://blokey.co.kr',
    'https://blokey.kr',
    'https://www.blokey.ai',
    'https://blokey.io',
    'https://blokey.net',
  ];

  for (const url of urls) {
    console.log(`시도: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await sleep(2000);
    const loc = page.url();
    console.log(`  → ${loc.substring(0, 60)}`);
    const t = await page.evaluate(() => document.body.innerText).catch(() => '');
    if (!t.includes('연결할 수 없음') && !t.includes('DNS_PROBE')) {
      console.log('  ✅ 접속 성공!');
      t.split('\n').filter(l => l.trim()).slice(0, 30).forEach((l, i) => console.log(`  ${i}: ${l.substring(0, 100)}`));
      break;
    }
  }

  // 구글 검색으로 Blokey 찾기
  console.log('\n--- 구글 검색 ---');
  await page.goto('https://www.google.com/search?q=Blokey+%ED%82%A4%EC%9B%8C%EB%93%9C+%EB%B6%84%EC%84%9D+%EC%82%AC%EC%9D%B4%ED%8A%B8', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await sleep(3000);
  const t = await page.evaluate(() => document.body.innerText);
  t.split('\n').filter(l => l.trim() && l.toLowerCase().includes('blokey')).slice(0, 10).forEach(l => console.log('  ' + l.substring(0, 100)));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();

  console.log('=== 레퍼런스 포스트 분석 ===\n');
  await page.goto('https://blog.naver.com/aicut/224329573617', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(5000);

  // PostView 프레임
  const pf = page.frames().find(f => f.url().includes('PostView'));
  if (!pf) { console.log('PostView 없음'); b.close(); return; }

  const text = await pf.evaluate(() => document.body.innerText);
  const lines = text.split('\n').filter(l => l.trim());

  console.log('=== 전체 본문 ===');
  lines.forEach((l, i) => console.log(`  ${i}: ${l.substring(0, 120)}`));

  console.log('\n=== 스타일 분석 ===');
  // 분석
  const stats = {
    totalLines: lines.length,
    avgLineLen: Math.round(lines.reduce((a,l) => a + l.length, 0) / lines.length),
    emojiCount: (text.match(/[\u{1F000}-\u{1FFFF}]/gu) || []).length,
    h2Count: lines.filter(l => l.length < 30 && /[🔥📋✅🎯☀️⚡💡📊📱🎬✂️🏢]/.test(l)).length,
    shortLines: lines.filter(l => l.length < 30).length,
    ctaKakao: text.includes('pf.kakao.com') ? '✅' : '❌',
    ctaEmail: text.includes('master@aicut.co.kr') ? '✅' : '❌',
    ctaWeb: text.includes('aicut.co.kr') ? '✅' : '❌',
    hashCount: (text.match(/#/g) || []).length,
  };

  console.log(JSON.stringify(stats, null, 2));

  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

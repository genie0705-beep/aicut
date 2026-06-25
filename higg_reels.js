// 힉스필드 릴스 생성
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // 힉스필드 탭 찾기
  let p = null;
  for (const page of ctx.pages()) {
    if (page.url().includes('higgsfield')) { p = page; break; }
  }
  if (!p) { console.log('힉스필드 탭 없음'); process.exit(1); }

  // 릴스 생성 페이지로
  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel', {
    waitUntil: 'domcontentloaded', timeout: 20000
  }).catch(() => {});
  await p.waitForTimeout(5000);

  console.log('URL:', p.url());
  const body = await p.evaluate(() => document.body.innerText.substring(0, 1500)).catch(() => '');
  console.log('본문:', body);

  // 입력창 찾기
  const inputs = await p.$$('textarea, input[type="text"], [contenteditable="true"]');
  console.log(`\n입력창: ${inputs.length}개`);
  for (const inp of inputs) {
    const ph = await inp.getAttribute('placeholder').catch(() => '-');
    const vis = await inp.isVisible().catch(() => false);
    const tag = await inp.evaluate(el => el.tagName).catch(() => '?');
    console.log(`  ${tag} ph="${ph?.substring(0, 40)}" vis=${vis}`);
  }

  try { await b.close(); } catch(e) {}
})();

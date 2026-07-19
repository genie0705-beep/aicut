const { chromium } = require('playwright');
const CDP_PORT = 9224;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  ctx.pages().forEach((p, i) => {
    const url = p.url();
    if (url.includes('memorial')) console.log(`[${i}] 📋 ${url.substring(0, 120)}`);
    else if (url.includes('blog.naver.com/aicut/224335815629')) console.log(`[${i}] 📝 블로그: ${url.substring(0, 100)}`);
    else console.log(`[${i}] ${url.substring(0, 100)}`);
  });
  b.close();
})().catch(e => console.log('ERR:', e.message));

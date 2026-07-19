const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page = pages[0];
  if (!page) { page = await b.newPage(); }
  page.on('dialog', async d => { await d.dismiss(); });
  
  // Check if already logged into Naver
  await page.goto('https://www.naver.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  
  const naverStatus = await page.evaluate(() => {
    const html = document.body.innerHTML;
    const text = document.body.innerText;
    const hasLoginBtn = html.includes('로그인') || text.includes('로그인');
    const hasMyInfo = html.includes('MY') || html.includes('내정보') || text.includes('내정보');
    return { hasLoginBtn, hasMyInfo, textSample: text.replace(/\s+/g, ' ').substring(0, 200) };
  });
  console.log('Naver status:', JSON.stringify(naverStatus));
  
  // Try search advisor with blog analysis
  await page.goto('https://searchadvisor.naver.com/console/blog/aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('\nSa URL:', page.url());
  const saText = await page.evaluate(() => document.body.innerText);
  console.log('SA text (first 1500):', saText.substring(0, 1500));
  
  process.exit(0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

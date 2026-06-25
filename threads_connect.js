const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  try { await page.goto('https://www.threads.com/login', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  // "Instagram으로 계속하기" 버튼 클릭
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(el => el.innerText?.includes('Instagram으로 계속'));
    if (btn) { btn.click(); return btn.innerText.trim(); }
    return null;
  });
  console.log('클릭:', clicked);
  await new Promise(r => setTimeout(r, 5000));

  console.log('URL:', page.url());
  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('텍스트:', text.substring(0, 400));

  // 로그인 완료 후 aicut 프로필 분석
  if (page.url().includes('threads.com') && !page.url().includes('login')) {
    try { await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
    await new Promise(r => setTimeout(r, 4000));
    const profileText = await page.evaluate(() => document.body.innerText.substring(0, 800));
    console.log('\n=== 에이컷 Threads 프로필 ===');
    console.log(profileText.substring(0, 600));
  }

  await b.close();
})().catch(e => console.error('ERR:', e.message));

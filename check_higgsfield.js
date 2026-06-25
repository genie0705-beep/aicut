const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  let hp = pages.find(p => p.url().includes('higgsfield'));
  if (!hp) {
    hp = await ctx.newPage();
    await hp.goto('https://higgsfield.ai/sora-trends/instagram-reel', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  }
  await new Promise(r => setTimeout(r, 4000));

  console.log('URL:', hp.url().substring(0, 100));
  const text = await hp.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('=== 페이지 내용 ===');
  console.log(text);

  // 로그인 상태 확인
  const isLoggedIn = text.includes('Logout') || text.includes('logout') || text.includes('Dashboard');
  console.log('\n로그인 상태:', isLoggedIn ? '✅' : '❌');
  console.log('Login 버튼 있음:', text.includes('Login') ? '✅' : '❌');
  console.log('Sign up 버튼 있음:', text.includes('Sign up') ? '✅' : '❌');

  // 릴스 생성 가능한 영역 확인
  const hasCreateBtn = text.includes('생성') || text.includes('Create') || text.includes('Generate');
  console.log('생성 버튼:', hasCreateBtn ? '✅' : '❌');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

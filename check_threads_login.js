const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  const tp = pages.find(p => p.url().includes('threads'));
  
  // aicut.official 프로필로 이동 (로그인 상태 확인)
  await tp.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('URL:', tp.url().substring(0, 100));
  
  const profileInfo = await tp.evaluate(() => {
    const text = document.body.innerText;
    const hasProfileEdit = text.includes('프로필 편집') || text.includes('Edit profile');
    const hasFollow = text.includes('팔로우') || text.includes('Follow');
    const hasLogin = text.includes('로그인') || text.includes('Instagram으로 계속하기');
    return {
      hasProfileEdit,
      hasFollow,
      hasLogin,
      sampleText: text.substring(0, 400)
    };
  });
  
  console.log('프로필 편집 버튼:', profileInfo.hasProfileEdit);
  console.log('팔로우 버튼:', profileInfo.hasFollow);
  console.log('로그인 필요:', profileInfo.hasLogin);
  console.log('\n=== 페이지 텍스트 ===');
  console.log(profileInfo.sampleText);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

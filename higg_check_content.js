const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  let p = null;
  for (const page of ctx.pages()) {
    if (page.url().includes('higgsfield')) { p = page; break; }
  }
  if (!p) { console.log('no higgsfield tab'); await b.close(); return; }
  await p.bringToFront();
  await p.waitForTimeout(2000);

  // Read existing content in textarea
  const existingContent = await p.evaluate(() => {
    const ta = document.querySelector('textarea');
    if (!ta) return 'no textarea';
    return ta.value;
  });
  
  console.log('=== 기존 프롬프트 내용 (' + existingContent.length + '자) ===');
  console.log(existingContent);
  
  // Check Generate button and other controls
  const controls = await p.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    const btnList = Array.from(buttons)
      .filter(b => b.innerText.includes('생성') || b.innerText.includes('Generate') || 
                   b.innerText.includes('Create') || b.innerText.includes('30%') ||
                   b.offsetParent !== null)
      .map(b => ({
        text: b.innerText.substring(0, 40),
        visible: b.offsetParent !== null,
        class: b.className.substring(0, 40)
      }));
    
    // 로그인 상태 확인
    const bodyText = document.body.innerText;
    const isLoggedIn = bodyText.includes('Login') === false || bodyText.includes('Logout');
    
    return { btns: btnList, isLoggedIn, loginOrUpgrade: bodyText.includes('upgrade') || bodyText.includes('Upgrade') || bodyText.includes('Pricing') };
  });
  
  console.log('\n=== 컨트롤 ===');
  controls.btns.forEach(b => console.log(JSON.stringify(b)));
  console.log('로그인:', controls.isLoggedIn ? '✅' : '❌');
  console.log('업그레이드 필요:', controls.loginOrUpgrade ? '⚠️' : '✅');
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

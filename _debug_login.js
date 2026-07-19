const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let p = pages[0]; // First page
  
  // Check cookies for nid (Naver login)
  const cookies = await ctx.cookies();
  const nidCookie = cookies.find(c => c.name.includes('NID'));
  console.log('NID cookie:', nidCookie ? nidCookie.name + '=' + nidCookie.value.substring(0,10)+'...' : 'NOT FOUND');
  
  // Check if logged in to Naver
  await p.goto('https://www.naver.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await p.waitForTimeout(2000);
  const isLoggedIn = await p.evaluate(() => {
    // Check for common logged-in indicators
    const body = document.body.innerText;
    return {
      hasLoginBtn: body.includes('로그인'),
      textSample: body.substring(0, 200)
    };
  });
  console.log('Naver.com:', JSON.stringify(isLoggedIn));
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

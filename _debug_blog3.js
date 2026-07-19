const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Try going to the blog main page first
  let p = pages[5]; // blog home
  // Navigate to the blog
  await p.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  console.log('Blog URL:', p.url());
  
  // Check page content
  const html = await p.content();
  // Check for login
  if (html.includes('login') || html.includes('Login') || html.includes('로그인')) {
    console.log('--- LOGIN REQUIRED ---');
    // Show relevant snippet
    const idx = html.indexOf('로그인');
    console.log('Login text around:', html.substring(Math.max(0,idx-100), idx+100));
  }
  
  console.log('Title:', await p.title());
  console.log('Has smart editor?', html.includes('SmartEditor'));
  console.log('Body starts with:', html.substring(0, 300));
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // Check all cookies
  const cookies = await ctx.cookies();
  const nidCookies = cookies.filter(c => c.name.includes('NID') || c.name.includes('nid') || c.name.includes('SESS'));
  console.log('Auth cookies:', nidCookies.map(c => c.name + '=' + c.value.substring(0,15)+'...').join(', '));
  
  // Go directly to blog management
  let p = pages[0];
  await p.goto('https://blog.naver.com/aicut?from=menu', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  console.log('Blog URL:', p.url());
  
  // Get body text to check
  const text = await p.evaluate(() => {
    const body = document.body;
    return {
      innerText: body.innerText.substring(0, 300).replace(/\s+/g, ' '),
      hasWriteBtn: body.innerHTML.includes('글쓰기') || body.innerHTML.includes('write'),
      scripts: Array.from(document.scripts).length
    };
  });
  console.log('Blog page:', JSON.stringify(text));
  
  // Try to find the write link any way possible
  const writeLinks = await p.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links.filter(l => (l.href || '').includes('write') || (l.href || '').includes('PostWrite') || (l.textContent || '').includes('글')).map(l => ({
      text: (l.textContent || '').substring(0,20),
      href: (l.href || '').substring(0,100)
    }));
  });
  console.log('Write links:', JSON.stringify(writeLinks));
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

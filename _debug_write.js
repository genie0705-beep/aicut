const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let p = pages[5];
  
  // Go to blog and find write button
  await p.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 15000 });
  await p.waitForTimeout(3000);
  
  // Check for buttons
  const buttons = await p.evaluate(() => {
    const all = document.querySelectorAll('a, button, span, [role="button"]');
    const results = [];
    all.forEach(el => {
      const text = el.innerText || el.textContent;
      if (text && text.trim().length > 0 && text.length < 20) {
        results.push(text.trim().substring(0, 30));
      }
    });
    return [...new Set(results)];
  });
  console.log('All button texts:', buttons.filter(b => b.length > 0));
  
  // Also check iframes
  const frames = p.frames();
  console.log('Frames:', frames.length);
  
  // Try to find if there's a "글쓰기" element
  const links = await p.evaluate(() => {
    const aTags = document.querySelectorAll('a');
    const results = [];
    aTags.forEach(a => {
      const t = a.innerText || a.textContent;
      if (t && t.includes('글')) results.push({ text: t.trim().substring(0,20), href: a.href.substring(0,100) });
    });
    return results;
  });
  console.log('Links with 글:', links);
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

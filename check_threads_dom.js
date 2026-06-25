const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  const tp = pages.find(p => p.url().includes('threads'));
  
  // 태그 페이지로 이동
  await tp.goto('https://www.threads.net/tag/%EC%BD%98%ED%85%90%EC%B8%A0%EB%A7%88%EC%BC%80%ED%8C%85', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('URL:', tp.url().substring(0, 100));
  
  // DOM 구조 분석
  const domInfo = await tp.evaluate(() => {
    const lines = [];
    lines.push('article count: ' + document.querySelectorAll('article').length);
    lines.push('a[href] count: ' + document.querySelectorAll('a[href]').length);
    
    const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 15);
    links.forEach(a => {
      const h = a.getAttribute('href');
      const t = (a.innerText || '').trim().substring(0, 40);
      if (h) lines.push('  href: ' + h.substring(0, 80) + ' | text: ' + t);
    });
    
    lines.push('contenteditable: ' + document.querySelectorAll('div[contenteditable]').length);
    lines.push('role=button: ' + document.querySelectorAll('div[role="button"]').length);
    lines.push('section count: ' + document.querySelectorAll('section').length);
    lines.push('main count: ' + document.querySelectorAll('main').length);
    
    return lines.join('\n');
  });
  console.log(domInfo);
  
  console.log('\n=== 페이지 텍스트 (300자) ===');
  const text = await tp.evaluate(() => document.body.innerText.substring(0, 300));
  console.log(text);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

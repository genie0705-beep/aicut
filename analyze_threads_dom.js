const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  const tp = pages.find(p => p.url().includes('threads'));
  
  // Threads 태그 페이지
  await tp.goto('https://www.threads.com/tag/%EC%BD%98%ED%85%90%EC%B8%A0%EB%A7%88%EC%BC%80%ED%8C%85', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('URL:', tp.url().substring(0, 100));
  
  // DOM 구조 자세히 분석
  const domDetail = await tp.evaluate(() => {
    const lines = [];
    
    // document의 모든 요소 타입별 개수
    const tagCounts = {};
    const allEls = document.querySelectorAll('*');
    allEls.forEach(el => {
      const tag = el.tagName.toLowerCase();
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    lines.push('=== 요소별 개수 ===');
    Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0, 20).forEach(([k,v]) => {
      lines.push('  ' + k + ': ' + v);
    });
    
    // role 속성별
    lines.push('\n=== role 속성 ===');
    const roles = {};
    document.querySelectorAll('[role]').forEach(el => {
      const r = el.getAttribute('role');
      roles[r] = (roles[r] || 0) + 1;
    });
    Object.entries(roles).forEach(([k,v]) => lines.push('  role=' + k + ': ' + v));
    
    // a 태그 상세
    lines.push('\n=== a 태그 상세 ===');
    document.querySelectorAll('a').forEach(a => {
      const h = a.getAttribute('href') || '';
      const t = (a.innerText || '').trim().substring(0, 30);
      const cls = a.className || '';
      if (h) lines.push('  href: ' + h.substring(0, 80) + ' | text: ' + t + ' | class: ' + cls.substring(0, 30));
    });
    
    // 모든 div의 첫 번째 레벨 구조
    lines.push('\n=== 주요 div class ===');
    const divs = document.querySelectorAll('div');
    const seenClasses = new Set();
    divs.forEach(d => {
      const cls = d.className || '';
      if (cls && !seenClasses.has(cls)) {
        seenClasses.add(cls);
        const r = d.getBoundingClientRect();
        if (r.width > 100) lines.push('  div class=' + cls.substring(0, 50) + ' size=' + Math.round(r.width) + 'x' + Math.round(r.height));
      }
    });
    
    return lines.join('\n');
  });
  
  console.log(domDetail);
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

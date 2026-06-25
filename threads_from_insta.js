const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  
  // Instagram 프로필 페이지로 이동
  let igPage = pages.find(p => p.url().includes('instagram.com/aicut'));
  if (!igPage) igPage = pages.find(p => p.url().includes('instagram.com'));
  
  if (!igPage) {
    console.log('Instagram 페이지 없음');
    await b.close();
    process.exit(0);
  }
  
  // aicut.official 프로필로 이동
  await igPage.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Instagram URL:', igPage.url().substring(0, 80));
  
  // Threads 링크 찾기 (프로필의 Threads 아이콘)
  const threadsLink = await igPage.evaluate(() => {
    // 모든 a 태그 중 Threads 링크 찾기
    const links = Array.from(document.querySelectorAll('a[href*="threads"]'));
    if (links.length > 0) {
      const r = links[0].getBoundingClientRect();
      return { x: r.x + r.width/2, y: r.y + r.height/2, url: links[0].href };
    }
    
    // SVG 아이콘 중 Threads 아이콘 찾기 (더 구체적)
    const all = Array.from(document.querySelectorAll('a, svg, img'));
    for (const el of all) {
      const href = el.getAttribute('href') || '';
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || '';
      if (href.includes('threads') || src.includes('threads') || alt.toLowerCase().includes('threads')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, url: href || src || alt };
      }
    }
    return null;
  });
  
  if (threadsLink) {
    console.log('Threads 링크 찾음:', threadsLink.url);
    await igPage.mouse.click(threadsLink.x, threadsLink.y);
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('이동 후 URL:', igPage.url().substring(0, 100));
    
    // 로그인 확인
    const pageText = await igPage.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('페이지:', pageText);
  } else {
    console.log('Threads 링크를 프로필에서 못 찾음');
    
    // Instagram 프로필 페이지 전체 DOM 확인
    const domInfo = await igPage.evaluate(() => {
      const lines = [];
      const links = Array.from(document.querySelectorAll('a')).slice(0, 20);
      links.forEach(a => {
        const h = a.getAttribute('href') || '';
        const t = (a.innerText || '').trim().substring(0, 30);
        if (h) lines.push('  a: ' + h.substring(0, 80));
      });
      return lines.join('\n');
    });
    console.log('프로필 링크들:');
    console.log(domInfo);
  }
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

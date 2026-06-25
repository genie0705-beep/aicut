const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  const tp = pages.find(p => p.url().includes('threads'));
  
  // 태그 페이지 (로그인 안 된 상태)
  await tp.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  // Instagram으로 계속하기 버튼 찾기
  const btnCoord = await tp.evaluate(() => {
    const allEls = document.querySelectorAll('a, button, div[role="button"], span, div');
    for (const el of allEls) {
      const t = (el.innerText || '').trim();
      if (t.includes('Instagram') && t.includes('계속')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: t.substring(0, 40) };
      }
    }
    return null;
  });
  
  if (!btnCoord) {
    console.log('Instagram 로그인 버튼 못 찾음');
    await b.close();
    process.exit(0);
  }
  
  console.log('클릭:', btnCoord.text, '@', btnCoord.x, btnCoord.y);
  await tp.mouse.click(btnCoord.x, btnCoord.y);
  await new Promise(r => setTimeout(r, 6000));
  
  console.log('로그인 후 URL:', tp.url().substring(0, 100));
  
  const pageText = await tp.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('페이지:', pageText);
  
  // 해시태그 검색 가능한지 확인
  if (tp.url().includes('threads')) {
    await tp.goto('https://www.threads.com/tag/%EC%BD%98%ED%85%90%EC%B8%A0%EB%A7%88%EC%BC%80%ED%8C%85', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    const tagText = await tp.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('\n태그 페이지:', tagText.substring(0, 200));
  }
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

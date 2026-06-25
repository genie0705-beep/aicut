const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('blog.naver.com/aicut') && p.url().includes('Write'));
  if (!page) page = pages.find(p => p.url().includes('postwrite'));
  if (!page) { console.log('에디터 탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 2000));
  console.log('에디터 URL:', page.url().substring(0, 100));

  // mainFrame 찾아서 발행 버튼 클릭
  const mf = page.frames().find(f => f.name() === 'mainFrame') || page;

  // 발행 버튼 찾기
  const btn = await mf.evaluate(() => {
    const all = document.querySelectorAll('button, [role="button"], a, span, div');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '발행') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });

  if (btn) {
    console.log('발행 버튼 클릭:', btn.x, btn.y);
    await mf.mouse.click(btn.x, btn.y);
    await new Promise(r => setTimeout(r, 3000));
    console.log('클릭 완료');
    
    // 발행 후 페이지 변화 확인
    const text = await mf.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('페이지:', text.substring(0, 200));
  } else {
    console.log('발행 버튼 못 찾음 - mainFrame 아닌 메인 페이지에서 검색');
    // 메인 페이지에서 발행 버튼 찾기
    const btn2 = await page.evaluate(() => {
      const all = document.querySelectorAll('button, [role="button"], a, span, div');
      for (const el of all) {
        const t = (el.innerText || '').trim();
        if (t === '발행') {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.x > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (btn2) {
      console.log('메인페이지 발행 버튼 클릭:', btn2.x, btn2.y);
      await page.mouse.click(btn2.x, btn2.y);
      await new Promise(r => setTimeout(r, 3000));
      console.log('클릭 완료');
      
      const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('페이지:', text.substring(0, 200));
    } else {
      console.log('발행 버튼을 찾을 수 없음');
    }
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

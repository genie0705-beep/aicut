const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const page = await ctx.newPage();
  
  // Threads 방문
  await page.goto('https://www.threads.net/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  // Instagram으로 계속하기 버튼 찾기
  const btnCoord = await page.evaluate(() => {
    const allEls = document.querySelectorAll('a, button, div[role="button"], span');
    for (const el of allEls) {
      const t = (el.innerText || '').trim();
      if (t.includes('Instagram') || t.includes('instagram')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, text: t.substring(0, 50) };
        }
      }
    }
    return null;
  });
  
  if (!btnCoord) {
    console.log('Instagram 로그인 버튼 못 찾음');
    await page.close();
    await b.close();
    process.exit(0);
  }
  
  console.log('버튼:', btnCoord.text, '위치:', btnCoord.x, btnCoord.y);
  
  // 클릭
  await page.mouse.click(btnCoord.x, btnCoord.y);
  await new Promise(r => setTimeout(r, 5000));
  
  // 로그인 후 URL 확인
  console.log('URL:', page.url().substring(0, 100));
  
  // 로그인 완료 확인
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('페이지 텍스트:', pageText);
  
  // 로그인 성공 시 댓글 작업 계속
  if (page.url().includes('threads.net') && !pageText.includes('로그인') && !pageText.includes('Instagram으로')) {
    console.log('Threads 로그인 성공 ✅');
    
    // 해시태그 검색해서 댓글 달기
    const tags = ['콘텐츠마케팅', '영상편집', '숏폼마케팅', '병원마케팅'];
    let totalComments = 0;
    const MAX_COMMENTS = 6;
    
    for (const tag of tags) {
      if (totalComments >= MAX_COMMENTS) break;
      console.log('\n=== #' + tag + ' ===');
      
      await page.goto('https://www.threads.net/tag/' + encodeURIComponent(tag), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));
      
      const posts = await page.evaluate(() => {
        const articles = Array.from(document.querySelectorAll('article'));
        const urls = [];
        for (const art of articles) {
          const a = art.querySelector('a[href]');
          if (a) {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('/tags') && !href.startsWith('/search')) {
              urls.push('https://www.threads.net' + href);
            }
          }
        }
        return [...new Set(urls)].slice(0, 4);
      });
      console.log('포스팅:', posts.length);
      
      for (const url of posts) {
        if (totalComments >= MAX_COMMENTS) break;
        
        console.log('  → ' + url.substring(0, 60));
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 2500));
        
        // 댓글창 찾기
        const inputCoord = await page.evaluate(() => {
          const divs = Array.from(document.querySelectorAll('div[contenteditable="true"], [role="textbox"]'));
          for (const el of divs) {
            const r = el.getBoundingClientRect();
            if (r.width > 50 && r.height > 20) {
              return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
            }
          }
          return null;
        });
        
        if (!inputCoord) { console.log('  입력창 없음'); continue; }
        
        const comment = '좋은 정보 감사해요 😊';
        await page.mouse.click(inputCoord.x, inputCoord.y);
        await new Promise(r => setTimeout(r, 500));
        await page.keyboard.type(comment, { delay: 20 });
        await new Promise(r => setTimeout(r, 800));
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 3000));
        
        totalComments++;
        console.log('  ✅ 완료 (' + totalComments + '/' + MAX_COMMENTS + ')');
        await new Promise(r => setTimeout(r, Math.random() * 5000 + 5000));
      }
    }
    
    console.log('\n✅ Threads 댓글 ' + totalComments + '개 완료');
  } else {
    console.log('Threads 로그인 실패');
  }
  
  await page.close();
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

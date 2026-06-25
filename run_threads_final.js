const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  
  // Threads 탭 찾기
  let threadsPage = pages.find(p => p.url().includes('threads.com') || p.url().includes('threads.net'));
  
  if (!threadsPage) {
    console.log('Threads 탭 없음');
    await b.close();
    process.exit(0);
  }
  
  console.log('Threads 탭 사용:', threadsPage.url().substring(0, 100));
  
  // 해시태그 검색
  const tags = ['콘텐츠마케팅', '영상편집', '숏폼마케팅', '병원마케팅', '부동산마케팅', '브랜드영상'];
  let totalComments = 0;
  const MAX_COMMENTS = 8;
  
  for (const tag of tags) {
    if (totalComments >= MAX_COMMENTS) break;
    console.log('\n=== #' + tag + ' ===');
    
    await threadsPage.goto('https://www.threads.net/tag/' + encodeURIComponent(tag), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    // 게시물 링크 수집
    const posts = await threadsPage.evaluate(() => {
      const articles = Array.from(document.querySelectorAll('article'));
      const urls = [];
      for (const art of articles) {
        const a = art.querySelector('a[href]');
        if (a) {
          let href = a.getAttribute('href');
          if (href && !href.startsWith('/tags') && !href.startsWith('/search') && !href.startsWith('/@')) {
            if (href.startsWith('/')) href = 'https://www.threads.net' + href;
            urls.push(href);
          }
        }
      }
      return [...new Set(urls)].slice(0, 4);
    });
    console.log('포스팅:', posts.length);
    
    for (const url of posts) {
      if (totalComments >= MAX_COMMENTS) break;
      
      console.log('  → ' + url.substring(0, 70));
      await threadsPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2500));
      
      // 댓글 입력창 찾기
      const inputCoord = await threadsPage.evaluate(() => {
        // contenteditable div 또는 role="textbox"
        const divs = Array.from(document.querySelectorAll('div[contenteditable="true"], [role="textbox"]'));
        for (const el of divs) {
          const r = el.getBoundingClientRect();
          if (r.width > 50 && r.height > 20) return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
        return null;
      });
      
      if (!inputCoord) {
        console.log('  입력창 못 찾음 - 클릭 필요 확인');
        // 댓글 버튼 찾아서 먼저 클릭
        const replyBtn = await threadsPage.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('div[role="button"], button'));
          for (const btn of btns) {
            const t = (btn.innerText || '').trim();
            if (t.includes('댓글') || t.includes('답글') || t.includes('Reply') || t.includes('reply')) {
              const r = btn.getBoundingClientRect();
              if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
            }
          }
          return null;
        });
        
        if (!replyBtn) { console.log('  댓글 버튼 없음'); continue; }
        
        await threadsPage.mouse.click(replyBtn.x, replyBtn.y);
        await new Promise(r => setTimeout(r, 1500));
        
        // 다시 입력창 찾기
        const inputCoord2 = await threadsPage.evaluate(() => {
          const divs = Array.from(document.querySelectorAll('div[contenteditable="true"], [role="textbox"]'));
          for (const el of divs) {
            const r = el.getBoundingClientRect();
            if (r.width > 50 && r.height > 20) return { x: r.x + r.width/2, y: r.y + r.height/2 };
          }
          return null;
        });
        
        if (!inputCoord2) { console.log('  입력창 여전히 없음'); continue; }
        
        const comment = '좋은 정보 감사해요 😊';
        await threadsPage.mouse.click(inputCoord2.x, inputCoord2.y);
        await new Promise(r => setTimeout(r, 500));
        await threadsPage.keyboard.type(comment, { delay: 20 });
        await new Promise(r => setTimeout(r, 800));
        await threadsPage.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 3000));
        
        totalComments++;
        console.log('  ✅ 완료 (' + totalComments + '/' + MAX_COMMENTS + ')');
        await new Promise(r => setTimeout(r, Math.random() * 5000 + 5000));
        continue;
      }
      
      const comment = '좋은 정보 감사해요 😊';
      await threadsPage.mouse.click(inputCoord.x, inputCoord.y);
      await new Promise(r => setTimeout(r, 500));
      await threadsPage.keyboard.type(comment, { delay: 20 });
      await new Promise(r => setTimeout(r, 800));
      await threadsPage.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 3000));
      
      totalComments++;
      console.log('  ✅ 완료 (' + totalComments + '/' + MAX_COMMENTS + ')');
      await new Promise(r => setTimeout(r, Math.random() * 5000 + 5000));
    }
  }
  
  console.log('\n✅ Threads 댓글 ' + totalComments + '개 완료');
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

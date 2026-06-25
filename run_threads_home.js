const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  const tp = pages.find(p => p.url().includes('threads'));
  
  // 홈 피드로 이동 (로그인된 상태에서 추천 피드)
  await tp.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));
  
  // 스크롤 다운해서 게시물 로드
  for (let i = 0; i < 5; i++) {
    await tp.evaluate(() => window.scrollBy(0, 800));
    await new Promise(r => setTimeout(r, 1000));
  }
  await new Promise(r => setTimeout(r, 2000));
  
  // 페이지 내 모든 게시물 링크 수집 (a 태그 중 post 링크)
  const postUrls = await tp.evaluate(() => {
    const urls = new Set();
    // 모든 a 태그 중 내부 링크
    document.querySelectorAll('a[href]').forEach(a => {
      let href = a.getAttribute('href') || '';
      // Threads 게시물 패턴: /@사용자/post-id 또는 /t/post-id
      if (href.startsWith('/') && !href.startsWith('/@') && !href.startsWith('/tag') && !href.startsWith('/search') && !href.startsWith('/login') && !href.startsWith('/legal')) {
        urls.add('https://www.threads.com' + href);
      }
    });
    return Array.from(urls).slice(0, 10);
  });
  
  console.log('홈 피드 게시물:', postUrls.length);
  postUrls.forEach(u => console.log('  ' + u.substring(0, 70)));
  
  // 게시물이 없으면 다른 방식 시도
  if (postUrls.length === 0) {
    // 페이지 내 게시물 컨테이너 찾기
    const containers = await tp.evaluate(() => {
      const allDivs = document.querySelectorAll('div');
      const found = [];
      allDivs.forEach(d => {
        const inner = d.innerText || '';
        if (inner.length > 50 && inner.length < 500 && inner.includes('\n')) {
          const r = d.getBoundingClientRect();
          if (r.width > 200 && r.height > 100) found.push(inner.substring(0, 100));
        }
      });
      return found.slice(0, 5);
    });
    console.log('게시물 컨텐츠 샘플:', containers);
  }
  
  // 댓글 달기
  let totalComments = 0;
  const MAX_COMMENTS = 6;
  
  for (const url of postUrls) {
    if (totalComments >= MAX_COMMENTS) break;
    
    console.log('\n→ ' + url.substring(0, 60));
    await tp.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    // 댓글 입력창 찾기
    const inputCoord = await tp.evaluate(() => {
      const inputs = document.querySelectorAll('div[contenteditable="true"], [role="textbox"]');
      for (const el of inputs) {
        const r = el.getBoundingClientRect();
        if (r.width > 50 && r.height > 20 && r.x > 0 && r.y > 0) {
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (!inputCoord) {
      console.log('  입력창 없음 - 버튼 찾기');
      const btn = await tp.evaluate(() => {
        const btns = document.querySelectorAll('div[role="button"]');
        for (const b of btns) {
          const t = b.innerText || '';
          if (t.includes('댓글') || t.includes('Reply') || t.includes('답글')) {
            const r = b.getBoundingClientRect();
            if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
          }
        }
        return null;
      });
      
      if (!btn) { console.log('  댓글 인터페이스 없음'); continue; }
      
      await tp.mouse.click(btn.x, btn.y);
      await new Promise(r => setTimeout(r, 1500));
      
      const input2 = await tp.evaluate(() => {
        const inputs = document.querySelectorAll('div[contenteditable="true"], [role="textbox"]');
        for (const el of inputs) {
          const r = el.getBoundingClientRect();
          if (r.width > 50 && r.height > 20 && r.x > 0 && r.y > 0) {
            return { x: r.x + r.width/2, y: r.y + r.height/2 };
          }
        }
        return null;
      });
      
      if (!input2) { console.log('  여전히 입력창 없음'); continue; }
      
      await tp.mouse.click(input2.x, input2.y);
      await new Promise(r => setTimeout(r, 500));
      await tp.keyboard.type('좋은 정보 감사해요 😊', { delay: 20 });
      await new Promise(r => setTimeout(r, 800));
      await tp.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 3000));
      
      totalComments++;
      console.log('  ✅ 완료 (' + totalComments + '/' + MAX_COMMENTS + ')');
      continue;
    }
    
    await tp.mouse.click(inputCoord.x, inputCoord.y);
    await new Promise(r => setTimeout(r, 500));
    await tp.keyboard.type('좋은 정보 감사해요 😊', { delay: 20 });
    await new Promise(r => setTimeout(r, 800));
    
    // 전송 버튼 찾기 또는 Enter
    const sent = await tp.evaluate(() => {
      const btns = document.querySelectorAll('div[role="button"]');
      for (const b of btns) {
        const t = b.innerText || '';
        if (t === '게시' || t === 'Post' || t === '보내기') {
          if (!b.hasAttribute('disabled')) { b.click(); return true; }
        }
      }
      return false;
    });
    
    if (!sent) await tp.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    
    totalComments++;
    console.log('  ✅ 완료 (' + totalComments + '/' + MAX_COMMENTS + ')');
    await new Promise(r => setTimeout(r, Math.random() * 5000 + 5000));
  }
  
  console.log('\n✅ Threads 댓글 ' + totalComments + '개 완료');
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

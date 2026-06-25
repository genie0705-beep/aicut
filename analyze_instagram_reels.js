const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  let igPage = pages.find(p => p.url().includes('instagram.com/aicut'));
  if (!igPage) igPage = pages.find(p => p.url().includes('instagram.com'));
  if (!igPage) {
    igPage = await ctx.newPage();
    await igPage.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  }
  await new Promise(r => setTimeout(r, 3000));

  // 1. 탐색 페이지 (인기 릴스)
  await igPage.goto('https://www.instagram.com/explore/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  console.log('탐색 페이지 로딩 완료');

  // 인기 릴스 찾기 (많은 조회수/댓글)
  const topReels = await igPage.evaluate(() => {
    const items = [];
    // 게시물 링크 수집
    const links = document.querySelectorAll('a[href*="/reel/"]');
    links.forEach((a, i) => {
      if (i < 10) {
        const href = a.getAttribute('href') || '';
        const img = a.querySelector('img');
        const alt = img ? img.getAttribute('alt') || '' : '';
        const r = a.getBoundingClientRect();
        items.push({ 
          href: href.substring(0, 80), 
          alt: alt.substring(0, 50),
          size: Math.round(r.width) + 'x' + Math.round(r.height)
        });
      }
    });

    // 일반 게시물 중 릴스 표시된 것
    if (items.length === 0) {
      document.querySelectorAll('a[href*="/p/"]').forEach((a, i) => {
        if (i < 10) {
          const href = a.getAttribute('href') || '';
          items.push({ href: href.substring(0, 80), alt: '', size: '' });
        }
      });
    }
    return items;
  });

  console.log('\n=== 인기 릴스/게시물 목록 ===');
  if (topReels.length > 0) {
    topReels.forEach((r, i) => console.log(` ${i+1}. ${r.href} ${r.alt}`));
  } else {
    console.log('릴스 목록 없음');
  }

  // 2. 영상편집/마케팅 해시태그 검색
  await igPage.goto('https://www.instagram.com/explore/tags/%EC%98%81%EC%83%81%ED%8E%B8%EC%A7%91/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  const editingPosts = await igPage.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/reel/"], a[href*="/p/"]');
    return Array.from(new Set(Array.from(links).map(a => a.href))).slice(0, 8);
  });

  console.log('\n=== #영상편집 인기 게시물 ===');
  editingPosts.forEach((p, i) => console.log(` ${i+1}. ${p.substring(0, 80)}`));

  // 3. 각 릴스 분석 (상세 페이지로 이동)
  if (editingPosts.length > 0) {
    const reelUrl = editingPosts[0];
    console.log('\n=== 첫 번째 릴스 분석 ===');
    console.log('URL:', reelUrl.substring(0, 80));
    
    await igPage.goto(reelUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));

    const reelInfo = await igPage.evaluate(() => {
      const text = document.body.innerText;
      // 조회수 추출
      const viewMatch = text.match(/([\d,]+)회\s*조회/) || text.match(/조회\s*([\d,]+)/);
      const views = viewMatch ? viewMatch[1] : '확인 불가';
      // 좋아요
      const likeMatch = text.match(/좋아요\s*([\d,]+)/);
      const likes = likeMatch ? likeMatch[1] : '';
      // 작성자
      const userMatch = text.match(/@([\w.]+)/);
      const user = userMatch ? userMatch[1] : '';
      
      return { views, likes, user, textSample: text.substring(0, 500) };
    });
    console.log(JSON.stringify(reelInfo, null, 2));
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

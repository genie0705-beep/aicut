const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  let instaPage = pages.find(p => p.url().includes('instagram.com'));
  if (!instaPage) {
    instaPage = await ctx.newPage();
    await instaPage.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('Instagram URL:', instaPage.url().substring(0, 80));
  
  const tags = ['콘텐츠마케팅', '영상편집', '숏폼마케팅', '병원마케팅', '부동산마케팅'];
  let totalComments = 0;
  const MAX_COMMENTS = 8;
  
  for (const tag of tags) {
    if (totalComments >= MAX_COMMENTS) break;
    console.log('\n=== #' + tag + ' ===');
    
    await instaPage.goto('https://www.instagram.com/explore/tags/' + encodeURIComponent(tag) + '/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    const posts = await instaPage.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/p/"]'));
      return [...new Set(links.map(a => a.href))].slice(0, 5);
    });
    console.log('포스팅:', posts.length);
    
    for (const url of posts) {
      if (totalComments >= MAX_COMMENTS) break;
      
      await instaPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2500));
      
      const isOwn = await instaPage.evaluate(() => document.body.innerText.includes('aicut.official'));
      if (isOwn) { console.log('  내글 스킵'); continue; }
      
      const postText = await instaPage.evaluate(() => {
        const h1 = document.querySelector('h1 span');
        if (h1 && h1.innerText.trim().length > 10) return h1.innerText.trim().substring(0, 150);
        return '';
      });
      
      let comment = '좋은 정보 감사해요 😊';
      const t = (postText || '').toLowerCase();
      if (t.includes('편집') || t.includes('영상')) comment = '영상 편집 관련 좋은 정보 감사합니다 👍';
      else if (t.includes('마케팅') || t.includes('광고')) comment = '마케팅 인사이트 감사해요! 많이 배웁니다 🙏';
      else if (t.includes('병원') || t.includes('의원')) comment = '병원 마케팅 관련 좋은 내용이네요 😊';
      else if (t.includes('부동산')) comment = '부동산 콘텐츠 요즘 트렌드네요 👍';
      else if (t.includes('유튜브') || t.includes('채널')) comment = '채널 운영 파이팅입니다! 잘 보고 갈게요 🔥';
      
      console.log('  댓글: ' + comment);
      
      const inputCoords = await instaPage.evaluate(() => {
        const ta = document.querySelector('textarea');
        if (ta) {
          const r = ta.getBoundingClientRect();
          if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
        return null;
      });
      
      if (!inputCoords) { console.log('  입력창 없음'); continue; }
      
      await instaPage.mouse.click(inputCoords.x, inputCoords.y);
      await new Promise(r => setTimeout(r, 500));
      await instaPage.keyboard.type(comment, { delay: 25 });
      await new Promise(r => setTimeout(r, 800));
      
      const posted = await instaPage.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button[type="submit"], button:not([type])'));
        const btn = btns.find(b => {
          const t2 = (b.innerText||'').trim();
          return t2 === '게시' || t2 === 'Post';
        });
        if (btn && !btn.disabled) { btn.click(); return true; }
        return false;
      });
      if (!posted) await instaPage.keyboard.press('Enter');
      
      await new Promise(r => setTimeout(r, 3000));
      
      totalComments++;
      console.log('  ✅ 완료 (' + totalComments + '/' + MAX_COMMENTS + ')');
      await new Promise(r => setTimeout(r, Math.random() * 5000 + 5000));
    }
  }
  
  console.log('\n✅ 인스타 댓글 ' + totalComments + '개 완료');
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

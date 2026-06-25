const { chromium } = require('playwright');
const fs = require('fs');

const HASHTAGS = ['영상편집', '콘텐츠마케팅', '숏폼마케팅', '병원마케팅', '브랜드영상'];

function generateComment(postText) {
  const t = (postText || '').toLowerCase();
  if (t.includes('편집') || t.includes('영상')) return '영상 편집 관련 좋은 정보 감사합니다 👍';
  if (t.includes('마케팅') || t.includes('광고')) return '마케팅 인사이트 감사해요! 많이 배웁니다 🙏';
  if (t.includes('숏폼') || t.includes('릴스')) return '숏폼 요즘 진짜 필수죠! 잘 보고 갑니다 🔥';
  if (t.includes('병원') || t.includes('의원')) return '병원 마케팅 관련 좋은 내용이네요 😊';
  if (t.includes('부동산')) return '부동산 콘텐츠 요즘 트렌드네요 👍';
  if (t.includes('유튜브') || t.includes('채널')) return '채널 운영 파이팅입니다! 잘 보고 갈게요 🔥';
  if (t.includes('ai') || t.includes('인공지능')) return 'AI 활용 방법 진짜 중요해졌죠 🤖';
  return '좋은 정보 감사해요 😊';
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const page = await ctx.newPage();
  
  // Threads 로그인 확인
  console.log('Threads 로그인 확인 중...');
  await page.goto('https://www.threads.net/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  const loginNeeded = await page.evaluate(() => document.body.innerText.includes('로그인') || document.body.innerText.includes('Log in'));
  if (loginNeeded) {
    console.log('로그인 필요 - Instagram 로그인 세션 확인');
    // Instagram 페이지에서 로그인 세션 복사 시도
    const pages = ctx.pages();
    const instaPage = pages.find(p => p.url().includes('instagram.com'));
    if (instaPage) {
      const cookies = await instaPage.context().cookies();
      const threadsCookies = cookies.filter(c => c.domain.includes('threads') || c.domain.includes('.instagram'));
      if (threadsCookies.length > 0) {
        await page.context().addCookies(threadsCookies);
        await page.goto('https://www.threads.net/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  
  const stillLogin = await page.evaluate(() => document.body.innerText.includes('로그인') || document.body.innerText.includes('Log in'));
  if (stillLogin) {
    console.log('Threads 로그인 불가 - 스킵');
    await page.close();
    await b.close();
    process.exit(0);
  }
  
  console.log('Threads 로그인 확인 ✅');
  
  let totalComments = 0;
  const MAX_COMMENTS = 8;
  
  for (const tag of HASHTAGS) {
    if (totalComments >= MAX_COMMENTS) break;
    console.log('\n=== #' + tag + ' ===');
    
    await page.goto('https://www.threads.net/tag/' + encodeURIComponent(tag), { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    // Threads 포스팅 링크 수집
    const posts = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/post/"]'));
      return [...new Set(links.map(a => 'https://www.threads.net' + a.getAttribute('href')))].slice(0, 5);
    });
    console.log('포스팅:', posts.length);
    
    if (posts.length === 0) {
      // 대체: article 내부 링크
      const altPosts = await page.evaluate(() => {
        const articles = Array.from(document.querySelectorAll('article'));
        const urls = [];
        for (const art of articles) {
          const a = art.querySelector('a[href]');
          if (a) {
            const href = a.getAttribute('href');
            if (href && href.includes('/')) urls.push('https://www.threads.net' + href);
          }
        }
        return [...new Set(urls)].slice(0, 5);
      });
      if (altPosts.length > 0) {
        posts.push(...altPosts);
        console.log('  대체링크:', altPosts.length);
      }
    }
    
    for (const url of posts) {
      if (totalComments >= MAX_COMMENTS) break;
      
      console.log('  → ' + url.substring(0, 70));
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 2500));
      
      // 본문 추출
      const postText = await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        for (const s of spans) {
          const t = s.innerText.trim();
          if (t.length > 20 && !t.includes('·') && !t.includes('팔로우')) return t.substring(0, 200);
        }
        return '';
      });
      
      const comment = generateComment(postText);
      console.log('  댓글: ' + comment);
      
      // 댓글 입력 (Threads는 댓글창 클릭 → 입력)
      const replyBtn = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
        for (const btn of buttons) {
          const t = btn.innerText.trim();
          if (t.includes('댓글') || t.includes('답글') || t.includes('댓글 달기') || t.includes('Reply')) {
            const r = btn.getBoundingClientRect();
            if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
          }
        }
        return null;
      });
      
      if (!replyBtn) { console.log('  댓글 버튼 없음'); continue; }
      
      await page.mouse.click(replyBtn.x, replyBtn.y);
      await new Promise(r => setTimeout(r, 1500));
      
      // 입력 필드 찾기
      const inputEl = await page.evaluate(() => {
        const divs = Array.from(document.querySelectorAll('div[contenteditable="true"], [role="textbox"]'));
        for (const el of divs) {
          const r = el.getBoundingClientRect();
          if (r.width > 100 && r.height > 20) return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
        return null;
      });
      
      if (!inputEl) { console.log('  입력창 없음'); continue; }
      
      await page.mouse.click(inputEl.x, inputEl.y);
      await new Promise(r => setTimeout(r, 500));
      await page.keyboard.type(comment, { delay: 20 });
      await new Promise(r => setTimeout(r, 800));
      
      // 전송: Enter 또는 버튼 클릭
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 3000));
      
      totalComments++;
      console.log('  ✅ 완료 (' + totalComments + '/' + MAX_COMMENTS + ')');
      await new Promise(r => setTimeout(r, Math.random() * 5000 + 5000));
    }
  }
  
  console.log('\n✅ Threads 댓글 ' + totalComments + '개 완료');
  await page.close();
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

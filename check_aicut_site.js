const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  
  // === 1. Threads 로그인 상태 재확인 ===
  const threadsPage = pages.find(p => p.url().includes('threads.com') || p.url().includes('threads.net'));
  
  if (threadsPage) {
    await threadsPage.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    const loginStatus = await threadsPage.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasProfileEdit: text.includes('프로필 편집') || text.includes('Edit profile'),
        hasLoginPrompt: text.includes('Instagram으로 계속하기'),
        url: window.location.href.substring(0, 100)
      };
    });
    
    console.log('=== Threads 로그인 상태 ===');
    console.log('프로필 편집:', loginStatus.hasProfileEdit);
    console.log('로그인 필요:', loginStatus.hasLoginPrompt);
    console.log('URL:', loginStatus.url);
  } else {
    console.log('Threads 탭 없음');
  }
  
  // === 2. 에이컷 사이트 PC 체크 ===
  const aicutPage = pages.find(p => p.url().includes('aicut.co.kr'));
  
  if (aicutPage) {
    console.log('\n=== 에이컷 사이트 PC ===');
    await aicutPage.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    const pcInfo = await aicutPage.evaluate(() => {
      // 유튜브 관련 요소 찾기
      const youtubeLinks = [];
      // iframe
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(f => {
        const src = f.getAttribute('src') || '';
        if (src.includes('youtube') || src.includes('youtu.be')) {
          const r = f.getBoundingClientRect();
          youtubeLinks.push({
            type: 'youtube_iframe',
            src: src.substring(0, 100),
            visible: r.width > 0 && r.height > 0,
            width: Math.round(r.width),
            height: Math.round(r.height),
            position: { x: Math.round(r.x), y: Math.round(r.y) }
          });
        }
      });
      
      // a 태그 중 youtube 링크
      const links = document.querySelectorAll('a[href*="youtube"], a[href*="youtu.be"]');
      links.forEach(a => {
        const r = a.getBoundingClientRect();
        youtubeLinks.push({
          type: 'youtube_link',
          href: a.getAttribute('href'),
          text: (a.innerText || '').trim().substring(0, 50),
          visible: r.width > 0 && r.height > 0,
          width: Math.round(r.width),
          height: Math.round(r.height)
        });
      });
      
      // 유튜브 관련 텍스트 영역
      const bodyText = document.body.innerText;
      const youtubeMentions = (bodyText.match(/유튜브|youtube|Youtube|YouTube|YOUTUBE/g) || []).length;
      
      return {
        youtubeLinks,
        youtubeMentions,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    });
    
    console.log('뷰포트:', pcInfo.viewportWidth, 'x', pcInfo.viewportHeight);
    console.log('유튜브 링크:', JSON.stringify(pcInfo.youtubeLinks, null, 2));
    console.log('유튜브 언급 횟수:', pcInfo.youtubeMentions);
    
    // === 3. 에이컷 사이트 모바일 체크 ===
    console.log('\n=== 에이컷 사이트 모바일 ===');
    // 모바일 뷰포트로 변경
    await aicutPage.setViewportSize({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 1000));
    
    // 스크롤 다운하면서 유튜브 영역 찾기
    const mobileInfo = await aicutPage.evaluate(() => {
      const results = [];
      
      // 전체 페이지 스크롤하면서 유튜브 요소 확인
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const tag = el.tagName.toLowerCase();
        const href = el.getAttribute('href') || '';
        const src = el.getAttribute('src') || '';
        const text = (el.innerText || '').trim();
        
        if ((tag === 'iframe' && (src.includes('youtube') || src.includes('youtu.be'))) ||
            (tag === 'a' && (href.includes('youtube') || href.includes('youtu.be')))) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            results.push({
              tag,
              hrefOrSrc: (href || src).substring(0, 80),
              visible: r.width > 0 && r.height > 0,
              width: Math.round(r.width),
              height: Math.round(r.height),
              position_x: Math.round(r.x),
              position_y: Math.round(r.y)
            });
          }
        }
      }
      
      return {
        youtubeElements: results,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    });
    
    console.log('모바일 뷰포트:', mobileInfo.viewportWidth, 'x', mobileInfo.viewportHeight);
    console.log('모바일 유튜브 요소:', JSON.stringify(mobileInfo.youtubeElements, null, 2));
    
    // 스크린샷도 찍어서 확인
    // 전체 페이지 스크린샷
    await aicutPage.screenshot({ path: 'aicut_mobile_full.png', fullPage: true });
    console.log('\n모바일 전체 스크린샷: aicut_mobile_full.png 저장됨');
    
  } else {
    console.log('에이컷 사이트 탭 없음');
  }
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

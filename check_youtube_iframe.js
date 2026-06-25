const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  let page = ctx.pages().find(p => p.url().includes('aicut.co.kr'));
  if (!page) page = await ctx.newPage();
  
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));
  
  // 유튜브 섹션으로 스크롤
  await page.evaluate(() => {
    const f = document.querySelector('iframe[src*="youtube"]');
    if (f) f.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 3000));
  
  // YouTube iframe 프레임 찾기
  const frames = page.frames();
  console.log('전체 프레임:', frames.length);
  frames.forEach((f, i) => {
    const url = f.url();
    if (url.includes('youtube') || url.includes('google')) {
      console.log(' 프레임[' + i + ']: ' + url.substring(0, 120));
    }
  });
  
  // youtube iframe 내부 접근 시도
  const ytFrame = frames.find(f => f.url().includes('youtube-nocookie.com') || f.url().includes('youtube.com/embed'));
  
  if (ytFrame) {
    console.log('\n유튜브 프레임 발견! URL:', ytFrame.url().substring(0, 100));
    
    // iframe 내부 상태
    const ytState = await ytFrame.evaluate(() => {
      const info = {};
      
      // body 텍스트 (에러 메시지 확인)
      info.bodyText = (document.body.innerText || '').substring(0, 500);
      
      // 에러 요소
      const err = document.querySelector('.ytp-error, .ytp-error-message, .yt-player-error-message');
      info.hasError = !!err;
      info.errorText = err ? err.innerText : '';
      
      // 플레이어 상태
      const player = document.querySelector('.html5-video-player');
      info.hasPlayer = !!player;
      info.playerClass = player ? (player.className || '') : '';
      
      // CSS로 숨겨진 요소
      info.allText = document.body.innerText.substring(0, 300);
      
      return info;
    });
    
    console.log('\n=== 유튜브 iframe 내부 상태 ===');
    console.log(JSON.stringify(ytState, null, 2));
  } else {
    console.log('\n유튜브 프레임을 찾을 수 없음');
    
    // 모든 프레임 URL 출력
    console.log('\n모든 프레임:');
    frames.forEach(f => console.log(' ' + f.url().substring(0, 100) || '(blank)'));
  }
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

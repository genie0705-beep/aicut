const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('aicut.co.kr'));
  if (!page) page = await ctx.newPage();
  
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('https://aicut.co.kr/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));
  
  // 유튜브 섹션까지 스크롤
  const ytPos = await page.evaluate(() => {
    const f = document.querySelector('iframe[src*="youtube"]');
    if (!f) return -1;
    f.scrollIntoView({ block: 'center' });
    const r = f.getBoundingClientRect();
    return r.y;
  });
  console.log('유튜브 영역 위치 (뷰포트 기준):', ytPos);
  await new Promise(r => setTimeout(r, 3000));
  
  // 1. iframe 상세 정보
  const iframeInfo = await page.evaluate(() => {
    const frames = document.querySelectorAll('iframe[src*="youtube"]');
    return {
      count: frames.length,
      details: Array.from(frames).slice(0, 3).map((f, i) => {
        const r = f.getBoundingClientRect();
        return {
          i,
          w: Math.round(r.width),
          h: Math.round(r.height),
          x: Math.round(r.x),
          y: Math.round(r.y),
          inView: r.x < window.innerWidth && r.x + r.width > 0 && r.y < window.innerHeight && r.y + r.height > 0,
          sandbox: f.getAttribute('sandbox') || '(none)',
          src: (f.getAttribute('src') || '').substring(0, 100)
        };
      })
    };
  });
  console.log('\n=== iframe 정보 ===');
  console.log(JSON.stringify(iframeInfo, null, 2));
  
  // 2. 유튜브 섹션 주변 텍스트
  const sectionText = await page.evaluate(() => {
    const frames = document.querySelectorAll('iframe[src*="youtube"]');
    if (frames.length === 0) return '유튜브 iframe 없음';
    
    // iframe 주변 텍스트 수집
    let parent = frames[0].parentElement;
    for (let i = 0; i < 5; i++) {
      if (!parent) break;
      parent = parent.parentElement;
    }
    if (!parent) return '부모 없음';
    
    const texts = [];
    parent.querySelectorAll('*').forEach(el => {
      const t = (el.innerText || '').trim();
      if (t && el.tagName !== 'IFRAME' && !texts.includes(t)) {
        texts.push(t.substring(0, 100));
      }
    });
    return texts.slice(0, 8);
  });
  console.log('\n=== 섹션 텍스트 ===');
  console.log(sectionText);
  
  // 3. "볼 수 없습니다" 메시지 검색
  const errorText = await page.evaluate(() => {
    const body = document.body.innerText;
    const found = [];
    const keywords = ['볼 수 없습니다', '재생할 수 없', '동영상 오류', '사용할 수 없', '차단',
                      'This video is unavailable', 'not available'];
    keywords.forEach(kw => {
      if (body.includes(kw)) {
        // 위치 찾기
        const idx = body.indexOf(kw);
        const start = Math.max(0, idx - 30);
        const end = Math.min(body.length, idx + kw.length + 50);
        found.push({ keyword: kw, context: body.substring(start, end) });
      }
    });
    return found;
  });
  console.log('\n=== 오류 메시지 검색 ===');
  console.log(JSON.stringify(errorText, null, 2));
  
  // 4. 부모 컨테이너 CSS 속성
  const containerCSS = await page.evaluate(() => {
    const f = document.querySelector('iframe[src*="youtube"]');
    if (!f) return null;
    let p = f.parentElement;
    for (let i = 0; i < 3; i++) {
      if (p) {
        const cs = window.getComputedStyle(p);
        const r = p.getBoundingClientRect();
        console.log('div class=' + (p.className||'').substring(0,40) + ' overflow=' + cs.overflow + ' overflowX=' + cs.overflowX);
        p = p.parentElement;
      }
    }
    
    // 상위 3개 컨테이너 CSS 수집
    let el = f.parentElement;
    const result = [];
    for (let i = 0; i < 4; i++) {
      if (!el) break;
      const cs = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      result.push({
        level: i,
        tag: el.tagName,
        className: (typeof el.className === 'string' ? el.className.substring(0, 50) : ''),
        w: Math.round(r.width),
        h: Math.round(r.height),
        overflow: cs.overflow,
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        display: cs.display,
        position: cs.position
      });
      el = el.parentElement;
    }
    return result;
  });
  console.log('\n=== 컨테이너 CSS ===');
  console.log(JSON.stringify(containerCSS, null, 2));
  
  // 5. 페이지 전체에서 에러 관련 요소 찾기
  const errorElements = await page.evaluate(() => {
    const els = [];
    document.querySelectorAll('*').forEach(el => {
      const t = (el.innerText || '').trim();
      if ((t.includes('볼 수 없습니다') || t.includes('재생할 수 없')) && t.length < 200) {
        els.push({
          tag: el.tagName,
          text: t.substring(0, 150),
          className: (el.className||'').substring(0, 40)
        });
      }
    });
    return els;
  });
  console.log('\n=== 에러 요소 ===');
  console.log(JSON.stringify(errorElements, null, 2));
  
  // 6. 스크린샷 (해당 영역)
  const clip = await page.evaluate(() => {
    const f = document.querySelector('iframe[src*="youtube"]');
    if (!f) return null;
    const r = f.getBoundingClientRect();
    return {
      x: Math.max(0, r.x - 20),
      y: Math.max(0, r.y - 60),
      width: Math.min(window.innerWidth - Math.max(0, r.x - 20), 430),
      height: 500
    };
  });
  
  if (clip) {
    await page.screenshot({ path: 'aicut_youtube_section.png', clip });
    console.log('\n스크린샷: aicut_youtube_section.png');
  }
  
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

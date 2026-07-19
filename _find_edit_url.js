const { chromium } = require('playwright');
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // 포스팅 페이지 열기
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(3000);

    // PostView iframe 찾기
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (!pf) { console.log('PostView iframe not found'); return; }
    console.log('PostView iframe found');

    // onclick 핸들러 분석
    const editHandler = await pf.evaluate(() => {
      const link = document.querySelector('a._modifyPost');
      if (!link) return { error: '_modifyPost not found' };
      
      const onclick = link.getAttribute('onclick');
      const href = link.getAttribute('href');
      const cls = link.className;
      const events = typeof link.onclick === 'function' ? link.onclick.toString() : 'not function';
      
      return { onclick, href, cls, events: events.substring(0, 500) };
    });
    
    console.log('수정 링크 정보:', JSON.stringify(editHandler, null, 2));

    // class에서 파라미터 추출
    // class="_modifyPost _returnFalse _param(224341544476|true|false|false|false)"
    const paramMatch = editHandler.cls?.match(/_param\(([^)]+)\)/);
    if (paramMatch) {
      console.log('파라미터:', paramMatch[1]);
    }
    
    // 페이지의 JavaScript 함수 찾기
    const funcInfo = await page.evaluate(() => {
      // 수정 관련 함수 검색
      const funcs = [];
      for (const key of Object.keys(window)) {
        if (key.toLowerCase().includes('edit') || key.toLowerCase().includes('modif') || key.toLowerCase().includes('post')) {
          funcs.push(key);
        }
      }
      return funcs;
    });
    console.log('관련 함수:', funcInfo);

    // 현재 iframe에 있는 JavaScript
    const pfFuncs = await pf.evaluate(() => {
      const funcs = [];
      for (const key of Object.keys(window)) {
        if (typeof window[key] === 'function' && key.length > 5 && key.length < 30) {
          funcs.push(key);
        }
      }
      return funcs.slice(0, 30);
    });
    console.log('iframe 함수들:', pfFuncs);

  } finally {
    await page.close();
  }
})();

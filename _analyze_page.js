const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 모든 페이지 스캔
  const pages = ctx.pages();
  console.log('전체 탭:', pages.length + '개');
  pages.forEach((p, i) => console.log(`  [${i}] ${p.url().substring(0, 100)}`));
  
  for (const page of pages) {
    const url = page.url();
    
    if (url.includes('PostWriteForm')) {
      console.log('\n=== PostWriteForm 분석 ===');
      
      // 1. 페이지 상태
      const state = await page.evaluate(() => {
        const r = {};
        r.url = location.href;
        r.title = document.title;
        r.bodyText = (document.body.innerText || '').substring(0, 200);
        r.readyState = document.readyState;
        r.iframes = document.querySelectorAll('iframe').length;
        
        // SmartEditor 상세
        if (typeof SmartEditor !== 'undefined') {
          r.SE = {};
          r.SE.editorIds = Object.keys(SmartEditor._editors || {});
          r.SE.launchExists = typeof SmartEditor.launch === 'function';
          if (SmartEditor._editors && SmartEditor._editors['blogpc001']) {
            r.SE.hasEditor = true;
            try { r.SE.title = SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { r.SE.titleErr = e.message; }
          }
        } else {
          r.SE = 'undefined';
        }
        
        // iframe 상세
        r.iframeInfo = [];
        document.querySelectorAll('iframe').forEach((f, i) => {
          try {
            const doc = f.contentDocument || f.contentWindow?.document;
            if (doc) {
              r.iframeInfo.push({ idx: i, src: (f.src || '').substring(0, 60), bodyLen: doc.body?.innerHTML?.length || 0, id: f.id });
              // iframe 내부 SmartEditor 찾기
              if (typeof doc.defaultView?.SmartEditor !== 'undefined') {
                r.SE_in_iframe = i;
              }
            } else {
              r.iframeInfo.push({ idx: i, src: (f.src || '').substring(0, 60), blocked: true });
            }
          } catch(e) {
            r.iframeInfo.push({ idx: i, src: (f.src || '').substring(0, 60), error: e.message.substring(0, 40) });
          }
        });
        
        return r;
      });
      console.log(JSON.stringify(state, null, 2));
      
      // 2. 네트워크 요청 모니터링
      console.log('\n--- 최근 네트워크 요청 ---');
      page.on('requestfinished', req => {
        const url = req.url();
        if (url.includes('SmartEditor') || url.includes('se4') || url.includes('launch') || url.includes('editor')) {
          console.log(`  ${req.method()} ${url.substring(0, 120)} | ${req.response()?.status()}`);
        }
      });
      
      // 3. JS 오류 확인
      console.log('\n--- JS 콘솔 에러 ---');
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          console.log(`  [${msg.type()}] ${msg.text().substring(0, 150)}`);
        }
      });
      
      await sleep(5000);
    }
  }
  
  console.log('\n분석 완료');
  await b.close();
})();

const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  // postwrite URL로 직접 이동
  await p.goto('https://blog.naver.com/aicut/postwrite', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  console.log('현재 URL:', p.url());
  console.log('title:', await p.title());
  
  const info = await p.evaluate(() => {
    const result = {
      bodyHTML_sample: document.body.innerHTML.slice(0, 1000),
      bodyText: (document.body.innerText || '').slice(0, 500),
      iframes: Array.from(document.querySelectorAll('iframe')).map(f => ({ id: f.id, name: f.name, className: f.className.slice(0,50), src: (f.src || '').slice(0,200) })),
      smartEditor: typeof SmartEditor,
    };
    return result;
  });
  console.log(JSON.stringify(info, null, 2));
  
  // SmartEditor 객체 탐색
  const seInfo = await p.evaluate(() => {
    const result = {};
    
    // 전역에서 SmartEditor 검색
    for (const key of Object.keys(window)) {
      if (key.toLowerCase().includes('smart') || key.toLowerCase().includes('editor') || key.toLowerCase().includes('se2')) {
        result[key] = typeof window[key];
      }
    }
    
    // contenteditable 영역
    const ce = document.querySelectorAll('[contenteditable]');
    result.contentEditableCount = ce.length;
    result.contentEditables = Array.from(ce).map(el => ({ 
      id: el.id, 
      cls: el.className.slice(0,60),
      tag: el.tagName,
      role: el.getAttribute('role'),
      parentCls: el.parentElement?.className?.slice(0,60)
    }));
    
    return result;
  });
  console.log('SE 정보:', JSON.stringify(seInfo, null, 2));
  
  await p.screenshot({ path: 'debug_postwrite.png', fullPage: true });
  console.log('✅ 스크린샷: debug_postwrite.png');
  
  await b.close();
}

main().catch(e => console.error('❌', e.message));

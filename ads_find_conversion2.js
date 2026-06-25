const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  let p = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('ads.naver.com')) { p = pg; break; }
  }
  if (!p) { console.log('no ads page'); await b.close(); return; }
  await p.bringToFront();
  
  // Navigate to dashboard first
  await p.goto('https://ads.naver.com/manage/ad-accounts/334739/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);
  
  // Try to find and click "도구" and its submenus
  const result = await p.evaluate(() => {
    const body = document.body.innerText;
    const lines = body.split('\n');
    const afterTools = [];
    let foundTools = false;
    for (const line of lines) {
      const t = line.trim();
      if (t === '도구') { foundTools = true; continue; }
      if (foundTools) {
        if (t === '대시보드' || t === '전체 캠페인' || t === '검색 광고' || t === '디스플레이 광고') break;
        afterTools.push(t);
      }
    }
    
    return {
      afterTools,
      // Find all clickable elements with text containing 전환
      allBtns: Array.from(document.querySelectorAll('button, a, span, div, li'))
        .filter(el => el.innerText && el.innerText.includes('전환'))
        .map(el => ({ tag: el.tagName, text: el.innerText.trim().substring(0, 40), visible: el.offsetParent !== null }))
    };
  });
  
  console.log('=== 도구 다음 메뉴들 ===');
  console.log(result.afterTools);
  console.log('\n=== 전환 관련 요소 ===');
  result.allBtns.forEach(item => console.log(item.tag + ' | ' + item.text + ' | visible=' + item.visible));
  
  // Try clicking "도구" and then looking for conversion tracking
  const clicked = await p.evaluate(() => {
    const items = document.querySelectorAll('li, div, a, span');
    for (const el of items) {
      if (el.innerText.trim() === '도구' && el.className.includes('submenu')) {
        el.click();
        return 'clicked 도구 menu';
      }
    }
    // Try any element with text 도구
    for (const el of items) {
      if (el.innerText.trim() === '도구' && el.offsetParent !== null) {
        el.click();
        return 'clicked 도구 (fallback) tag=' + el.tagName;
      }
    }
    return '도구 not found';
  });
  
  console.log('\n클릭 시도:', clicked);
  await p.waitForTimeout(2000);
  
  // After clicking, check what sub-items are visible
  const afterClick = await p.evaluate(() => {
    const items = document.querySelectorAll('li, a, span, div');
    const visible = [];
    items.forEach(el => {
      const t = el.innerText.trim();
      if (t && el.offsetParent !== null && t.includes('전환')) {
        visible.push({ tag: el.tagName, text: t.substring(0, 40) });
      }
    });
    
    // Also check all visible link texts in sidebar area
    const allLinks = document.querySelectorAll('a');
    const sidebarLinks = [];
    allLinks.forEach(a => {
      const t = a.innerText.trim();
      if (t && a.offsetParent !== null && t.length < 20 && t.length > 1) {
        sidebarLinks.push(t);
      }
    });
    
    return { visible, sidebarLinks: [...new Set(sidebarLinks)] };
  });
  
  console.log('\n=== 전환 관련 보이는 요소 ===');
  console.log(JSON.stringify(afterClick.visible));
  console.log('\n=== 사이드바에 보이는 메뉴들 ===');
  console.log(afterClick.sidebarLinks);
  
  await b.close();
})().catch(e => console.log('ERR:' + e.message.substring(0, 300)));

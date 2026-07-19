const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  // 탭 [10] 관리 > 이벤트
  const page = pages[10];
  await page.bringToFront();
  await sleep(3000);
  
  // 데이터 표시 펼치기
  await page.evaluate(() => {
    const els = document.querySelectorAll('a, button, span, div, nav a');
    for (const el of els) {
      if ((el.innerText || '').trim() === '데이터 표시') {
        el.click();
        return;
      }
    }
  });
  await sleep(3000);
  
  console.log('=== 전체 관리 메뉴 ===');
  const menu = await page.evaluate(() => {
    const lines = document.body.innerText.split('\n').filter(l => l.trim());
    const result = [];
    let capture = false;
    for (const l of lines) {
      const t = l.trim();
      if (t === '관리') capture = true;
      if (t === '의견 보내기') break;
      if (capture && t.length < 40 && 
          !['chevron_right','arrow_drop_down','search','help','close','애널리틱스','◀','<'].includes(t) &&
          !t.startsWith('©')) {
        result.push(t);
      }
    }
    return result.slice(0, 35);
  });
  
  menu.forEach((m, i) => console.log(i + ': ' + m));
  
  // '이벤트' 메뉴 찾기
  await page.evaluate(() => {
    const els = document.querySelectorAll('a, button, span, div, nav a');
    for (const el of els) {
      const t = (el.innerText || '').trim();
      if (t === '이벤트') {
        console.log('이벤트 메뉴 발견!');
        el.click();
        return;
      }
    }
    console.log('이벤트 메뉴 없음');
  });
  await sleep(4000);
  
  console.log('\n=== 이벤트 페이지 데이터 ===');
  const data = await page.evaluate(() => {
    const body = document.body.innerText || '';
    const lines = body.split('\n').filter(l => l.trim());
    
    // 이벤트명 패턴 (소문자+언더스코어)
    const eventSet = new Set();
    const numLines = [];
    
    lines.slice(10, 200).forEach(l => {
      const t = l.trim();
      const match = t.match(/^[a-z][a-z_0-9]{3,40}$/);
      if (match && !['chevron_right','arrow_drop_down'].includes(t)) {
        eventSet.add(t);
      }
      if (/^\d+$/.test(t) && t.length < 8) {
        numLines.push(t);
      }
    });
    
    return {
      events: Array.from(eventSet).slice(0, 50),
      numbers: numLines.slice(0, 20),
      lines: lines.slice(15, 80).filter(l => {
        const t = l.trim();
        return t.length > 0 && t.length < 50 && 
               !['chevron_right','arrow_drop_down','search','help','close','애널리틱스'].includes(t);
      })
    };
  });
  
  console.log('\n이벤트명 목록:');
  if (data.events.length > 0) {
    data.events.forEach(e => console.log('  📌 ' + e));
  } else {
    console.log('  (이벤트 목록 없음 or 로딩 안 됨)');
  }
  
  console.log('\n숫자들:', data.numbers.join(', '));
  
  console.log('\n전체 데이터 영역:');
  data.lines.forEach((l, i) => console.log(i + ': ' + l));
  
  await b.close();
})();

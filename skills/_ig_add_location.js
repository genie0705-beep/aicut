// IG — 위치 추가: 서울 검색 + 선택
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/')) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('create 탭 없음'); await b.disconnect(); return; }
  
  console.log('현재:', page.url());
  
  // 1. "위치 추가" 버튼 클릭
  const clicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, div[role="button"]');
    for (const b of btns) {
      const text = b.innerText || '';
      if (text.includes('위치') || text.includes('Location') || text.includes('장소')) {
        b.click();
        return '위치 버튼 클릭됨: ' + text.slice(0, 20);
      }
    }
    return '위치 버튼 없음';
  });
  console.log('1.', clicked);
  await page.waitForTimeout(2000);
  console.log('   이동 후:', page.url());
  
  // 2. 위치 검색 input에 "서울" 입력
  const searched = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input:not([type="file"])');
    for (const inp of inputs) {
      const ph = inp.getAttribute('placeholder') || '';
      if (ph.includes('검색') || ph.includes('Search') || ph.includes('location')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) {
          setter.call(inp, '서울');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return '입력됨: placeholder=' + ph;
      }
    }
    
    // fallback: 첫 번째 텍스트 input
    for (const inp of inputs) {
      if (inp.type === 'text' || inp.type === 'search') {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) {
          setter.call(inp, '서울');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return 'fallback 입력: type=' + inp.type;
      }
    }
    return 'input 못 찾음';
  });
  console.log('2.', searched);
  await page.waitForTimeout(2000);
  
  // 3. 검색 결과에서 "Seoul, South Korea" 선택
  // button 태그 중 innerText에 "Seoul" 포함된 것 찾기
  const selected = await page.evaluate(() => {
    // button 태그
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const t = b.innerText || '';
      if (t.includes('Seoul, South Korea') || t === 'Seoul, South Korea') {
        b.click();
        return 'Seoul, South Korea 선택 (button)';
      }
    }
    
    // 모든 요소
    const all = document.querySelectorAll('div[role="button"], button, a, [role="option"]');
    for (const el of all) {
      const t = el.innerText || '';
      if (t.includes('Seoul, South Korea')) {
        el.click();
        return 'Seoul, South Korea 선택 (role=button)';
      }
    }
    
    // "서울" 검색 결과의 첫 번째 항목
    const items = document.querySelectorAll('[role="button"], button');
    for (const item of items) {
      if (item.innerText.includes('서울')) {
        item.click();
        return '첫 번째 서울 항목 선택';
      }
    }
    
    return '선택 실패';
  });
  console.log('3.', selected);
  await page.waitForTimeout(2000);
  console.log('   이동 후:', page.url());
  
  // 4. 최종 확인
  const screenText = await page.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('4. 화면:', screenText);
  
  await page.screenshot({ path: 'debug_ig_location_done.png', fullPage: true });
  console.log('\n✅ 위치 추가 완료! 공유는 아직 안 했습니다.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

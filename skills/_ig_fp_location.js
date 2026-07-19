// 위치 선택 마무리
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/location/')) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('location 탭 없음'); await b.disconnect(); return; }
  
  console.log('현재:', page.url());
  
  // 서울 검색
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const inp of inputs) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(inp, '서울');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await page.waitForTimeout(2000);
  
  // 모든 요소에서 "Seoul, South Korea" 찾아 클릭
  const selected = await page.evaluate(() => {
    // button 태그
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText === 'Seoul, South Korea') {
        b.click();
        return 'button';
      }
    }
    
    // span > div 등 중첩 구조
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.innerText === 'Seoul, South Korea' && el.children.length === 0) {
        el.click();
        return 'leaf element';
      }
      // 부모가 클릭 가능한지
      if (el.innerText === 'Seoul, South Korea') {
        const parent = el.closest('[role="button"], button, a, [role="option"], div[tabindex]');
        if (parent) { parent.click(); return 'parent: ' + parent.tagName; }
        el.click(); return 'element itself';
      }
    }
    
    return '못 찾음';
  });
  console.log('선택:', selected);
  await page.waitForTimeout(2000);
  console.log('이동:', page.url());
  
  if (!page.url().includes('/details/')) {
    console.log('아직 location 페이지, 다시 시도');
    // 검색 결과의 첫 번째 항목 클릭
    await page.evaluate(() => {
      const items = document.querySelectorAll('[role="button"], button');
      for (const item of items) {
        const t = item.innerText || '';
        // "서울 - Seoul" 또는 "Seoul" 포함
        if (t.includes('Seoul, South Korea') || t === '서울 - Seoul') {
          item.click();
          return;
        }
      }
    });
    await page.waitForTimeout(2000);
    console.log('재시도 후:', page.url());
  }
  
  await page.screenshot({ path: 'debug_ig_fp_location.png', fullPage: true });
  console.log('\n✅ 확인 완료');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

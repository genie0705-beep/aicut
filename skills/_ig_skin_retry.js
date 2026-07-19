// IG 업로드 — 정확한 다음/공유 처리
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com')) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('❌ IG 없음'); await b.disconnect(); return; }
  
  console.log('현재:', page.url());
  const text = await page.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('화면:', text);
  
  // 캡션 다시 확인 - 텍스트에어리어에 값이 있는지
  const captionSet = await page.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    return Array.from(tas).map(t => ({ val: (t.value || '').slice(0, 50), placeholder: t.placeholder }));
  });
  console.log('캡션:', JSON.stringify(captionSet));
  
  // 다음 버튼 2번 클릭
  for (let step = 0; step < 2; step++) {
    console.log(`  다음 버튼 찾기 (${step + 1}차)...`);
    
    // 다양한 방법으로 다음 버튼 찾기
    const clicked = await page.evaluate(() => {
      // div[role="button"] 중 innerText가 "다음"인 것
      const allBtns = document.querySelectorAll('div[role="button"], button, span, a');
      for (const btn of allBtns) {
        if (btn.innerText?.trim() === '다음' || btn.innerText?.trim() === 'Next') {
          btn.click();
          return true;
        }
      }
      
      // SVG 안의 텍스트도 확인
      const spans = document.querySelectorAll('span');
      for (const s of spans) {
        if (s.innerText?.trim() === '다음' || s.innerText?.trim() === 'Next') {
          const parent = s.closest('[role="button"], button, a');
          if (parent) { parent.click(); return true; }
          s.click(); return true;
        }
      }
      return false;
    });
    
    console.log(`  결과: ${clicked}`);
    await page.waitForTimeout(3000);
    
    // 중간 화면 확인
    const screen = await page.evaluate(() => (document.body.innerText || '').slice(0, 100));
    console.log(`  화면: ${screen}`);
  }
  
  // 공유 버튼
  console.log('\n  공유 버튼 찾기...');
  const shared = await page.evaluate(() => {
    const btns = document.querySelectorAll('div[role="button"], button');
    for (const btn of btns) {
      if (btn.innerText?.trim() === '공유' || btn.innerText?.trim() === 'Share') {
        btn.click();
        return true;
      }
    }
    return false;
  });
  console.log(`  공유: ${shared}`);
  
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'debug_ig_skin_done.png', fullPage: true });
  const final = await page.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('\n최종:', final);
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

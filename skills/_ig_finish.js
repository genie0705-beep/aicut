// 현재 상태에서 위치 선택 + 공유 마무리
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
  if (!page) { console.log('❌ IG 탭 없음'); await b.disconnect(); return; }
  
  console.log('현재 URL:', page.url());
  const text = await page.evaluate(() => (document.body.innerText || '').slice(0, 500));
  console.log('현재 화면:', text);
  
  // 위치 검색 결과에서 "서울" 선택 시도
  await page.evaluate(() => {
    // 검색 결과 목록에서 "서울" 항목 찾기
    const items = document.querySelectorAll('[role="button"], [role="option"], div[class]');
    for (const item of items) {
      const text = item.innerText || '';
      // "Seoul, South Korea" 또는 "서울" 찾기
      if (text.trim() === 'Seoul, South Korea' || text.trim() === '서울, 대한민국' || text.includes('Seoul, South Korea')) {
        item.click();
        return;
      }
    }
    
    // 첫 번째 결과 클릭
    const firstResult = document.querySelector('[role="button"]');
    if (firstResult && firstResult.innerText.includes('서울')) {
      firstResult.click();
    }
  });
  
  await page.waitForTimeout(2000);
  
  // "공유" 버튼 클릭
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('div[role="button"], button'));
    for (const btn of btns) {
      if (btn.innerText === '공유' || btn.innerText === 'Share') {
        btn.click();
        return true;
      }
    }
    return false;
  });
  console.log('공유 버튼 클릭:', clicked);
  
  await page.waitForTimeout(5000);
  
  const finalText = await page.evaluate(() => (document.body.innerText || '').slice(0, 300));
  console.log('최종 화면:', finalText);
  
  await page.screenshot({ path: 'debug_ig_final2.png', fullPage: true });
  
  await b.disconnect();
  console.log('\n✅ 완료!');
}

main().catch(e => console.error('❌', e.message));

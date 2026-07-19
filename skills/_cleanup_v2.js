// 직접 컴포넌트 삭제 — JS 이벤트 디스패치 사용
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  // 깨진 컴포넌트 개수 확인
  const info = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return Array.from(comps).map((c, i) => ({
      idx: i,
      id: c.id,
      broken: c.innerText.includes('존재하지 않는 이미지'),
      delBtns: c.querySelectorAll('.se-image-delete-button').length,
      hasImg: !!c.querySelector('img'),
    }));
  });
  console.log('상태:', JSON.stringify(info, null, 2));
  
  // 마지막 3개(idx 6,7,8) 깨진 컴포넌트 삭제
  for (let idx = 8; idx >= 6; idx--) {
    console.log(`\n🗑️ 컴포넌트 ${idx} 삭제 시도...`);
    
    // 컴포넌트 클릭
    const clicked = await page.evaluate((i) => {
      const comps = document.querySelectorAll('.se-component.se-image');
      const c = comps[i];
      if (!c) return '없음';
      
      // 다양한 자식 요소 클릭 시도
      const targets = [
        c.querySelector('.se-section-image'),
        c.querySelector('.se-module-image'),
        c.querySelector('.se-drop-indicator'),
        c.querySelector('.se-image-status-404'),
        c
      ];
      
      for (const t of targets) {
        if (t) {
          t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          t.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          return '클릭: ' + (t.className || t.tagName).slice(0,30);
        }
      }
      return '타겟 없음';
    }, idx);
    console.log('  클릭:', clicked);
    
    await page.waitForTimeout(1000);
    
    // 삭제 버튼 직접 클릭 (각 컴포넌트 내부 버튼)
    const deleted = await page.evaluate((i) => {
      const comps = document.querySelectorAll('.se-component.se-image');
      const c = comps[i];
      if (!c) return false;
      
      const delBtn = c.querySelector('.se-image-delete-button');
      if (delBtn) {
        // React synthetic event 시뮬레이션
        delBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        delBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        delBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return '✅ 딜리트 버튼 클릭됨';
      }
      
      // 키보드 이벤트: Delete 키 전송
      const activeEl = document.activeElement;
      if (activeEl) {
        activeEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
        return 'Delete 키 전송';
      }
      
      return '❌ 버튼/액션 없음';
    }, idx);
    console.log('  삭제:', deleted);
    
    await page.waitForTimeout(2000);
  }
  
  // 결과 확인
  const finalInfo = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return Array.from(comps).map((c, i) => ({
      idx: i,
      id: c.id,
      broken: c.innerText.includes('존재하지 않는 이미지'),
      hasImg: !!c.querySelector('img'),
    }));
  });
  console.log('\n최종:', JSON.stringify(finalInfo, null, 2));
  
  await page.screenshot({ path: 'debug_final_clean.png', fullPage: true });
  
  // 저장
  await page.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('💾 저장');
  
  await page.waitForTimeout(2000);
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

// 불필요한 이미지 컴포넌트 정리
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
  
  // 현재 이미지 상태
  const before = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return Array.from(comps).map((c, i) => ({
      idx: i,
      hasImg: !!c.querySelector('img'),
      broken: c.innerText.includes('존재하지 않는 이미지'),
      imgSrc: c.querySelector('img')?.src?.slice(0,80) || 'none',
    }));
  });
  console.log('정리 전:', JSON.stringify(before, null, 2));
  
  // 깨진 컴포넌트들 뒤에서부터 삭제
  for (let pass = 0; pass < 10; pass++) {
    const deleted = await page.evaluate(() => {
      const comps = document.querySelectorAll('.se-component.se-image');
      // 뒤에서부터 깨진 컴포넌트 찾기
      for (let i = comps.length - 1; i >= 0; i--) {
        const c = comps[i];
        if (!c.querySelector('img') || c.innerText.includes('존재하지 않는 이미지')) {
          // 클릭해서 선택
          const section = c.querySelector('.se-section-image, .se-module-image, .se-drop-indicator');
          if (section) section.click();
          else c.click();
          return { idx: i, found: true };
        }
      }
      return { found: false };
    });
    
    if (!deleted.found) {
      console.log('✅ 모든 깨진 컴포넌트 삭제 완료');
      break;
    }
    
    await page.waitForTimeout(500);
    
    await page.evaluate(() => {
      const delBtn = document.querySelector('.se-image-delete-button');
      if (delBtn) delBtn.click();
      else {
        // 키보드 Delete 키 시도
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
      }
    });
    
    await page.waitForTimeout(1000);
    console.log(`  삭제: 컴포넌트 ${deleted.idx}`);
  }
  
  // 중복 정상 이미지 처리: 처음 5개만 남기고 나머지 정상 이미지 삭제
  const after = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return Array.from(comps).map((c, i) => ({
      idx: i,
      hasImg: !!c.querySelector('img'),
      broken: c.innerText.includes('존재하지 않는 이미지'),
    }));
  });
  console.log('정리 후:', JSON.stringify(after, null, 2));
  
  // 저장
  await page.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('💾 저장 완료');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug_images_clean.png', fullPage: true });
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

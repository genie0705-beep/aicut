// Playwright 실제 click()으로 깨진 컴포넌트 삭제
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
  
  // 1단계: 깨진 컴포넌트 영역 실제 클릭
  // 깨진 컴포넌트는 .se-image-status-404 내부 텍스트 "존재하지 않는 이미지입니다."가 있음
  // 각 깨진 컴포넌트를 찾아서 클릭하고, 나타난 삭제 버튼 클릭
  
  for (let pass = 0; pass < 10; pass++) {
    // 깨진 컴포넌트 찾기
    const componentId = await page.evaluate(() => {
      const comps = document.querySelectorAll('.se-component.se-image');
      for (let i = comps.length - 1; i >= 0; i--) {
        const c = comps[i];
        if (c.innerText.includes('존재하지 않는 이미지')) {
          return c.id;
        }
      }
      return null;
    });
    
    if (!componentId) {
      console.log('✅ 모든 깨진 컴포넌트 삭제 완료');
      break;
    }
    
    console.log(`🗑️ 삭제 대상: ${componentId}`);
    
    // 해당 컴포넌트의 섹션 영역 실제 클릭
    const selector = `#${componentId} .se-section-image, #${componentId} .se-module-image, #${componentId} .se-image-status-404`;
    try {
      await page.click(selector, { timeout: 3000 });
      console.log('  컴포넌트 클릭됨');
    } catch (e) {
      console.log('  섹션 클릭 실패, 전체 클릭 시도');
      await page.click(`#${componentId}`, { timeout: 3000 });
    }
    
    await page.waitForTimeout(1000);
    
    // 페이지에서 삭제 버튼 찾아 클릭
    try {
      // 컴포넌트 내부 delete 버튼
      await page.click(`#${componentId} .se-image-delete-button`, { timeout: 3000 });
      console.log('  ✅ 삭제 버튼 클릭');
    } catch (e) {
      // 혹은 floating toolbar의 delete 버튼
      try {
        await page.click('.se-image-delete-button', { timeout: 3000 });
        console.log('  ✅ floating 삭제 버튼 클릭');
      } catch (e2) {
        console.log('  ❌ 삭제 버튼 찾을 수 없음');
        break;
      }
    }
    
    await page.waitForTimeout(2000);
  }
  
  // 결과 확인
  const finalInfo = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return {
      total: comps.length,
      details: Array.from(comps).map((c, i) => ({
        idx: i, broken: c.innerText.includes('존재하지 않는 이미지'),
        hasImg: !!c.querySelector('img')
      }))
    };
  });
  console.log('\n최종:', JSON.stringify(finalInfo, null, 2));
  
  await page.screenshot({ path: 'debug_final_playwright_click.png', fullPage: true });
  
  // 저장
  const saveBtn = await page.$('.save_btn__bzc5B');
  if (saveBtn) {
    await saveBtn.click();
    console.log('💾 저장');
  }
  
  await page.waitForTimeout(2000);
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

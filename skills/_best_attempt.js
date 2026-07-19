// 최종 시도: 붙여넣기 → 각 깨진 이미지 정확히 교체
const { chromium } = require('playwright');
const path = require('path');
const { TITLE, buildBodyHTML } = require('./_blog_realestate_content.js');

const IMAGE_FILES = [
  'aicut_blog_realestate_main.png',
  'aicut_blog_realestate_card1.png',
  'aicut_blog_realestate_card2.png',
  'aicut_blog_realestate_card3.png',
  'aicut_blog_realestate_cta.png',
];
const WORKSPACE = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 새 탭
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 팝업 처리
  await page.evaluate(() => {
    const popup = document.querySelector('.se-popup-container.__se-pop-layer');
    if (popup) {
      const btn = Array.from(popup.querySelectorAll('button')).find(b => b.innerText.includes('새로 작성'));
      if (btn) btn.click();
    }
  });
  await page.waitForTimeout(2000);
  
  console.log('1️⃣ 제목 입력');
  await page.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, TITLE);
  
  console.log('2️⃣ 본문 HTML 붙여넣기');
  const bodyHTML = buildBodyHTML();
  
  await page.evaluate((html) => {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()], { type: 'text/plain' })
      })
    ]);
  }, bodyHTML);
  await page.waitForTimeout(500);
  
  await page.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (ce) { ce.focus(); }
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(6000);
  
  // 붙여넣기 결과 확인
  const afterPaste = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return {
      total: comps.length,
      ids: Array.from(comps).map(c => c.id),
    };
  });
  console.log(`   이미지 컴포넌트: ${afterPaste.total}개`);
  
  // === 3. 각 이미지 컴포넌트 교체 (순서대로) ===
  console.log('\n3️⃣ 이미지 교체 시작');
  
  for (let i = 0; i < Math.min(IMAGE_FILES.length, afterPaste.total); i++) {
    const compId = afterPaste.ids[i];
    const imgFile = path.join(WORKSPACE, IMAGE_FILES[i]);
    console.log(`\n   [${i+1}/5] ${IMAGE_FILES[i]} (id=${compId})`);
    
    // (A) 이미지 컴포넌트 내 클릭 가능 영역 찾아서 Playwright click
    // .se-section-image 안의 .se-module-image 또는 .se-image-status-404
    const selectors = [
      `#${compId} .se-section-image`,
      `#${compId} .se-module-image`,
      `#${compId} .se-image-status-404`,
      `#${compId}`,
    ];
    
    let clicked = false;
    for (const sel of selectors) {
      try {
        await page.click(sel, { timeout: 2000 });
        clicked = true;
        console.log(`      ✅ 클릭: ${sel.slice(0, 50)}`);
        break;
      } catch (e) {
        // continue
      }
    }
    
    if (!clicked) {
      console.log('      ❌ 컴포넌트 클릭 실패, skip');
      continue;
    }
    
    await page.waitForTimeout(1000);
    
    // (B) 교체 버튼 찾아서 클릭
    const fcPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
    
    let replaceClicked = false;
    try {
      await page.click('.se-image-replacement-toolbar-button', { timeout: 3000 });
      replaceClicked = true;
      console.log('      ✅ 교체 버튼 클릭');
    } catch (e) {
      console.log('      ❌ 교체 버튼 없음');
    }
    
    await page.waitForTimeout(500);
    
    // (C) file chooser 처리
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(imgFile);
      console.log('      ✅ 파일 업로드됨');
      await page.waitForTimeout(4000);
      
      // 상태 확인
      const status = await page.evaluate((id) => {
        const c = document.getElementById(id);
        if (!c) return '컴포넌트 없음';
        return c.innerText.includes('존재하지 않는 이미지') ? '⚠️ 404' : '✅ 정상';
      }, compId);
      console.log(`      상태: ${status}`);
    } else {
      console.log('      ❌ file chooser 없음');
    }
    
    // (D) 다음 이미지로 넘어가기 전에 다른 영역 클릭 (선택 해제)
    if (i < Math.min(IMAGE_FILES.length, afterPaste.total) - 1) {
      try {
        await page.click('.se-component.se-text:first-child', { timeout: 2000 });
      } catch (e) {}
      await page.waitForTimeout(500);
    }
  }
  
  // === 4. 최종 확인 ===
  console.log('\n4️⃣ 최종 확인');
  const final = await page.evaluate(() => {
    const imgs = document.querySelectorAll('.se-component.se-image');
    return {
      total: imgs.length,
      ok: Array.from(imgs).filter(c => !!c.querySelector('img')).length,
      broken: Array.from(imgs).filter(c => c.innerText.includes('존재하지 않는 이미지')).length,
    };
  });
  console.log(`   ${JSON.stringify(final)}`);
  
  // 저장
  await page.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('💾 저장 완료');
  
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'debug_final_best.png', fullPage: true });
  
  await b.disconnect();
  console.log('\n✅ 완료! 브라우저 확인 바랍니다.');
}

main().catch(e => console.error('❌', e.message));

// SE4 재작성 — 제목 + 본문 + 이미지
const { chromium } = require('playwright');
const path = require('path');
const { TITLE, buildBodyHTML } = require('./_blog_realestate_content.js');

const IMAGES = [
  { file: 'aicut_blog_realestate_main.png' },
  { file: 'aicut_blog_realestate_card1.png' },
  { file: 'aicut_blog_realestate_card2.png' },
  { file: 'aicut_blog_realestate_card3.png' },
  { file: 'aicut_blog_realestate_cta.png' },
];
const WORKSPACE = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      page = p;
      console.log('기존 postwrite 탭 사용');
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  // === 1. 제목 입력 ===
  console.log('📝 제목 입력...');
  const titleOk = await page.evaluate((t) => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentTitle(t);
      return SmartEditor._editors['blogpc001'].getDocumentTitle();
    } catch (e) { return '❌ ' + e.message; }
  }, TITLE);
  console.log('  결과:', titleOk);
  
  // === 2. 본문 HTML 클립보드 복사 후 붙여넣기 ===
  console.log('📋 본문 HTML 준비...');
  const bodyHTML = buildBodyHTML();
  
  // 클립보드 복사
  await page.evaluate((html) => {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()], { type: 'text/plain' })
      })
    ]);
  }, bodyHTML);
  console.log('  ✅ 클립보드 복사 완료');
  await page.waitForTimeout(500);
  
  // 에디터 본문 영역 클릭 후 Ctrl+V
  console.log('⌨️ Ctrl+V...');
  await page.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (ce) {
      ce.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(ce);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(5000);
  
  // === 3. 확인 ===
  const pasteCheck = await page.evaluate(() => {
    const seContent = document.querySelector('.se-content.__se-scroll-target');
    if (!seContent) return 'no content';
    return {
      textLen: (seContent.innerText || '').length,
      imgComps: document.querySelectorAll('.se-component.se-image').length,
    };
  });
  console.log('📊 붙여넣기 결과:', JSON.stringify(pasteCheck));
  
  // === 4. 이미지 업로드 ===
  console.log('\n📸 이미지 업로드 시작...');
  
  const imgComps = await page.evaluate(() => document.querySelectorAll('.se-component.se-image').length);
  console.log(`  깨진 이미지 컴포넌트: ${imgComps}개`);
  
  for (let i = 0; i < Math.min(IMAGES.length, imgComps); i++) {
    const imgFile = path.join(WORKSPACE, IMAGES[i].file);
    console.log(`\n  [${i+1}/${IMAGES.length}] ${IMAGES[i].file}`);
    
    // 해당 이미지 컴포넌트의 섹션 영역을 Playwright click()으로 클릭
    const compSelector = `.se-component.se-image:nth-child(${i + 1}) .se-section-image`;
    
    try {
      await page.click(compSelector, { timeout: 3000 });
      console.log('    ✅ 컴포넌트 클릭');
    } catch (e) {
      // fallback: 이미지 404 영역 클릭
      try {
        const fallback = `.se-component.se-image:nth-child(${i + 1})`;
        await page.click(fallback, { timeout: 3000 });
        console.log('    ✅ fallback 클릭');
      } catch (e2) {
        console.log('    ❌ 컴포넌트 클릭 실패');
        continue;
      }
    }
    
    await page.waitForTimeout(800);
    
    // file chooser 대기 + 교체 버튼 클릭
    const fcPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
    
    try {
      await page.click('.se-image-replacement-toolbar-button', { timeout: 5000 });
      console.log('    ✅ 교체 버튼 클릭');
    } catch (e) {
      console.log('    ❌ 교체 버튼 없음');
      continue;
    }
    
    await page.waitForTimeout(500);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(imgFile);
      console.log('    ✅ 파일 업로드');
      await page.waitForTimeout(3000);
    } else {
      console.log('    ❌ file chooser 없음');
    }
  }
  
  // === 5. 최종 확인 ===
  const final = await page.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return {
      total: comps.length,
      ok: Array.from(comps).filter(c => !!c.querySelector('img')).length,
      broken: Array.from(comps).filter(c => c.innerText.includes('존재하지 않는 이미지')).length,
    };
  });
  console.log('\n📊 최종:', JSON.stringify(final));
  
  // 저장
  await page.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('💾 저장');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'debug_rewrite_final.png', fullPage: true });
  
  await b.disconnect();
  console.log('\n✅ 완료! 브라우저 확인 바랍니다.');
}

main().catch(e => console.error('❌', e.message));

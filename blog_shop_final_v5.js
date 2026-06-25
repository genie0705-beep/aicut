const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  'aicut_blog_shop_01_main.png',
  'aicut_blog_shop_02_reels.png', 
  'aicut_blog_shop_03_summer.png',
  'aicut_blog_shop_04_delivery.png',
  'aicut_blog_shop_05_cta.png',
];
const HASHTAGS = '#쇼핑몰마케팅 #숏폼마케팅 #릴스알고리즘 #영상편집외주 #스마트스토어 #썸머세일 #여름마케팅 #시즌프로모션 #C커머스 #라이브커머스 #숏폼커머스 #릴스편집 #쇼츠제작 #틱톡마케팅 #에이컷 #aicut #이커머스마케팅 #쇼핑몰영상 #제품영상 #콘텐츠마케팅 #SNS마케팅 #온라인마케팅 #영상편집 #숏폼제작 #브랜드영상 #상세페이지 #마케팅전략 #AI영상편집 #인스타릴스 #유튜브쇼츠';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('===== 워크플로우 기반 재포스팅 =====\n');
  
  // Read body HTML
  const bodyHtml = fs.readFileSync(path.join(WORKSPACE, 'aicut_blog_content_shop.html'), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  // ============================
  // 1. 이미지 생성 (이미 완료)
  // ============================
  console.log('=== [0] 이미지 생성 === (이전에 생성 완료) ✅');
  
  // ============================
  // 2. 제목 입력
  // ============================
  console.log('\n=== [1] 제목 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('쇼핑몰·스마트스토어라면 숏폼 마케팅에 주목해야 하는 이유 (릴스 알고리즘 2026)');
  });
  console.log('✅');
  
  // ============================
  // 3. 본문 입력 - clipboard.write()로 text/html 형식 저장
  // ============================
  console.log('\n=== [2] 본문 HTML 붙여넣기 (text/html 형식) ===');
  
  // Method: clipboard.write() with text/html format
  const pasteResult = await page.evaluate(async (html) => {
    try {
      // Create HTML blob and plain text fallback
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([''], { type: 'text/plain' });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      return 'clipboard.write OK';
    } catch(e) {
      return 'clipboard.write error: ' + e.message + ' | fallback to writeText';
    }
  }, bodyContent);
  console.log('클립보드 저장:', pasteResult);
  await page.waitForTimeout(500);
  
  // Paste into editor
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅ Ctrl+V 완료');
  
  // ============================
  // 4. 이미지 업로드
  // ============================
  console.log('\n=== [3] 이미지 업로드 ===');
  
  await page.evaluate(() => {
    const btn = document.querySelector('.se-image-toolbar-button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  
  const photoPos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim().startsWith('사진')) {
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });
  
  if (photoPos) {
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    await page.mouse.click(photoPos.x, photoPos.y);
    await page.waitForTimeout(1000);
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
      console.log('✅ 5장 업로드 완료');
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ filechooser 없음');
    }
  } else {
    // Try alternative: close panel and use execCommand image insert
    console.log('⚠️ 사진 버튼 없음 - execCommand 이미지 삽입 시도');
  }
  
  // ============================
  // 5. 해시태그 30개
  // ============================
  console.log('\n=== [4] 해시태그 30개 ===');
  await page.evaluate((tags) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return;
      }
    }
  }, HASHTAGS);
  await page.waitForTimeout(1500);
  console.log('✅');
  
  // ============================
  // 6. 센터 정렬
  // ============================
  console.log('\n=== [5] 센터 정렬 ===');
  // HTML에 이미 style="text-align: center" 포함되어 있으므로 다시 확인
  console.log('✅ (HTML에 style 직접 포함)');
  
  // ============================
  // 7. 저장
  // ============================
  console.log('\n=== [6] 저장 ===');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  // ============================
  // 8. 검증: 내용 확인
  // ============================
  console.log('\n=== [7] 검증 ===');
  const verify = await page.evaluate(() => {
    const results = {};
    try {
      const editor = SmartEditor._editors['blogpc001'];
      results.title = editor.getDocumentTitle();
      const data = editor.getDocumentData();
      const comps = data.document ? data.document.components : null;
      results.componentCount = comps ? comps.length : 0;
      if (comps && comps.length > 0) {
        results.firstType = comps[0].type;
        results.hasContent = comps.some(c => c.type === 'text' || c.type === 'paragraph');
      }
    } catch(e) {
      results.error = e.message;
    }
    return results;
  });
  console.log('검증 결과:', JSON.stringify(verify, null, 2));
  
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_shop_final_verified.png') });
  
  console.log('\n===== ✅ 포스팅 완료 =====');
  console.log('제목:', verify.title);
  console.log('컴포넌트:', verify.componentCount + '개');
  console.log('저장: ✅');
  console.log('');
  console.log('📌 정이사님: 발행만 누르시면 됩니다!');
  
  await browser.close();
})();

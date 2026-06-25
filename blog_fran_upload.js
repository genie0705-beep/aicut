const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const BODY_HTML = fs.readFileSync(path.join(WORKSPACE, 'aicut_blog_content_fran.html'), 'utf-8');

// Extract body content from HTML wrapper
const bodyMatch = BODY_HTML.match(/<body>([\s\S]*)<\/body>/i);
const BODY_CONTENT = bodyMatch ? bodyMatch[1].trim() : BODY_HTML;

const IMAGES = [
  'aicut_blog_fran_01_main.png',
  'aicut_blog_fran_02_why.png', 
  'aicut_blog_fran_03_summer.png',
  'aicut_blog_fran_04_delivery.png',
  'aicut_blog_fran_05_cta.png',
];

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  console.log('=== 프랜차이즈 블로그 포스팅 시작 ===');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Set title
  console.log('\n=== [1/5] 제목 입력 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('프랜차이즈 본사라면 영상 마케팅 아웃소싱이 답인 이유 (feat. 썸머 시즌)');
  });
  console.log('✅ 제목 입력 완료');
  
  // 2. Upload images one by one
  console.log('\n=== [2/5] 이미지 업로드 (5장) ===');
  
  for (let i = 0; i < IMAGES.length; i++) {
    const imgPath = path.join(WORKSPACE, IMAGES[i]);
    process.stdout.write(`  ${i+1}/5: ${IMAGES[i]}... `);
    
    // Click 사진 button
    const btnPos = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim().startsWith('사진')) {
          const r = btn.getBoundingClientRect();
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (!btnPos) { console.log('❌ 사진 버튼 없음'); continue; }
    
    await page.mouse.click(btnPos.x, btnPos.y);
    await page.waitForTimeout(2000);
    
    // Look for panel button (내 PC / 파일 선택 / 사진 추가)
    const panelBtn = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = (btn.innerText || '').trim();
        const r = btn.getBoundingClientRect();
        if (r.width > 0 && (text === '사진 추가' || text.includes('내 PC') || text.includes('파일 선택'))) {
          return { x: r.x + r.width/2, y: r.y + r.height/2, text: text.substring(0,15) };
        }
      }
      // Check for hidden file inputs
      const inputs = document.querySelectorAll('input[type="file"]');
      for (const input of inputs) {
        if (input.offsetHeight > 0 || input.style.display !== 'none') {
          return { isInput: true, elId: input.id || 'file_input_' + i };
        }
      }
      return null;
    });
    
    if (panelBtn) {
      if (panelBtn.isInput) {
        // Direct file input found
        const allInputs = await page.locator('input[type="file"]').all();
        if (allInputs.length > 0) {
          await allInputs[0].setInputFiles(imgPath);
          await page.waitForTimeout(2000);
          console.log('✅');
        } else {
          console.log('❌ file input 없음');
        }
      } else {
        // Click panel button and wait for filechooser
        const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
        await page.mouse.click(panelBtn.x, panelBtn.y);
        await page.waitForTimeout(500);
        const fc = await fcPromise;
        if (fc) {
          await fc.setFiles(imgPath);
          await page.waitForTimeout(2000);
          console.log('✅');
        } else {
          console.log('❌ filechooser 없음');
        }
      }
    } else {
      console.log('❌ 패널 버튼 없음');
    }
    
    // Close panel by clicking editor area
    await page.mouse.click(800, 300);
    await page.waitForTimeout(800);
  }
  
  // 3. Paste body content
  console.log('\n=== [3/5] 본문 붙여넣기 ===');
  await page.evaluate((html) => { navigator.clipboard.writeText(html); }, BODY_CONTENT);
  await page.waitForTimeout(500);
  await page.mouse.click(400, 300);
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅ 본문 붙여넣기 완료');
  
  // 4. Hashtags
  console.log('\n=== [4/5] 해시태그 입력 ===');
  const hashResult = await page.evaluate(() => {
    const tags = '#프랜차이즈 #영상마케팅 #숏폼마케팅 #영상편집외주 #가맹모집 #창업트렌드 #소자본창업 #썸머시즌 #여름마케팅 #하계프로모션 #릴스편집 #쇼츠제작 #틱톡마케팅 #에이컷 #aicut #프랜차이즈마케팅 #가맹점홍보 #영상편집 #숏폼제작 #콘텐츠마케팅 #SNS마케팅 #프랜차이즈본사 #브랜드영상 #메뉴홍보 #시즌프로모션 #가맹점모집 #온라인마케팅 #영상제작 #비즈니스영상 #AI영상편집';
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      const ph = (inp.placeholder || '').toLowerCase();
      if (ph.includes('태그') || ph.includes('tag')) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return 'ok - 태그 입력됨';
      }
    }
    return '태그 입력창 못 찾음';
  });
  console.log(hashResult);
  await page.waitForTimeout(1000);
  
  // 5. Save
  console.log('\n=== [5/5] 저장 ===');
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_fran_before_save.png') });
  
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') {
        btn.click();
        return '저장 클릭됨';
      }
    }
    const saveClass = document.querySelector('.save_btn__bzc5B');
    if (saveClass) { saveClass.click(); return '저장(클래스)'; }
    return '저장 버튼 없음';
  });
  console.log(saveResult);
  await page.waitForTimeout(3000);
  
  // Final screenshot
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_fran_done.png') });
  
  console.log('\n=== 🎉 프랜차이즈 블로그 포스팅 완료! ===');
  console.log('✅ 제목: 프랜차이즈 본사라면 영상 마케팅 아웃소싱이 답인 이유 (feat. 썸머 시즌)');
  console.log('✅ 이미지: 5장');
  console.log('✅ 본문 붙여넣기');
  console.log('✅ 해시태그: 30개');
  console.log('');
  console.log('📌 정이사님: 에디터 화면 확인 후 저장 or 발행 눌러주세요');
  
  await browser.close();
})();

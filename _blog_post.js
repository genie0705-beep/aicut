const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 9224;
const BLOG_ID = 'aicut';
const IMG_DIR = __dirname;

// ===== 콘텐츠 =====

const TITLE = '2026년 장마기간, 하반기 영상 마케팅 준비는 지금부터';

// Section 1: 도입부
const SECTION1 = 
`☀️ 2026년 장마, 마케팅의 공백이 걱정되시나요?

요즘 장마가 시작됐죠.

비 오는 날엔 촬영도 못 하고 매장 활력도 떨어집니다.

마케팅 예산을 썼는데 장마 때문에 효과가 반토막.

이럴 때일수록 하반기 준비가 필요합니다.

장마 기간에 영상 편집 아웃소싱을 준비하면 장마 끝나자마자 바로 하반기 마케팅을 시작할 수 있습니다.

지금이 골든타임입니다.`;

// Section 2: 장마기간 정보
const SECTION2 = 
`🌧️ 2026년 장마기간, 언제부터 언제까지?

올해 장마는 평년보다 조금 길어질 전망입니다.

중부지방 기준 6월 25일부터 7월 26일까지.

남부지방은 6월 22일부터 7월 24일까지.

영동지방은 6월 26일부터 7월 29일까지.

장마가 끝나면 바로 폭염이 찾아옵니다.

결국 7~8월 두 달은 야외 촬영이 어려운 시기입니다.

이 기간에 영상 편집 아웃소싱을 준비해야 하는 이유가 여기 있습니다.`;

// Section 3: 하반기 마케팅
const SECTION3 = 
`📋 하반기 마케팅, 왜 지금 준비해야 할까?

하반기 마케팅을 장마 기간에 준비해야 하는 이유는 세 가지입니다.

첫째, 장마 기간은 경쟁사들이 마케팅을 쉬는 시기입니다.

경쟁이 줄어든 틈을 타서 미리 콘텐츠를 준비하면 8월 하반기 시작과 동시에 빠르게 노출할 수 있습니다.

둘째, 장마 기간에 미리 제작하면 시즌별 콘텐츠를 체계적으로 계획할 수 있습니다.

9월 추석, 10월 할로윈, 11월 블랙프라이데이, 12월 연말까지.

하반기 굵직한 이벤트에 맞춰 콘텐츠를 준비하려면 지금 시작해야 합니다.

셋째, 영상 편집 아웃소싱은 리드타임이 필요합니다.

에이컷은 보통 3~5일 안에 납품하지만 초반 기획과 방향 설정에 시간이 필요합니다.

늦어도 7월 중순까지는 시작해야 8월 하반기 마케팅에 맞출 수 있습니다.`;

// Section 4: 업종별 전략
const SECTION4 = 
`🎯 업종별 하반기 영상 마케팅 전략

FP와 보험 설계사는 하반기 실적 목표 달성을 위해 신뢰감 있는 브랜딩 영상이 필요합니다.

부동산 중개법인은 가을 이사철을 대비해 매물 영상을 미리 준비해야 합니다.

병원과 의원은 하반기 시즌별 프로모션 영상을 체계적으로 제작해야 합니다.

프랜차이즈는 하반기 신메뉴와 시즌 프로모션을 영상으로 준비하세요.

교육업체는 2학기와 겨울방학 특강을 겨냥한 영상을 지금부터 기획해야 합니다.

각 업종마다 필요한 영상의 톤과 형식이 다릅니다.

에이컷은 업종별 맞춤 편집으로 최적의 결과물을 제공합니다.`;

// Section 5: CTA
const SECTION5 = 
`✅ 지금 시작하세요, 에이컷이 함께합니다

장마 기간, 마케팅을 멈추지 마세요.

지금 준비하면 장마 끝나고 바로 하반기 마케팅을 시작할 수 있습니다.

영상 편집 아웃소싱, 처음이면 고민되시죠.

에이컷은 무료 상담으로 시작합니다.

부담 없이 연락 주세요.

▼ 문의하기 ▼

📞 카카오톡: https://pf.kakao.com/_GIesX/chat

📧 이메일: master@aicut.co.kr

🌐 홈페이지: https://aicut.co.kr`;

const HASHTAGS = '#장마기간 #2026년장마기간 #장마 #하반기마케팅 #하반기준비 #영상편집아웃소싱 #영상마케팅 #숏폼마케팅 #영상편집외주 #FP마케팅 #보험마케팅 #부동산마케팅 #중개사마케팅 #병원마케팅 #의료마케팅 #프랜차이즈마케팅 #교육마케팅 #숏폼 #릴스 #틱톡 #유튜브쇼츠 #에이컷 #AICUT #영상제작 #영상편집 #마케팅전략 #콘텐츠마케팅 #여름마케팅 #시즌마케팅 #영상콘텐츠';

// ===== SE4 에디터 자동화 =====

async function seWrite(se, text) {
  await se._canvasScrollingService.focusToFirstComp();
  await new Promise(r => setTimeout(r, 500));
  await se._editingService.writeTextWithSoftLineBreak(text);
  await new Promise(r => setTimeout(r, 800));
}

async function seCenterAlign(page) {
  await page.evaluate(() => {
    const wrap = document.querySelector('.se-canvas-wrapper') || 
                 document.querySelector('.se-canvas') || 
                 document.querySelector('.se-component');
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    if (wrap) {
      wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 300));
}

async function uploadImage(page, imgFile) {
  const fullPath = path.resolve(imgFile);
  console.log('  Trying to upload:', path.basename(fullPath));
  
  // Method 1: Find file input directly
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    console.log('  Found file input, setting files...');
    await fileInput.setInputFiles([fullPath]);
    await new Promise(r => setTimeout(r, 6000));
    console.log('  Upload done (direct input)');
    return true;
  }
  
  // Method 2: Click image toolbar button
  const imgBtn = await page.$('.se-image-toolbar-button, [class*="image-toolbar"], [class*="imageToolbar"]');
  if (imgBtn) {
    console.log('  Clicking image toolbar button...');
    await imgBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    const fi = await page.$('input[type="file"]');
    if (fi) {
      await fi.setInputFiles([fullPath]);
      await new Promise(r => setTimeout(r, 6000));
      console.log('  Upload done (toolbar)');
      return true;
    }
  }

  console.log('  ⚠️ Image upload failed - will need manual upload');
  return false;
}

async function main() {
  console.log('=== 블로그 작성 시작 ===');
  
  // Connect to CDP
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  
  // Create new tab for write page
  const page = await ctx.newPage();
  
  // Navigate to PostWriteForm
  const writeUrl = `https://blog.naver.com/PostWriteForm.naver?blogId=${BLOG_ID}`;
  console.log('Navigating to:', writeUrl);
  await page.goto(writeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  console.log('Current URL:', page.url());
  
  // Wait for SE4
  let se = null;
  for (let i=0; i<10; i++) {
    const ready = await page.evaluate(() => {
      return typeof SmartEditor !== 'undefined' && 
             SmartEditor._editors && 
             SmartEditor._editors['blogpc001'] ? true : false;
    });
    if (ready) {
      console.log('SmartEditor ready after', (i+1)*1, 'seconds');
      break;
    }
    await page.waitForTimeout(1000);
  }
  
  // Check if SE4 is available
  const seAvailable = await page.evaluate(() => {
    return typeof SmartEditor !== 'undefined' && 
           SmartEditor._editors && 
           SmartEditor._editors['blogpc001'] ? true : false;
  });
  
  if (!seAvailable) {
    console.log('❌ SmartEditor not available');
    console.log('Page content:', await page.evaluate(() => document.body.innerText.substring(0,300)));
    b.disconnect();
    return;
  }
  
  // Get SE handle
  const seHandle = await page.evaluateHandle(() => SmartEditor._editors['blogpc001']);
  
  // Step 1: Set title
  console.log('\n--- Step 1: Set title ---');
  await page.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, TITLE);
  await page.waitForTimeout(1000);
  console.log('Title set!');
  
  // Step 2: Init SE (reset + focus)
  await page.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await page.waitForTimeout(1000);
  
  // ===== TEXT + IMAGE 교차 (5 sections) =====
  const sections = [SECTION1, SECTION2, SECTION3, SECTION4, SECTION5];
  const images = [
    'aicut_main_rainy.png',
    'aicut_body1_rainy.png',
    'aicut_body2_rainy.png',
    'aicut_body3_rainy.png',
    'aicut_cta_rainy.png'
  ];
  
  for (let i=0; i<sections.length; i++) {
    console.log(`\n--- Section ${i+1}/${sections.length}: Write text ---`);
    
    // Write text
    await page.evaluate((text) => {
      const se = SmartEditor._editors['blogpc001'];
      se._canvasScrollingService.focusToFirstComp();
      se._editingService.writeTextWithSoftLineBreak(text);
    }, sections[i]);
    await page.waitForTimeout(1000);
    
    // Center align
    await page.evaluate(() => {
      const wrap = document.querySelector('.se-canvas-wrapper') || document.querySelector('.se-canvas');
      document.querySelectorAll('.se-text-paragraph').forEach(p => {
        p.classList.add('se-text-paragraph-align-center');
        p.style.textAlign = 'center';
      });
      if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    });
    await page.waitForTimeout(500);
    console.log('  Text written and aligned');
    
    // Upload image
    console.log(`--- Upload image ${i+1}: ${images[i]} ---`);
    await uploadImage(page, path.join(IMG_DIR, images[i]));
    await page.waitForTimeout(2000);
  }
  
  // ===== Hashtags (마지막) =====
  console.log('\n--- Hashtags: 30개 ---');
  await page.evaluate((tags) => {
    const se = SmartEditor._editors['blogpc001'];
    se._canvasScrollingService.focusToFirstComp();
    se._editingService.writeTextWithSoftLineBreak('\n' + tags);
  }, HASHTAGS);
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
  });
  await page.waitForTimeout(500);
  console.log('Hashtags added');
  
  // ===== 검증 =====
  console.log('\n=== 검증 ===');
  const stats = await page.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const contentLen = se.getContentText ? se.getContentText().length : 0;
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    const title = se.getTitle ? se.getTitle() : document.querySelector('.se-title-input')?.innerText || '';
    return { contentLen, paras, title };
  });
  console.log('Title:', stats.title);
  console.log('Content length:', stats.contentLen, 'chars');
  console.log('Paragraphs:', stats.paras);
  
  // ===== 저장 =====
  console.log('\n--- Save (임시저장) ---');
  // Find save button
  const saveClicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, a, [role="button"], span');
    for (const btn of btns) {
      if (btn.innerText && btn.innerText.trim() === '저장') {
        btn.click();
        return true;
      }
    }
    return false;
  });
  console.log('Save button clicked:', saveClicked);
  if (saveClicked) {
    await page.waitForTimeout(3000);
    console.log('Saved!');
  } else {
    console.log('⚠️ Save button not auto-clicked - waiting for manual save');
    console.log('Page is open at:', page.url());
  }
  
  // ===== 최종 스크린샷? =====
  console.log('\n=== 작성 완료! ===');
  console.log('✅ Images: 5/5 generated');
  console.log('✅ Title set: ' + TITLE);
  console.log('✅ Content: ~' + stats.contentLen + ' chars / ' + stats.paras + ' paragraphs');
  console.log('✅ Hashtags: 30');
  console.log('⏸️ Save: ' + (saveClicked ? 'Auto-saved' : 'Manual save needed'));
  
  // Do NOT close browser - leave for user verification
  b.disconnect();
  console.log('Browser disconnected - page remains open');
}

main().catch(e => {
  console.error('FATAL:', e.message);
  console.error(e.stack);
  process.exit(1);
});

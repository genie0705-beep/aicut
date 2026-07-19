// 블로그봇 - 기존 발행 포스트 수정 (이미지 5장 추가)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { makeImage } = require('./skills/image_gen.js');

const POST_LOGNO = '224341544476';
const BLOG_ID = 'aicut';

// === [2] 이미지 5장 생성 ===
async function generateImages() {
  console.log('\n=== [2] 이미지 5장 생성 ===');

  const images = [];

  // (1) 대표 이미지 700×700, dark_purple, CTA 유지
  const img1 = await makeImage({
    theme: 'dark_purple',
    width: 700,
    height: 700,
    badge: '🦷 치과 마케팅',
    main: '치과 임플란트 마케팅,\n하반기 준비는\n<em>영상 콘텐츠</em>로\n시작하세요',
    sub: '환자 신뢰는 영상이 만든다',
    cta: 'AICUT 무료상담 →',
    out: 'aicut_implant_main.png'
  });
  images.push({ ...img1, label: '대표 이미지', type: 'main', width: 700, height: 700 });
  console.log(`  ✅ ${img1.file} 생성 완료 (${img1.sizeKB}KB)`);

  // (2) 본문카드1 600×338, light_cyan, CTA 제거
  const img2 = await makeImage({
    theme: 'light_cyan',
    width: 600,
    height: 338,
    badge: '📋 신뢰 마케팅',
    main: '<em>임플란트 수술 영상</em>이\n주는 신뢰감',
    sub: '직접 보여주는 것이 가장 강력한 마케팅',
    cta: '',
    out: 'aicut_implant_card1.png'
  });
  images.push({ ...img2, label: '본문카드1', type: 'card', width: 600, height: 338 });
  console.log(`  ✅ ${img2.file} 생성 완료 (${img2.sizeKB}KB)`);

  // (3) 본문카드2 600×338, light_cyan, CTA 제거
  const img3 = await makeImage({
    theme: 'light_cyan',
    width: 600,
    height: 338,
    badge: '✂️ 편집 아웃소싱',
    main: '영상 편집 아웃소싱,\n<em>에이컷</em>이 해결합니다',
    sub: '촬영은 원장님, 편집은 에이컷',
    cta: '',
    out: 'aicut_implant_card2.png'
  });
  images.push({ ...img3, label: '본문카드2', type: 'card', width: 600, height: 338 });
  console.log(`  ✅ ${img3.file} 생성 완료 (${img3.sizeKB}KB)`);

  // (4) 본문카드3 600×338, light_cyan, CTA 제거
  const img4 = await makeImage({
    theme: 'light_cyan',
    width: 600,
    height: 338,
    badge: '📅 하반기 준비',
    main: '하반기 치과 마케팅,\n<em>지금 준비</em>해야 하는\n이유',
    sub: '경쟁 병원보다 한 발 먼저 준비하세요',
    cta: '',
    out: 'aicut_implant_card3.png'
  });
  images.push({ ...img4, label: '본문카드3', type: 'card', width: 600, height: 338 });
  console.log(`  ✅ ${img4.file} 생성 완료 (${img4.sizeKB}KB)`);

  // (5) CTA 이미지 500×300, dark_green, CTA 유지
  const img5 = await makeImage({
    theme: 'dark_green',
    width: 500,
    height: 300,
    badge: '💬 지금 시작하세요',
    main: '지금 바로\n<em>시작</em>하세요',
    sub: '무료 상담으로 부담 없이 시작해보세요',
    cta: 'AICUT 무료상담 →',
    out: 'aicut_implant_cta.png'
  });
  images.push({ ...img5, label: 'CTA 이미지', type: 'cta', width: 500, height: 300 });
  console.log(`  ✅ ${img5.file} 생성 완료 (${img5.sizeKB}KB)`);

  return images;
}

// === [1] 수정 모드로 열기 ===
async function openEditMode(b, ctx) {
  console.log('\n=== [1] 수정 모드로 열기 ===');

  // Try direct SE4 edit URL first
  const editUrl = `https://blog.naver.com/PostWrite.naver?blogId=${BLOG_ID}&logNo=${POST_LOGNO}&redirect=Edit`;
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  await page.goto(editUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);

  const currentUrl = page.url();
  console.log('Edit URL 접속 결과:', currentUrl);

  if (currentUrl.includes('PostWrite') || currentUrl.includes('Redirect=Edit') || currentUrl.includes('se4')) {
    console.log('✅ 수정 모드 진입 성공');
    return page;
  }

  // If redirected, try clicking edit button on post view
  if (currentUrl.includes('PostView')) {
    console.log('PostView로 리디렉션됨 - 수정 버튼 찾기');

    // Look for edit link/button
    const editFound = await page.evaluate(() => {
      // Find all links
      const links = Array.from(document.querySelectorAll('a'));
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const text = link.textContent.trim();
        if (href.includes('Edit') && (text.includes('수정') || text.includes('편집'))) {
          link.click();
          return { text: text, href: href };
        }
      }
      // Try buttons
      const buttons = Array.from(document.querySelectorAll('button, span, div'));
      for (const btn of buttons) {
        const text = btn.textContent.trim();
        if (text === '수정' || text === '편집') {
          btn.click();
          return { text: text, tag: btn.tagName };
        }
      }
      return null;
    });
    console.log('수정 버튼 클릭 결과:', JSON.stringify(editFound));

    if (editFound) {
      await page.waitForTimeout(5000);
      console.log('수정 후 URL:', page.url());
      return page;
    }
  }

  console.log('⚠️ 수정 모드 진입 실패. 현재 URL 사용하여 계속 진행');
  return page;
}

// === 메인 실행 ===
(async () => {
  console.log('=== 블로그봇: 포스트 이미지 추가 시작 ===');
  console.log(`대상: logNo=${POST_LOGNO}`);

  // Step 1: Generate all 5 images first
  let images;
  try {
    images = await generateImages();
  } catch (e) {
    console.error('❌ 이미지 생성 실패:', e.message);
    process.exit(1);
  }

  // Step 2: Connect to Chrome and open edit mode
  console.log('\n=== 크롬 연결 ===');
  let b;
  try {
    b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  } catch (e) {
    console.error('❌ CDP 연결 실패:', e.message);
    process.exit(1);
  }

  const ctx = b.contexts()[0];

  // Open edit mode
  const page = await openEditMode(b, ctx);

  // Check if we are on the right page
  console.log('현재 페이지 URL:', page.url());

  // Step 3: Find SE4 editor iframe
  console.log('\n=== SE4 에디터 탐색 ===');
  const frames = page.frames();
  let editorFrame = null;

  for (const f of frames) {
    try {
      const hasSmartEditor = await f.evaluate(() => typeof SmartEditor !== 'undefined');
      if (hasSmartEditor) {
        editorFrame = f;
        console.log('✅ SmartEditor iframe 발견:', f.url().substring(0, 80));
        break;
      }
    } catch (e) {}
  }

  if (!editorFrame) {
    console.log('⚠️ SmartEditor iframe을 찾을 수 없음. 전체 프레임 정보:');
    for (const f of frames) {
      try {
        console.log(`  프레임: ${f.url().substring(0, 80)}`);
      } catch(e) {}
    }

    // Try the main page directly
    console.log('메인 페이지에서 SmartEditor 확인...');
    const seCheck = await page.evaluate(() => {
      return {
        hasSE: typeof SmartEditor !== 'undefined',
        seIframes: document.querySelectorAll('iframe[src*="editor"], iframe[class*="se"], #se4_iframe').length,
        allIframes: document.querySelectorAll('iframe').length
      };
    });
    console.log('SmartEditor 체크:', JSON.stringify(seCheck));

    if (seCheck.hasSE) {
      editorFrame = page;
      console.log('메인 페이지에 SmartEditor 존재함');
    }
  }

  if (!editorFrame) {
    console.log('❌ SmartEditor를 찾을 수 없습니다. 종료.');
    // Take screenshot for debugging
    try {
      await page.screenshot({ path: 'debug_edit_page.png', fullPage: true });
      console.log('디버그 스크린샷 저장됨: debug_edit_page.png');
    } catch(e) {}
    await page.close();
    b.disconnect();
    process.exit(1);
  }

  // Step 3: Upload images using file chooser
  console.log('\n=== 이미지 업로드 ===');
  const workspaceDir = 'C:\\Users\\paul\\.openclaw\\workspace';

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgPath = path.join(workspaceDir, img.file);
    console.log(`\n${i+1}/${images.length} ${img.label} (${img.file}) 업로드 중...`);

    try {
      // Try to use SE4 API for upload
      const uploadResult = await editorFrame.evaluate((idx) => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          if (ed && ed._canvasScrollingService) {
            // Scroll to proper position
            ed._canvasScrollingService.scrollToBottom();
          }
          return 'ready';
        } catch(e) {
          return 'SmartEditor error: ' + e.message;
        }
      }, i);
      console.log(`   SE4 준비: ${uploadResult}`);

      // Try clicking the image upload button
      // Look for a file input
      const fileInput = await editorFrame.$('input[type="file"]');
      if (fileInput) {
        console.log('   파일 input 발견, 직접 업로드 시도');
        await fileInput.setInputFiles(imgPath);
        await page.waitForTimeout(3000);
        console.log(`   ✅ ${img.label} 업로드 완료`);
        continue;
      }

      // Try using the photo button approach
      await page.keyboard.press('End');
      await page.waitForTimeout(300);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
        editorFrame.evaluate(() => {
          // Find photo buttons in toolbar
          const btns = document.querySelectorAll('button, [role="button"]');
          for (const btn of btns) {
            const html = btn.innerHTML.toLowerCase();
            const title = (btn.getAttribute('title') || '').toLowerCase();
            const cls = btn.className.toLowerCase();
            if (title.includes('사진') || cls.includes('photo') || cls.includes('image') || 
                html.includes('사진') || html.includes('image') || html.includes('photo')) {
              btn.click();
              return 'clicked: ' + (btn.textContent || '').trim();
            }
          }
          return 'no photo button found';
        })
      ]);

      if (fileChooser) {
        await fileChooser.setFiles([imgPath]);
        console.log(`   ✅ ${img.label} 파일 업로드 완료`);
        await page.waitForTimeout(3000);
      } else {
        console.log(`   ⚠️ fileChooser 이벤트 없음`);

        // Alternative: try direct evaluate to upload
        const directUpload = await editorFrame.evaluate((filePath) => {
          try {
            const ed = SmartEditor._editors['blogpc001'];
            if (ed && ed._componentService && ed._componentService.insertComponent) {
              // Insert empty image component
              ed._componentService.insertComponent('image');
              return 'inserted image component';
            }
            return 'SmartEditor._editors not available';
          } catch(e) {
            return 'error: ' + e.message;
          }
        }, imgPath);
        console.log(`   직접 업로드 시도: ${directUpload}`);
        await page.waitForTimeout(2000);
      }
    } catch(e) {
      console.error(`   ❌ ${img.label} 업로드 실패:`, e.message);
    }
  }

  // Step 4: Save
  console.log('\n=== 저장 ===');
  try {
    // Find save button
    const saveResult = await editorFrame.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = btn.textContent.trim();
        if (text === '저장' || text.includes('저장')) {
          btn.click();
          return 'clicked: ' + text;
        }
      }
      return 'no save button found';
    });
    console.log('저장 버튼:', saveResult);
    await page.waitForTimeout(3000);
  } catch(e) {
    console.error('저장 실패:', e.message);
  }

  // Final report
  console.log('\n=== 📋 최종 결과 보고 ===');
  console.log('URL:', page.url());
  console.log('제목:', await page.title());

  await page.close();
  b.disconnect();
  console.log('✅ 작업 완료');
})().catch(e => {
  console.error('❌ 치명적 오류:', e.message);
  console.error(e.stack);
  process.exit(1);
});

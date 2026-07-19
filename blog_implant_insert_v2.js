// 블로그봇 v2 — 임플란트 포스트 이미지 삽입
// 개선: 다이얼로그 핸들링, 직접 수정 페이지 접근
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CDP_PORT = 9224;

const IMAGES = [
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_main.png', label: '대표' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card1.png', label: 'card1' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card2.png', label: 'card2' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_card3.png', label: 'card3' },
  { file: 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_implant_cta.png', label: 'CTA' }
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('=== 블로그 이미지 삽입 v2 시작 ===');
  
  // Verify images
  for (const img of IMAGES) {
    if (!fs.existsSync(img.file)) {
      console.error(`❌ 없음: ${img.file}`);
      process.exit(1);
    }
    console.log(`✅ ${img.label}: ${path.basename(img.file)} (${(fs.statSync(img.file).size / 1024).toFixed(0)}KB)`);
  }
  
  // Connect to Chrome
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  console.log('Chrome CDP 연결 성공');
  
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  let page = pages.length > 0 ? pages[0] : await ctx.newPage();
  
  // Handle dialogs globally — with error suppression
  page.on('dialog', dialog => {
    const msg = dialog.message().substring(0, 100);
    console.log(`⚠️ 다이얼로그: "${msg}" → 수락`);
    dialog.accept().catch(() => {});
  });
  
  // Step 1: Go to blog manager and find the post
  console.log('\n--- 1단계: 블로그 관리자 접속 ---');
  
  // Navigate to Naver blog manager
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await sleep(4000);
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_blog_list.png', fullPage: true });
  console.log('블로그 목록 페이지 스크린샷 저장');
  
  // Step 2: Find and click the edit button for our post
  // Check current URL to see if we landed correctly
  const currentUrl = page.url();
  console.log(`현재 URL: ${currentUrl}`);
  
  // The post might be in a different location. Let's try to find it
  // First, let's check if there's a post list view
  
  // Sometimes Naver redirects to login - handle that
  if (currentUrl.includes('login') || currentUrl.includes('auth')) {
    console.log('⚠️ 로그인 페이지로 리다이렉트됨');
    await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_login.png', fullPage: true });
    
    // Check if already logged in via cookie
    const cookies = await ctx.cookies();
    const hasNid = cookies.some(c => c.name.includes('NID_SES') || c.name.includes('nid'));
    console.log(`네이버 로그인 쿠키 있음: ${hasNid}`);
    
    if (!hasNid) {
      console.error('❌ 로그인 필요. 수동 로그인 필요.');
      browser.disconnect();
      process.exit(1);
    }
  }
  
  // Try to find the specific post by logNo
  // Look for all links containing our logNo
  const editLinks = await page.$$('a[href*="224341544476"]');
  console.log(`logNo 링크 발견: ${editLinks.length}개`);
  
  for (const link of editLinks) {
    const href = await link.getAttribute('href').catch(() => '');
    console.log(`  링크 href: ${href}`);
    if (href.includes('edit') || href.includes('modify') || href.includes('PostEdit') || href.includes('update')) {
      console.log('수정 링크 발견! 클릭 시도');
      await link.click();
      await sleep(5000);
      break;
    }
  }
  
  if (editLinks.length === 0) {
    // Try direct edit URL approach
    console.log('수정 링크 못 찾음. 직접 수정 URL로 이동 시도...');
    
    // Naver SmartEdit URLs
    const editUrls = [
      `https://blog.naver.com/PostEdit.naver?blogId=aicut&logNo=224341544476&parentCategoryNo=&categoryNo=&from=post`,
      `https://blog.naver.com/PostWriteForm.naver?blogId=aicut&logNo=224341544476&isEdit=true`,
      `https://blog.naver.com/PostWrite.naver?blogId=aicut&logNo=224341544476&isEdit=true`
    ];
    
    let editLoaded = false;
    for (const url of editUrls) {
      console.log(`시도: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await sleep(5000);
      
      // Check if we got the editor
      const hasEditor = await page.$('iframe[title="SE"], .se-editor, .se-content-editor, #smart_editor, #se3-editor, [class*="se-"][contenteditable]');
      if (hasEditor) {
        console.log('✅ 수정 페이지 로드됨!');
        editLoaded = true;
        break;
      }
      
      await page.screenshot({ path: `C:\\Users\\paul\\.openclaw\\workspace\\debug_edit_try_${editUrls.indexOf(url)}.png`, fullPage: true });
    }
    
    if (!editLoaded) {
      console.error('❌ 수정 페이지 로드 실패');
      browser.disconnect();
      process.exit(1);
    }
  }
  
  // Step 3: Wait for SE4 editor to fully load
  console.log('\n--- 2단계: SE4 에디터 로딩 대기 ---');
  await sleep(3000);
  
  // Take screenshot of editor
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_editor_loaded.png', fullPage: true });
  console.log('에디터 상태 스크린샷 저장');
  
  // Step 4: Find the SE4 editor iframe and context
  console.log('\n--- 3단계: 이미지 삽입 ---');
  
  let seFrame = null;
  
  // Search for SE iframe
  const frames = page.frames();
  console.log(`전체 프레임: ${frames.length}개`);
  
  for (const f of frames) {
    const fName = f.name();
    const fUrl = f.url();
    console.log(`  프레임: name="${fName}" url="${fUrl.substring(0, 80)}"`);
    
    if (fName.includes('SE') || fName.includes('smart') || fName.includes('editor') ||
        fUrl.includes('smart') || fUrl.includes('editor') || fUrl.includes('se4') ||
        fUrl.includes('SE')) {
      seFrame = f;
      console.log('✅ SE4 iframe 발견!');
    }
  }
  
  // If no dedicated iframe, maybe it's embedded in the main page
  if (!seFrame) {
    // Check if the editor is embedded in the main page (sometimes SE4 doesn't use iframe)
    const hasDirectEditor = await page.$('.se-editor, .se-content-editor, .se-component');
    if (hasDirectEditor) {
      console.log('에디터가 메인 페이지에 직접 있음');
      seFrame = page;
    }
  }
  
  const target = seFrame || page;
  
  // Step 5: Insert images one by one
  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i];
    console.log(`\n--- 이미지 ${i+1}/${IMAGES.length}: ${img.label} ---`);
    
    // Try the click+filechooser approach
    console.log('사진 버튼 찾는 중...');
    
    // Find all photo upload buttons/areas in the editor
    let photoBtn = null;
    const photoSelectors = [
      'button:has-text("사진")',
      'button:has-text("picture")',
      'button:has-text("image")',
      'button.se-image-button',
      '[class*="photo"] button',
      '[class*="picture"] button',
      'button[class*="image"]',
      '[data-tooltip*="사진"]',
      '[data-tooltip*="image"]',
      'a[class*="image"]',
      'a[class*="photo"]',
      // SE4 toolbar buttons
      '[class*="se-toolbar"] button'
    ];
    
    if (target === page) {
      for (const sel of photoSelectors) {
        const btn = await page.$(sel);
        if (btn) {
          photoBtn = btn;
          console.log(`사진 버튼 발견: ${sel}`);
          break;
        }
      }
    } else {
      for (const sel of photoSelectors) {
        const btn = await target.$(sel);
        if (btn) {
          photoBtn = btn;
          console.log(`사진 버튼 발견 (iframe): ${sel}`);
          break;
        }
      }
    }
    
    if (photoBtn) {
      // Click the photo button and listen for file chooser
      console.log('사진 버튼 클릭 → 파일 선택 대기...');
      
      try {
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 10000 }),
          photoBtn.click()
        ]);
        
        console.log('파일 선택창 감지됨!');
        await sleep(500);
        await fileChooser.setFiles(img.file);
        console.log('✅ 파일 업로드 완료');
        await sleep(3000);
      } catch (e) {
        console.log(`파일선택기 방식 실패: ${e.message}`);
        
        // Fallback: try to find file input directly
        console.log('직접 input[type=file] 찾는 중...');
        let fileInput;
        if (target === page) {
          fileInput = await page.$('input[type="file"]');
        } else {
          fileInput = await target.$('input[type="file"]');
        }
        
        if (fileInput) {
          console.log('input[type=file] 발견! 직접 파일 설정');
          try {
            await fileInput.setInputFiles(img.file);
            console.log('✅ 파일 직접 업로드 완료');
            await sleep(3000);
            continue;
          } catch (e2) {
            console.log(`직접 업로드 실패: ${e2.message}`);
          }
        }
        
        // Last resort: Try clipboard paste (images work per RULES.md)
        console.log('클립보드 paste 시도...');
        const imgBuffer = fs.readFileSync(img.file);
        const base64 = imgBuffer.toString('base64');
        
        try {
          if (target === page) {
            await page.evaluate(async (b64) => {
              const resp = await fetch(`data:image/png;base64,${b64}`);
              const blob = await resp.blob();
              const dt = new DataTransfer();
              dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
              document.activeElement.dispatchEvent(new ClipboardEvent('paste', {
                clipboardData: dt, bubbles: true, cancelable: true
              }));
            }, base64);
          } else {
            // In iframe, evaluate in iframe context
            await target.evaluate(async (b64) => {
              const resp = await fetch(`data:image/png;base64,${b64}`);
              const blob = await resp.blob();
              const dt = new DataTransfer();
              dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
              document.activeElement.dispatchEvent(new ClipboardEvent('paste', {
                clipboardData: dt, bubbles: true, cancelable: true
              }));
            }, base64);
          }
          console.log('✅ 클립보드 paste 완료');
          await sleep(3000);
        } catch (e3) {
          console.error(`❌ 모든 방식 실패: ${e3.message}`);
        }
      }
    } else {
      console.log('사진 버튼을 찾을 수 없음. 다른 접근법 시도...');
      
      // Try clicking on the editor and using keyboard shortcut
      const editorEl = target === page ? 
        await page.$('[contenteditable], .se-component, .se-editor') : 
        await target.$('[contenteditable], .se-component, .se-editor');
      
      if (editorEl) {
        await editorEl.click();
        await sleep(500);
        
        // Try paste only
        const imgBuffer = fs.readFileSync(img.file);
        const base64 = imgBuffer.toString('base64');
        
        try {
          if (target === page) {
            await page.evaluate(async (b64) => {
              const resp = await fetch(`data:image/png;base64,${b64}`);
              const blob = await resp.blob();
              const dt = new DataTransfer();
              dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
              document.activeElement.dispatchEvent(new ClipboardEvent('paste', {
                clipboardData: dt, bubbles: true, cancelable: true
              }));
            }, base64);
          } else {
            await target.evaluate(async (b64) => {
              const resp = await fetch(`data:image/png;base64,${b64}`);
              const blob = await resp.blob();
              const dt = new DataTransfer();
              dt.items.add(new File([blob], 'image.png', { type: 'image/png' }));
              document.activeElement.dispatchEvent(new ClipboardEvent('paste', {
                clipboardData: dt, bubbles: true, cancelable: true
              }));
            }, base64);
          }
          console.log('✅ 클립보드 paste 완료');
          await sleep(3000);
        } catch (e) {
          console.error(`❌ paste 실패: ${e.message}`);
        }
      } else {
        console.error('❌ 에디터 요소를 찾을 수 없음');
      }
    }
  }
  
  // Step 6: Apply center alignment to images
  console.log('\n--- 4단계: 이미지 센터 정렬 ---');
  
  try {
    await (target === page ? page : target).evaluate(() => {
      const selectors = [
        '.se-image-component', '.se-component.se-image',
        '.se-component > div[style*="text-align"]',
        '.se-component-wrapper',
        'div > img[src*="files"]'
      ];
      
      let items = [];
      for (const sel of selectors) {
        items = document.querySelectorAll(sel);
        if (items.length > 0) break;
      }
      
      if (items.length === 0) {
        // Any component wrapping an image
        items = document.querySelectorAll('.se-component');
        items = Array.from(items).filter(el => el.querySelector('img'));
      }
      
      console.log(`정렬 대상: ${items.length}개`);
      items.forEach(el => {
        el.style.textAlign = 'center';
        if (el.tagName === 'IMG') {
          el.style.display = 'block';
          el.style.margin = '0 auto';
        }
        // Add center class
        el.classList.add('se-text-paragraph-align-center');
      });
      
      document.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    });
    console.log('✅ 센터 정렬 적용됨');
  } catch (e) {
    console.log(`⚠️ 센터 정렬 중 오류: ${e.message}`);
  }
  
  await sleep(2000);
  
  // Step 7: Save
  console.log('\n--- 5단계: 저장 ---');
  
  // Save button is usually in the parent page, not in the iframe
  const saveBtn = await page.$('button:has-text("저장"), a:has-text("저장"), [class*="save"], [data-testid*="save"]');
  
  if (saveBtn) {
    console.log('저장 버튼 발견! 클릭...');
    await saveBtn.click();
    await sleep(3000);
    console.log('✅ 저장 버튼 클릭 완료');
  } else {
    // Try finding it by text content
    const saveByText = await page.evaluate(() => {
      const allElements = document.querySelectorAll('button, a, span, div');
      for (const el of allElements) {
        if (el.textContent.trim() === '저장') {
          el.click();
          return true;
        }
      }
      return false;
    });
    
    if (saveByText) {
      console.log('✅ 저장 버튼 텍스트 검색으로 클릭 완료');
      await sleep(3000);
    } else {
      console.log('⚠️ 저장 버튼 미발견 — 수동 저장 필요');
    }
  }
  
  // Final screenshot
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\debug_final.png', fullPage: true });
  console.log('최종 상태 스크린샷 저장');
  
  // Check for save confirmation
  const saveConfirm = await page.$('text=저장되었습니다');
  if (saveConfirm) {
    console.log('✅ 저장 확인 메시지 발견됨');
  } else {
    console.log('저장 확인 메시지 미발견 — 스크린샷 참조');
  }
  
  console.log('\n=== 완료 ===');
  console.log('체크리스트:');
  for (const img of IMAGES) {
    console.log(`  🔲 ${img.label}: ${path.basename(img.file)} — 업로드 시도 완료`);
  }
  console.log('  🔲 센터 정렬: 적용 시도');
  console.log('  🔲 저장: 시도 완료');
  console.log('\n⚠️ 최종 확인은 스크린샷(debug_final.png)과 debug_editor_loaded.png 참조');
  console.log('⚠️ 이미지가 정확한 위치에 배치되지 않았을 수 있으니 수동 검토 권장');
  
  // Disconnect, don't close
  browser.disconnect();
  console.log('🔌 Chrome 연결 해제 (브라우저 유지)');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

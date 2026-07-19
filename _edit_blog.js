// 치과 임플란트 블로그 포스팅 - 이미지 삽입
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BLOG_URL = 'https://blog.naver.com/aicut/224341544476';
const CDP_PORT = process.env.CDP_PORT || 9224;

// 5개 이미지 파일 목록
const IMAGES = [
  { file: 'aicut_blog_dental_main.png', width: 700, height: 700, pos: 1 },  // 도입부 후 → 본문 시작
  { file: 'aicut_blog_dental_01.png', width: 600, height: 338, pos: 2 },   // 📋 섹션 후
  { file: 'aicut_blog_dental_02.png', width: 600, height: 338, pos: 3 },   // 🎥 섹션 후
  { file: 'aicut_blog_dental_03.png', width: 600, height: 338, pos: 4 },   // 📅 섹션 후
  { file: 'aicut_blog_dental_cta.png', width: 500, height: 300, pos: 5 }   // ✅ 섹션 후
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Insert image at the end of the editor by:
 * 1. Finding the last text component
 * 2. Creating an image component after it
 */
async function insertImageViaSE4(page, imageFile, waitForSelector) {
  const imagePath = path.join(__dirname, imageFile);
  
  // 방법 1: 사진 버튼 클릭 → filechooser
  // 방법 2: DataTransfer로 input[type=file]에 직접 주입
  // 방법 3: clipboard paste

  // 먼저 사진 버튼 찾아보기
  const photoBtn = await page.$('.se-image-toolbar-button, .toolbar-button-image, button:has(.ico-photo), button:has-text("사진")');
  
  if (!photoBtn) {
    // Image toolbar 버튼이 없으면 직접 SE4 API로 시도
    console.log('  ⚠️ 사진 버튼을 못 찾음, DOM 분석 중...');
    
    // 에디터 본문 위치 확인
    const editorInfo = await page.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return { hasSE: false };
      return {
        hasSE: true,
        docData: JSON.stringify(se._documentService?.getDocumentData()?.slice(0, 15)),
        compCount: se._documentService?.getDocumentData()?.length || 0,
      };
    });
    console.log('  SE4 상태:', JSON.stringify(editorInfo, null, 2));
    return false;
  }
  
  // filechooser 준비 후 클릭
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
    photoBtn.click(),
  ]);
  
  if (fileChooser) {
    await fileChooser.setFiles([imagePath]);
    console.log(`  ✅ 이미지 업로드 완료: ${imageFile}`);
    await sleep(2000);
    return true;
  }
  
  console.log('  ⚠️ filechooser 이벤트 없음, 다른 방법 시도');
  return false;
}

(async () => {
  console.log('🔍 블로그 포스팅 수정 모드 진입...');
  console.log(`   URL: ${BLOG_URL}`);
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // 1. 블로그 포스팅 열기
    console.log('📄 포스팅 로딩 중...');
    await page.goto(BLOG_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    
    // 2. 수정 버튼 찾기
    console.log('🔍 수정 버튼 탐색...');
    
    // 스크린샷을 찍어서 확인
    await page.screenshot({ path: '_debug_blog_page.png', fullPage: false });
    
    // 수정 버튼 찾기 - 다양한 방법
    const editBtn = await page.$('a:has-text("수정"), button:has-text("수정"), .se-edit-btn, [class*="edit" i][class*="btn" i], a[href*="PostEdit"]');
    
    if (editBtn) {
      console.log('  ✅ 수정 버튼 발견, 클릭 중...');
      await editBtn.click();
    } else {
      // URL로 직접 수정 진입 시도
      console.log('  ⚠️ 수정 버튼 미발견, 직접 URL로 시도');
      const postNo = '224341544476';
      await page.goto(`https://blog.naver.com/PostEdit.naver?blogId=aicut&postNo=${postNo}&from=postView`, { waitUntil: 'networkidle', timeout: 30000 });
    }
    
    await sleep(5000);
    
    // 3. SE4 에디터 로딩 확인
    console.log('🔍 SE4 에디터 로딩 확인...');
    
    const seReady = await page.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (se) return true;
      // iframe 체크
      const iframe = document.querySelector('iframe.se-editor-iframe, iframe[name="main"]');
      return !!iframe;
    });
    
    console.log(`  SE4 준비됨: ${seReady}`);
    
    // 에디터 정보 수집
    const editorState = await page.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return { error: 'SmartEditor instance not found' };
      
      let docData = null;
      let text = '';
      try {
        if (se._documentService?.getDocumentData) {
          docData = se._documentService.getDocumentData();
        }
        if (se.getContentText) {
          text = se.getContentText();
        }
      } catch(e) {
        return { error: e.message };
      }
      
      return {
        compCount: docData ? docData.length : 0,
        components: docData ? docData.map(c => ({ 
          type: c.type, 
          text: c.text?.substring(0, 50),
          align: c.align
        })) : [],
        textLength: text.length,
        textPreview: text.substring(0, 200),
      };
    });
    
    console.log('  에디터 상태:', JSON.stringify(editorState, null, 2).substring(0, 2000));
    
    await page.screenshot({ path: '_debug_editor.png', fullPage: false });
    
    // 4. 이미지 삽입 시도
    console.log('\n🖼️ 이미지 삽입 시작...');
    
    // 먼저 에디터 본문 영역 찾기
    let editorFrame = null;
    const frames = page.frames();
    for (const f of frames) {
      const url = f.url();
      if (url.includes('smarteditor') || url.includes('se2') || url.includes('editor')) {
        editorFrame = f;
        console.log('  에디터 iframe 발견:', url);
        break;
      }
    }
    
    // 이미지 삽입 시도 - filechooser 방식
    for (let i = 0; i < IMAGES.length; i++) {
      const img = IMAGES[i];
      console.log(`\n[${i + 1}/5] ${img.file} 삽입 시도 (이미지 ${img.pos}번째 위치)...`);
      const fullPath = path.resolve(__dirname, img.file);
      console.log(`  파일 경로: ${fullPath}, 존재: ${fs.existsSync(fullPath)}`);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`  ❌ 파일 없음: ${fullPath}`);
        continue;
      }
      
      // 이미지 업로드 시도
      const targetPage = editorFrame || page;
      
      // 여러 방법 시도
      let uploaded = false;
      
      // 방법 1: filechooser - 사진 버튼 찾아 클릭
      try {
        // 사진 버튼 선택자들
        const selectors = [
          '.se-image-toolbar-button',
          '.toolbar-button-image', 
          'button[title*="사진"]',
          'button[aria-label*="사진"]',
          '.se-doc-footer-btn--image',
          'button.se-image-button',
          'button:has(.ico-photo)'
        ];
        
        let photoBtn = null;
        for (const sel of selectors) {
          const btn = targetPage.url() ? await targetPage.$(sel).catch(() => null) : await page.$(sel).catch(() => null);
          if (btn) {
            const el = btn;
            const visible = await el.isVisible().catch(() => false);
            if (visible) {
              photoBtn = el;
              console.log(`  📸 사진 버튼 발견: "${sel}"`);
              break;
            }
          }
        }
        
        if (photoBtn) {
          console.log('  📤 filechooser 대기 + 클릭...');
          const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 5000 }).catch(e => {
              console.log(`  ⚠️ filechooser timeout: ${e.message}`);
              return null;
            }),
            photoBtn.click().catch(e => console.log(`  ⚠️ 클릭 실패: ${e.message}`)),
          ]);
          
          if (fileChooser) {
            await fileChooser.setFiles([fullPath]);
            console.log('  ✅ 이미지 업로드 성공!');
            uploaded = true;
            await sleep(3000);
          }
        }
      } catch(e) {
        console.log(`  ⚠️ filechooser 방식 실패: ${e.message}`);
      }
      
      // 방법 2: input[type=file] 직접 찾기
      if (!uploaded) {
        try {
          console.log('  📤 input[type=file] 직접 탐색...');
          const fileInput = await page.$('input[type="file"]');
          if (fileInput) {
            console.log('  ✅ file input 발견, 파일 설정 시도');
            
            // DataTransfer 방식
            await fileInput.setInputFiles([fullPath]);
            
            // change 이벤트 트리거
            await page.evaluate(() => {
              const input = document.querySelector('input[type="file"]');
              if (input) {
                input.dispatchEvent(new Event('change', { bubbles: true }));
              }
            });
            
            console.log('  ✅ 직접 input에 파일 설정 완료');
            uploaded = true;
            await sleep(3000);
          } else {
            console.log('  ⚠️ input[type=file] 없음');
          }
        } catch(e) {
          console.log(`  ⚠️ direct input 방식 실패: ${e.message}`);
        }
      }
      
      // 방법 3: 클립보드 → paste
      if (!uploaded) {
        try {
          console.log('  📤 clipboard paste 방식 시도...');
          
          // 읽기 모드의 file을 clipboard에 넣을 수는 없으므로
          // page.setInputFiles를 직접 시도
          
          // 에디터 영역에 포커스
          const editorArea = await targetPage.$('.se-doc-text, .se-textarea, [contenteditable="true"]');
          if (editorArea) {
            await editorArea.focus();
            
            // DataTransfer를 이용한 paste
            const dataTransfer = await page.evaluateHandle((fp) => {
              const dt = new DataTransfer();
              const file = new File([''], fp.split('/').pop(), { type: 'image/png' });
              // 실제 파일 객체를 직접 넣을 수 없음 - clipboard 방식 제한
              return dt;
            }, fullPath);
            
            await page.evaluate((dt) => {
              const clipboardEvent = new ClipboardEvent('paste', {
                clipboardData: dt,
                bubbles: true,
                cancelable: true,
              });
              document.activeElement?.dispatchEvent(clipboardEvent);
            }, dataTransfer);
            
            await sleep(2000);
            console.log('  ⚠️ clipboard paste 시도 완료 (동작 확인 필요)');
          }
        } catch(e) {
          console.log(`  ⚠️ clipboard paste 방식 실패: ${e.message}`);
        }
      }
      
      if (!uploaded) {
        console.log(`  ❌ 모든 방법 실패 - ${img.file} 수동 업로드 필요`);
      }
    }
    
    // 5. 저장 버튼 클릭
    console.log('\n💾 저장 시도...');
    
    await page.screenshot({ path: '_debug_after_images.png', fullPage: false });
    
    const saveBtn = await page.$('button:has-text("저장"), a:has-text("저장"), .se-btn-save, [class*="save" i]');
    if (saveBtn) {
      console.log('  ✅ 저장 버튼 발견, 클릭 중...');
      await saveBtn.click();
      await sleep(3000);
      console.log('  ✅ 저장 완료!');
    } else {
      console.log('  ⚠️ 저장 버튼 미발견 (수동 저장 필요)');
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: '_debug_final.png', fullPage: false });
    console.log('\n✅ 작업 완료!');
    
  } catch(err) {
    console.error('❌ 오류:', err.message);
    console.error(err.stack);
  } finally {
    await page.close();
    console.log('🔌 탭 종료 (브라우저 유지)');
  }
})();

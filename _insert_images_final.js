// 최종: 치과 임플란트 블로그 이미지 교체 삽입
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CDP_PORT = process.env.CDP_PORT || 9224;
const IMAGE_DIR = __dirname;

// 새 이미지 파일 (방금 생성)
const NEW_IMAGES = [
  { file: 'aicut_blog_dental_main.png', width: 700, height: 700 },
  { file: 'aicut_blog_dental_01.png', width: 600, height: 338 },
  { file: 'aicut_blog_dental_02.png', width: 600, height: 338 },
  { file: 'aicut_blog_dental_03.png', width: 600, height: 338 },
  { file: 'aicut_blog_dental_cta.png', width: 500, height: 300 },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * Upload image to SE4 and return the image URL
 */
async function uploadImageToSE4(editFrame, imageFilePath) {
  // 방법 1: 사진 버튼 클릭 → filechooser
  try {
    const photoBtns = await editFrame.$$('button:has-text("사진"), button[class*="image"], button span:has-text("사진")');
    
    for (const btn of photoBtns) {
      const visible = await btn.isVisible();
      if (visible) {
        console.log('  📸 사진 버튼 발견');
        
        const [fileChooser] = await Promise.all([
          editFrame.waitForEvent('filechooser', { timeout: 6000 }).catch(e => null),
          btn.click(),
        ]);
        
        if (fileChooser) {
          await fileChooser.setFiles([imageFilePath]);
          console.log('  ✅ filechooser 업로드 성공');
          await sleep(3000);
          return true;
        }
      }
    }
  } catch(e) {
    console.log(`  ⚠️ filechooser 실패: ${e.message}`);
  }
  
  // 방법 2: input[type=file] 직접 찾기
  try {
    const fileInput = await editFrame.$('input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles([imageFilePath]);
      await editFrame.evaluate(() => {
        const input = document.querySelector('input[type="file"]');
        if (input) input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      console.log('  ✅ direct input 업로드 성공');
      await sleep(3000);
      return true;
    }
  } catch(e) {
    console.log(`  ⚠️ direct input 실패: ${e.message}`);
  }

  return false;
}

(async () => {
  console.log('🔍 블로그 포스팅 수정 시작...');
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // 1. 블로그 포스팅 열기
    console.log('📄 포스팅 로딩...');
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);

    // 2. 수정 버튼 클릭
    console.log('🔍 수정 모드 진입...');
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    // 3. 에디터 iframe 찾기
    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.error('❌ PostUpdateForm iframe not found'); return; }
    console.log('✅ 에디터 진입 완료');

    // 4. 현재 문서 구조 확인
    const currentComps = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.map((c, i) => ({
        idx: i,
        type: c['@ctype'],
        fileName: c.fileName || null,
        text: c.title ? c.title[0]?.nodes?.[0]?.value?.substring(0, 40) || '' : '',
        align: c.align || 'none'
      }));
    });
    
    if (!currentComps) { console.error('❌ Cannot read document data'); return; }
    console.log(`📋 현재 컴포넌트 ${currentComps.length}개`);
    currentComps.forEach(c => {
      const icon = c.type === 'image' ? '🖼️' : c.type === 'text' ? '📝' : c.type === 'documentTitle' ? '📌' : '❓';
      console.log(`  [${c.idx}] ${icon} ${c.type} ${c.fileName || (c.text?.substring(0, 30) || '')}`);
    });

    // 5. 새 이미지 업로드 (사진 버튼으로 하나씩)
    console.log('\n🖼️ 새 이미지 업로드 시작...\n');
    
    // 업로드된 이미지의 SE4 URL을 저장
    const uploadedUrls = [];
    
    for (let i = 0; i < NEW_IMAGES.length; i++) {
      const img = NEW_IMAGES[i];
      const fullPath = path.join(IMAGE_DIR, img.file);
      
      console.log(`[${i + 1}/${NEW_IMAGES.length}] ${img.file} 업로드...`);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`  ❌ 파일 없음`);
        continue;
      }
      
      // Upload via 사진 버튼
      const uploaded = await uploadImageToSE4(editFrame, fullPath);
      
      if (uploaded) {
        // 업로드 후 마지막 이미지 컴포넌트의 src 가져오기
        const lastImgUrl = await editFrame.evaluate(() => {
          const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
          if (!se) return null;
          const doc = se._documentService.getDocumentData();
          const comps = doc.document.components;
          // 마지막 image 컴포넌트 찾기
          for (let i = comps.length - 1; i >= 0; i--) {
            if (comps[i]['@ctype'] === 'image') {
              return { src: comps[i].src, idx: i };
            }
          }
          return null;
        });
        
        if (lastImgUrl) {
          console.log(`  📍 이미지 컴포넌트 인덱스: ${lastImgUrl.idx}`);
          uploadedUrls.push(lastImgUrl.src);
        }
      } else {
        console.log(`  ⚠️ 업로드 실패`);
      }
      
      await sleep(2000);
    }

    console.log(`\n✅ 총 ${uploadedUrls.length}개 이미지 업로드됨`);

    // 6. 이미지를 올바른 위치로 재배치 (SE4 API로 순서 조정)
    // 현재: 새 이미지들이 맨 뒤에 추가됨 (text 컴포넌트들 뒤)
    // 목표: 각 이미지를 해당 섹션(text) 뒤에 배치
    // - 대표 이미지: 첫 text 컴포넌트 뒤
    // - card1: 두 번째 text 뒤
    // - card2: 세 번째 text 뒤 (없으면 맨 뒤)
    
    console.log('\n📐 이미지 위치 재배치...');
    
    const rearrangeResult = await editFrame.evaluate((count) => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return { error: 'no SE' };
      
      const docSvc = se._documentService;
      const doc = docSvc.getDocumentData();
      const comps = doc.document.components;
      
      // Find text components
      const textIndices = [];
      comps.forEach((c, i) => {
        if (c['@ctype'] === 'text') textIndices.push(i);
      });
      
      // Find newly added images (the last N image components)
      const newImgIndices = [];
      for (let i = comps.length - 1; i >= 0; i--) {
        if (comps[i]['@ctype'] === 'image' && newImgIndices.length < count) {
          newImgIndices.unshift(i);
        }
      }
      
      return {
        textIndices,
        newImgIndices,
        totalComps: comps.length
      };
    }, NEW_IMAGES.length);
    
    console.log('재배치 정보:', JSON.stringify(rearrangeResult, null, 2));

    // 7. 저장
    console.log('\n💾 저장...');
    
    // "발행" 버튼 근처에 "저장" 버튼이 있을 것
    // 실제로 SE4 에디터에서 저장은 문서 데이터를 변경하면 자동 저장됨
    // 또는 상단 저장 버튼 찾기
    
    // 먼저 상단 메인 페이지에서 저장 버튼 찾기
    const saveBtn = await page.$('button:has-text("저장"), a:has-text("저장"), .btn_save, button._btn_save');
    
    if (saveBtn) {
      await saveBtn.click();
      console.log('  ✅ 저장 버튼 클릭됨');
      await sleep(3000);
      
      // 저장 후 페이지 상태 확인
      const currentUrl = page.url();
      console.log(`  URL: ${currentUrl}`);
    } else {
      console.log('  ⚠️ 저장 버튼 미발견');
    }
    
    // 8. 최종 스크린샷 및 상태
    await page.screenshot({ path: '_debug_final_result.png', fullPage: false });
    
    // 최종 문서 구조 확인
    const finalComps = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.map(c => ({
        type: c['@ctype'],
        fileName: c.fileName || null,
        align: c.align || 'none'
      }));
    });
    
    console.log('\n📋 최종 컴포넌트 구조:');
    if (finalComps) {
      finalComps.forEach((c, i) => {
        const icon = c.type === 'image' ? '🖼️' : c.type === 'text' ? '📝' : c.type === 'documentTitle' ? '📌' : '❓';
        console.log(`  [${i}] ${icon} ${c.type} ${c.fileName || ''}`);
      });
    }
    
    console.log('\n✅ 작업 완료!');
    
  } catch(err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await page.close();
    console.log('🔌 탭 종료 (브라우저 유지)');
  }
})();

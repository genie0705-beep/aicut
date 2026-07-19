// v2: page 레벨 filechooser 사용
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const CDP_PORT = process.env.CDP_PORT || 9224;

const NEW_IMAGES = [
  { file: 'aicut_blog_dental_main.png', w: 700, h: 700 },
  { file: 'aicut_blog_dental_01.png', w: 600, h: 338 },
  { file: 'aicut_blog_dental_02.png', w: 600, h: 338 },
  { file: 'aicut_blog_dental_03.png', w: 600, h: 338 },
  { file: 'aicut_blog_dental_cta.png', w: 500, h: 300 },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('🔍 블로그 수정 시작 (v2)...');
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // 1. 포스팅 열기
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);

    // 2. 수정 버튼 클릭 (iframe 내)
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    // 3. 에디터 iframe
    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.error('❌ iframe not found'); return; }
    console.log('✅ 에디터 진입');

    // 4. 기존 이미지 제거 (1~5번 컴포넌트)
    console.log('🗑️ 기존 이미지 제거...');
    const removeResult = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return 'no SE';
      const docSvc = se._documentService;
      const doc = docSvc.getDocumentData();
      const comps = doc.document.components;
      
      // Remove old image components (at indices 1-5 which are the old images)
      // Process in reverse order to preserve indices
      const toRemove = [];
      for (let i = 0; i < comps.length; i++) {
        if (comps[i]['@ctype'] === 'image') {
          toRemove.push(i);
        }
      }
      toRemove.reverse(); // Remove from end to start
      
      toRemove.forEach(idx => {
        comps.splice(idx, 1);
      });
      
      // Update document
      doc.document.components = comps;
      docSvc.setDocumentData(doc);
      
      return { removed: toRemove.length, remaining: comps.length };
    });
    
    console.log('  결과:', JSON.stringify(removeResult));
    await sleep(2000);

    // 5. 이미지 업로드 (page 레벨 filechooser)
    console.log('\n🖼️ 이미지 업로드...\n');
    
    const uploadedSrcs = [];
    
    for (let i = 0; i < NEW_IMAGES.length; i++) {
      const img = NEW_IMAGES[i];
      const fullPath = path.resolve(__dirname, img.file);
      
      console.log(`[${i+1}/5] ${img.file}...`);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`  ❌ 파일 없음: ${fullPath}`);
        continue;
      }

      // Try two approaches:
      // Approach A: Find file input in iframe and set directly
      let uploaded = false;
      
      // A1: Find input[type=file] in the editor iframe
      try {
        const hasInput = await editFrame.evaluate(() => {
          const input = document.querySelector('input[type="file"]');
          return { found: !!input, tag: input?.tagName, id: input?.id, class: input?.className?.substring(0, 50) };
        });
        
        if (hasInput?.found) {
          console.log(`  📁 input[type=file] 발견`);
          // Need to use page-level filechooser since input is in iframe
          // Let's click the 사진 button and catch filechooser on the page
        }
      } catch(e) {}

      // A2: Use page-level filechooser
      try {
        // First, prepare the filechooser listener on the page
        const fcPromise = page.waitForEvent('filechooser', { timeout: 8000 })
          .then(fc => { fc.setFiles([fullPath]); return true; })
          .catch(() => false);
        
        // Try clicking the 사진 button in the iframe
        for (const sel of ['button:has-text("사진")', 'button span:has-text("사진")', '.se-image-toolbar-button', 'button[title*="사진"]']) {
          const btn = await editFrame.$(sel).catch(() => null);
          if (btn) {
            const visible = await btn.isVisible().catch(() => false);
            if (visible) {
              console.log(`  📸 사진 버튼 클릭 (셀렉터: "${sel}")`);
              await btn.click();
              break;
            }
          }
        }
        
        const fcResult = await fcPromise;
        if (fcResult) {
          console.log('  ✅ filechooser 업로드 성공!');
          uploaded = true;
          await sleep(3000);
          
          // Get the uploaded image URL from the editor
          const lastImg = await editFrame.evaluate(() => {
            const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
            if (!se) return null;
            const doc = se._documentService.getDocumentData();
            const comps = doc.document.components;
            for (let i = comps.length - 1; i >= 0; i--) {
              if (comps[i]['@ctype'] === 'image') {
                return { src: comps[i].src, idx: i, w: comps[i].width, h: comps[i].height };
              }
            }
            return null;
          });
          
          if (lastImg) {
            uploadedSrcs.push(lastImg);
            console.log(`  📍 컴포넌트[${lastImg.idx}]: ${lastImg.src?.substring(0, 80)}`);
          }
        }
      } catch(e) {
        console.log(`  ⚠️ filechooser 오류: ${e.message}`);
      }
      
      if (!uploaded) {
        console.log('  ❌ 업로드 실패');
      }
      
      await sleep(1000);
    }

    console.log(`\n✅ ${uploadedSrcs.length}개 이미지 업로드됨`);

    // 6. 이미지 센터 정렬
    console.log('\n📐 이미지 센터 정렬...');
    await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      const doc = se._documentService.getDocumentData();
      const comps = doc.document.components;
      comps.forEach(c => {
        if (c['@ctype'] === 'image') {
          c.align = 'center';
          c.style = { width: '100%' };
        }
      });
      se._documentService.setDocumentData(doc);
    });
    console.log('  ✅ 정렬 완료');

    // 7. 최종 구조 확인
    const finalComps = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.map((c, i) => ({
        idx: i,
        type: c['@ctype'],
        fileName: c.fileName || null,
        align: c.align || 'none',
        text: c.title ? c.title[0]?.nodes?.map(n => n.value).join('').substring(0, 40) : '',
        src: c.src ? c.src.substring(0, 60) : null,
      }));
    });
    
    console.log('\n📋 최종 문서 구조:');
    if (finalComps) {
      finalComps.forEach(c => {
        const icon = c.type === 'image' ? '🖼️' : c.type === 'text' ? '📝' : c.type === 'documentTitle' ? '📌' : '❓';
        console.log(`  [${c.idx}] ${icon} ${c.type} align=${c.align} ${c.fileName || c.text?.substring(0, 30) || ''}`);
      });
    }

    // 8. 저장
    console.log('\n💾 저장 시도...');
    
    // 메인 페이지에서 저장 버튼 찾기
    const saveBtn = await page.$('button:has-text("저장"), a:has-text("저장"), [class*="save"]');
    if (saveBtn) {
      await saveBtn.click();
      console.log('  ✅ 저장 클릭');
      await sleep(3000);
    } else {
      // iframe 내 저장 버튼 찾기
      const saveInFrame = await editFrame.$('button:has-text("저장")');
      if (saveInFrame) {
        await saveInFrame.click();
        console.log('  ✅ iframe 내 저장 클릭');
        await sleep(3000);
      } else {
        console.log('  ⚠️ 저장 버튼 없음');
      }
    }
    
    await page.screenshot({ path: '_debug_v2_final.png' });
    console.log('\n✅ 작업 완료!');
    
  } catch(err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await page.close();
    console.log('🔌 탭 종료');
  }
})();

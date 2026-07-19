// 최종 통합: 이미지 생성 완료 → 블로그 수정 → 저장
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const NEW_IMAGES = [
  { file: 'aicut_blog_dental_main.png', w: 700, h: 700 },
  { file: 'aicut_blog_dental_01.png', w: 600, h: 338 },
  { file: 'aicut_blog_dental_02.png', w: 600, h: 338 },
  { file: 'aicut_blog_dental_03.png', w: 600, h: 338 },
  { file: 'aicut_blog_dental_cta.png', w: 500, h: 300 },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // === 1. 포스팅 열기 ===
    console.log('📄 포스팅 로딩...');
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);

    // === 2. 수정 모드 진입 ===
    console.log('🔍 수정 모드 진입...');
    const pf = page.frames().find(f => f.url().includes('PostView'));
    if (pf) {
      await pf.evaluate(() => {
        document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      });
    }
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.error('❌ iframe not found'); return; }
    console.log('✅ 에디터 진입');

    // === 3. 기존 이미지 제거 ===
    console.log('🗑️ 기존 이미지 제거...');
    await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      const doc = se._documentService.getDocumentData();
      doc.document.components = doc.document.components.filter(c => c['@ctype'] !== 'image');
      se._documentService.setDocumentData(doc);
    });
    console.log('  ✅ 완료');
    await sleep(1000);

    // === 4. 새 이미지 data URI 준비 ===
    console.log('\n🖼️ 새 이미지 data URI 준비...');
    const imageComponents = NEW_IMAGES.map((img, idx) => {
      const buf = fs.readFileSync(path.resolve(__dirname, img.file));
      const b64 = buf.toString('base64');
      const represent = idx === 0; // First image is representative
      return {
        id: 'SE-' + crypto.randomUUID(),
        layout: 'default',
        align: 'center',
        src: `data:image/png;base64,${b64}`,
        internalResource: false,
        represent,
        width: img.w,
        height: img.h,
        originalWidth: img.w,
        originalHeight: img.h,
        fileName: img.file,
        caption: null,
        format: 'normal',
        imageLoaded: true,
        '@ctype': 'image',
      };
    });

    // === 5. 각 텍스트 컴포넌트 뒤에 이미지 삽입 ===
    console.log('📐 이미지-텍스트 교차 배치...');
    
    await editFrame.evaluate((imgs) => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      
      const docSvc = se._documentService;
      const doc = docSvc.getDocumentData();
      const comps = doc.document.components;
      
      // Build new component list: text → image → text → image → ...
      const newComps = [];
      let imgIdx = 0;
      let textCount = -1;
      
      for (const c of comps) {
        newComps.push(c);
        
        // After each text component (NOT the title), insert an image
        if (c['@ctype'] === 'text') {
          textCount++;
          if (imgIdx < imgs.length) {
            newComps.push(imgs[imgIdx]);
            imgIdx++;
          }
        }
      }
      
      // Add remaining images at the end
      while (imgIdx < imgs.length) {
        newComps.push(imgs[imgIdx]);
        imgIdx++;
      }
      
      doc.document.components = newComps;
      docSvc.setDocumentData(doc);
    }, imageComponents);

    console.log('  ✅ 이미지 배치 완료');
    await sleep(2000);

    // === 6. 저장 ===
    console.log('\n💾 저장 시도...');
    
    // 발행 버튼 is in the iframe, 저장 should be in the main page header
    // Look for 저장 in the main page
    await page.screenshot({ path: '_debug_before_save2.png' });
    
    const saveBtns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a, span'))
        .filter(el => el.offsetParent !== null)
        .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim(), cls: el.className?.substring(0, 40) }))
        .filter(el => ['저장', '발행', '임시저장'].includes(el.text));
    });
    
    console.log('저장/발행 버튼:', JSON.stringify(saveBtns));
    
    // Try clicking 저장
    if (saveBtns.length > 0) {
      const saveEl = saveBtns.find(b => b.text === '저장');
      if (saveEl) {
        const btn = await page.$(`${saveEl.tag}:has-text("${saveEl.text}")`);
        if (btn) {
          await btn.click();
          console.log('  ✅ 저장 클릭');
          await sleep(5000);
        }
      } else {
        // Try 임시저장
        const tempSave = saveBtns.find(b => b.text === '임시저장');
        if (tempSave) {
          const btn = await page.$(`${tempSave.tag}:has-text("${tempSave.text}")`);
          if (btn) {
            await btn.click();
            console.log('  ✅ 임시저장 클릭');
            await sleep(5000);
          }
        }
      }
    } else {
      // 저장 버튼이 메인 페이지가 아닌 다른 프레임에 있을 수 있음
      // "발행" 버튼이 iframe에 있지만 "저장"은 다른 곳일 수 있음
      console.log('  ⚠️ 저장 버튼 미발견 - 수동 저장 필요');
    }

    // === 7. 최종 상태 ===
    await page.screenshot({ path: '_debug_final_all.png' });
    
    const finalState = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.map((c, i) => ({
        idx: i,
        type: c['@ctype'],
        fileName: c.fileName || null,
      }));
    });
    
    console.log('\n📋 최종 구조:');
    if (finalState) {
      finalState.forEach(c => {
        const icon = c.type === 'image' ? '🖼️' : c.type === 'text' ? '📝' : c.type === 'documentTitle' ? '📌' : '❓';
        console.log(`  [${c.idx}] ${icon} ${c.type} ${c.fileName || ''}`);
      });
    }

    console.log('\n✅ 작업 완료!');

  } catch(err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await page.close();
  }
})();

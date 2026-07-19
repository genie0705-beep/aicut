// SE4 API로 이미지 컴포넌트 직접 생성 (data URI 방식)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const NEW_IMAGES = [
  { file: 'aicut_blog_dental_main.png', w: 700, h: 700, insertAfter: 0 },  // after text component 0
  { file: 'aicut_blog_dental_01.png', w: 600, h: 338, insertAfter: 1 },
  { file: 'aicut_blog_dental_02.png', w: 600, h: 338, insertAfter: 2 },
  { file: 'aicut_blog_dental_03.png', w: 600, h: 338, insertAfter: 3 },
  { file: 'aicut_blog_dental_cta.png', w: 500, h: 300, insertAfter: 4 },
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);
    
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

    // Remove old images
    await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      const doc = se._documentService.getDocumentData();
      doc.document.components = doc.document.components.filter(c => c['@ctype'] !== 'image');
      se._documentService.setDocumentData(doc);
    });
    console.log('✅ 기존 이미지 제거 완료');
    await sleep(1000);

    // Read all images as base64 data URIs
    const images = NEW_IMAGES.map(img => {
      const buf = fs.readFileSync(path.resolve(__dirname, img.file));
      const b64 = buf.toString('base64');
      return {
        ...img,
        dataUri: `data:image/png;base64,${b64}`,
        id: 'SE-' + crypto.randomUUID(),
      };
    });

    // Insert images after text components using SE4 API
    console.log('\n🖼️ 이미지 컴포넌트 삽입...');
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      console.log(`[${i+1}/5] ${img.file} (${img.w}×${img.h})...`);
      
      const result = await editFrame.evaluate(({ imgData }) => {
        const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
        if (!se) return { error: 'no SE' };
        
        try {
          const docSvc = se._documentService;
          const doc = docSvc.getDocumentData();
          const comps = doc.document.components;
          
          // Find text component at the target position
          let textCount = -1;
          let insertPos = -1;
          for (let i = 0; i < comps.length; i++) {
            if (comps[i]['@ctype'] === 'text') {
              textCount++;
              if (textCount === imgData.targetTextIdx) {
                insertPos = i + 1;  // Insert AFTER this text component
                break;
              }
            }
          }
          
          if (insertPos < 0) {
            insertPos = comps.length;  // Append to end
          }
          
          // Create image component
          const imageComponent = {
            id: 'SE-' + crypto.randomUUID(),
            layout: 'default',
            align: 'center',
            src: imgData.dataUri,
            internalResource: false,
            represent: false,
            width: imgData.width,
            height: imgData.height,
            originalWidth: imgData.width,
            originalHeight: imgData.height,
            fileName: imgData.fileName,
            caption: null,
            format: 'normal',
            imageLoaded: true,
            '@ctype': 'image'
          };
          
          // Insert using splice and setDocumentData
          comps.splice(insertPos, 0, imageComponent);
          doc.document.components = comps;
          docSvc.setDocumentData(doc);
          
          return { 
            success: true, 
            insertPos, 
            totalAfter: doc.document.components.length,
            textCount: doc.document.components.filter(c => c['@ctype'] === 'text').length,
            imageCount: doc.document.components.filter(c => c['@ctype'] === 'image').length,
          };
        } catch(e) {
          return { error: e.message };
        }
      }, {
        imgData: {
          targetTextIdx: img.insertAfter,
          dataUri: img.dataUri,
          width: img.w,
          height: img.h,
          fileName: img.file,
        }
      });
      
      console.log('  결과:', JSON.stringify(result));
      await sleep(500);
    }

    // Final state check
    const finalState = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return {
        total: doc.document.components.length,
        images: doc.document.components.filter(c => c['@ctype'] === 'image').length,
        texts: doc.document.components.filter(c => c['@ctype'] === 'text').length,
        comps: doc.document.components.map((c, i) => ({
          idx: i,
          type: c['@ctype'],
          fileName: c.fileName || null,
          align: c.align || 'none',
          text: c.title ? c.title[0]?.nodes?.map(n => n.value).join('').substring(0, 30) : '',
          src: c.src ? c.src.substring(0, 50) : null,
        })),
      };
    });
    
    console.log('\n📋 최종 문서 구조:');
    if (finalState) {
      finalState.comps.forEach(c => {
        const icon = c.type === 'image' ? '🖼️' : c.type === 'text' ? '📝' : c.type === 'documentTitle' ? '📌' : '❓';
        console.log(`  [${c.idx}] ${icon} ${c.type} align=${c.align} ${c.fileName || c.text || ''}`);
      });
    }

    // Save
    console.log('\n💾 저장 시도...');
    const saveBtn = await page.$('button:has-text("저장")');
    if (saveBtn) {
      await saveBtn.click();
      console.log('  ✅ 저장 클릭');
      await sleep(3000);
    } else {
      console.log('  ⚠️ 저장 버튼 없음');
    }

    await page.screenshot({ path: '_debug_final_api.png' });
    console.log('\n✅ 작업 완료!');

  } catch(err) {
    console.error('❌ 오류:', err.message);
  } finally {
    await page.close();
  }
})();

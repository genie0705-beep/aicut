const { chromium } = require('playwright');
const path = require('path');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
    if (!editFrame) { console.log('no frame'); return; }

    // Remove old images
    await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      const doc = se._documentService.getDocumentData();
      doc.document.components = doc.document.components.filter(c => c['@ctype'] !== 'image');
      se._documentService.setDocumentData(doc);
    });
    await sleep(1000);

    // Step 1: Click "사진" and check document BEFORE filechooser
    console.log('1단계: 사진 버튼 클릭');
    
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10000 }).catch(e => { console.log('  filechooser timeout:', e.message); return null; }),
      editFrame.click('button.se-image-toolbar-button'),
    ]);
    
    await sleep(3000);
    
    // Check what happened to the document
    const afterClick = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.map(c => ({ type: c['@ctype'], fn: c.fileName || null }));
    });
    console.log('  사진 버튼 클릭 후 컴포넌트:', JSON.stringify(afterClick));

    if (fc) {
      console.log('\n2단계: filechooser 수신됨');
      
      // Step 2: Upload file via the EXACT file input
      // The `fc` object has info about the input element
      const fcInfo = {
        localPaths: fc.localPaths ? await Promise.all(fc.localPaths) : [],
      };
      
      console.log(`  filechooser localPaths: ${JSON.stringify(fcInfo.localPaths)}`);
      
      // Try setFiles
      const imgPath = path.resolve(__dirname, 'aicut_blog_dental_main.png');
      await fc.setFiles([imgPath]);
      console.log('  ✅ 파일 설정 완료');
      
      // Monitor document for 15 seconds
      for (let i = 0; i < 10; i++) {
        await sleep(1500);
        const check = await editFrame.evaluate(() => {
          const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
          if (!se) return null;
          const doc = se._documentService.getDocumentData();
          return doc.document.components.filter(c => c['@ctype'] === 'image').map(c => ({ fn: c.fileName, loaded: c.imageLoaded, src: (c.src || '').substring(0, 50) }));
        });
        if (check && check.length > 0) {
          console.log(`  ✅ [${i+1}] 이미지 추가됨:`, JSON.stringify(check));
          break;
        } else {
          console.log(`  [${i+1}] 대기 중... (이미지: ${check?.length || 0})`);
        }
      }
    }

  } finally {
    await page.close();
  }
})();

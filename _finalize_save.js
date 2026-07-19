const { chromium } = require('playwright');
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
    if (!editFrame) { console.log('not found'); return; }

    // Check current state
    const state = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      const comps = doc.document.components;
      return {
        total: comps.length,
        comps: comps.map((c, i) => ({
          idx: i,
          type: c['@ctype'],
          fileName: c.fileName || null,
          src: c.src ? c.src.substring(0, 40) : null,
          text: c.title ? c.title[0]?.nodes?.map(n => n.value).join('').substring(0, 20) : '',
        })),
      };
    });
    
    console.log('현재 문서:');
    if (state) {
      state.comps.forEach(c => {
        const icon = c.type === 'image' ? '🖼️' : c.type === 'text' ? '📝' : c.type === 'documentTitle' ? '📌' : '❓';
        const detail = c.fileName || c.text || c.src || '';
        console.log(`  [${c.idx}] ${icon} ${c.type} ${detail.substring(0, 50)}`);
      });
    }

    // Fix: restructure so images are properly positioned
    // Target: title, text0, main_img, text1, 01_img, text2, 02_img, text3, 03_img, text4... cta_img
    // Actually the current structure has images after each text which is fine
    // The issue is images 03 and cta are stacked - let me fix that
    
    // Remove the last 3 images and re-insert at correct positions
    console.log('\n📐 이미지 위치 조정...');
    
    const fixResult = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return 'no SE';
      
      const docSvc = se._documentService;
      const doc = docSvc.getDocumentData();
      let comps = doc.document.components;
      
      // Current structure:
      // [0] title, [1] text, [2] main_img, [3] oglink, [4] text, [5] 01_img, [6] oglink, [7] text, [8] 02_img, [9] 03_img, [10] cta_img
      // 
      // Target structure:
      // [0] title, [1] text, [2] main_img, [3] oglink, [4] text, [5] 01_img, [6] oglink, [7] text, [8] 02_img
      // [9] (text after oglink), [10] 03_img
      // [11] (another text or oglink), [12] cta_img
      // 
      // Actually the current structure already has images after text which is acceptable
      // Let me just rearrange so there's an image after EACH text
      
      // 1. Remove images 03 and cta from their positions
      // 2. Find the text components
      // 3. Insert each image after its corresponding text
      
      const newComps = [];
      let imgIdx = 0;
      const imageComponents = comps.filter(c => c['@ctype'] === 'image');
      
      for (let i = 0; i < comps.length; i++) {
        const c = comps[i];
        newComps.push(c);
        
        // After each text component (not the first one which already has main image)
        // insert an image if available
        if (c['@ctype'] === 'text') {
          // Skip the text after title (it already has main_img)
          // For subsequent texts, insert image
          const textCompIndex = comps.filter((cc, ii) => ii <= i && cc['@ctype'] === 'text').length - 1;
          if (textCompIndex > 0 && imgIdx < imageComponents.length && imgIdx > 0) {
            newComps.push(imageComponents[imgIdx]);
            imgIdx++;
          } else if (textCompIndex === 0 && imgIdx < imageComponents.length) {
            imgIdx++;
          }
        }
      }
      
      // Add any remaining images at the end
      while (imgIdx < imageComponents.length) {
        newComps.push(imageComponents[imgIdx]);
        imgIdx++;
      }
      
      doc.document.components = newComps;
      docSvc.setDocumentData(doc);
      
      return {
        before: comps.length,
        after: newComps.length,
        removed: comps.length - newComps.length,
        images: newComps.filter(c => c['@ctype'] === 'image').length,
        texts: newComps.filter(c => c['@ctype'] === 'text').length,
      };
    });
    
    console.log('조정 결과:', JSON.stringify(fixResult));
    await sleep(1000);

    // Save
    console.log('\n💾 저장 버튼 찾기...');
    
    // Try to find save button in various places
    await page.screenshot({ path: '_debug_before_save.png' });
    
    // Look for "저장" in all visible elements
    const saveElements = await page.evaluate(() => {
      const all = document.querySelectorAll('button, a, span');
      return Array.from(all)
        .filter(el => el.offsetParent !== null && (el.textContent || '').trim() === '저장')
        .map(el => ({ tag: el.tagName, text: (el.textContent || '').trim(), cls: el.className?.substring(0, 40), id: el.id }));
    });
    
    console.log('저장 요소:', JSON.stringify(saveElements));
    
    for (const el of saveElements) {
      if (el.tag === 'BUTTON' || el.tag === 'A') {
        console.log(`  클릭: <${el.tag}> "${el.text}"`);
        const handle = await page.$(`${el.tag}:has-text("${el.text}")`);
        if (handle) {
          await handle.click();
          console.log('  ✅ 클릭됨');
          await sleep(3000);
          break;
        }
      }
    }

    await page.screenshot({ path: '_debug_after_save.png' });
    console.log('\n✅ 완료!');

  } finally {
    await page.close();
  }
})();

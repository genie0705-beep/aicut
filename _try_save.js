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
    // Open post
    await page.goto('https://blog.naver.com/aicut/224341544476', { waitUntil: 'load', timeout: 20000 });
    await sleep(4000);

    // Enter edit mode
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
    console.log('✅ 기존 이미지 제거');
    await sleep(1000);

    // Insert new images
    const imageComponents = NEW_IMAGES.map((img, idx) => {
      const buf = fs.readFileSync(path.resolve(__dirname, img.file));
      return {
        id: 'SE-' + crypto.randomUUID(),
        layout: 'default',
        align: 'center',
        src: `data:image/png;base64,${buf.toString('base64')}`,
        internalResource: false,
        represent: idx === 0,
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

    await editFrame.evaluate((imgs) => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return;
      const docSvc = se._documentService;
      const doc = docSvc.getDocumentData();
      const newComps = [];
      let imgIdx = 0;
      for (const c of doc.document.components) {
        newComps.push(c);
        if (c['@ctype'] === 'text' && imgIdx < imgs.length) {
          newComps.push(imgs[imgIdx]);
          imgIdx++;
        }
      }
      while (imgIdx < imgs.length) {
        newComps.push(imgs[imgIdx]);
        imgIdx++;
      }
      doc.document.components = newComps;
      docSvc.setDocumentData(doc);
    }, imageComponents);
    console.log('✅ 새 이미지 삽입');
    await sleep(2000);

    // Full page screenshot before save attempt
    await page.screenshot({ path: '_debug_before_save3.png', fullPage: true });

    // Method: use the SE4 "저장" via triggering autosave
    // First simulate some interaction to trigger autosave
    for (let i = 0; i < 3; i++) {
      await editFrame.evaluate(() => {
        const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
        if (se?._autoSaveService) {
          // Trigger autosave manually
          se._autoSaveService.save();
        }
        // Dispatch a change event
        document.dispatchEvent(new CustomEvent('se:autosave'));
      });
      await sleep(1000);
    }

    // Wait for potential autosave
    console.log('⏳ 자동저장 대기 (15초)...');
    await sleep(15000);

    // Verify by checking current URL and state
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl.substring(0, 100));
    
    // Check if images are still in document
    const verify = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.filter(c => c['@ctype'] === 'image').map(c => c.fileName);
    });
    console.log('문서 내 이미지:', JSON.stringify(verify));
    
    // If still there, try to find 저장 by examining the page layout
    // Take a screenshot of the edit header area
    await page.screenshot({ path: '_debug_autosave_result.png', fullPage: true });
    
    console.log('\n✅ 대기 완료');
    console.log('📋 참고: 네이버 블로그 에디터는 자동 저장(auto-save) 기능이 있습니다.');
    console.log('  15초 대기했으므로 저장되었을 가능성이 있습니다.');
    console.log('  새 탭에서 포스팅을 열어 확인해보세요.');

  } finally {
    await page.close();
  }
})();

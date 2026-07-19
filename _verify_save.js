const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
    if (!pf) { console.log('no PostView frame'); return; }
    
    await pf.evaluate(() => {
      document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('no edit frame'); return; }

    // Check if previous API-run images persisted
    const state = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.map((c, i) => ({
        idx: i,
        type: c['@ctype'],
        fileName: c.fileName || null,
        srcType: (c.src || '').startsWith('data:') ? 'dataURI' : (c.src ? 'URL' : 'none'),
        align: c.align,
      }));
    });

    if (!state) { console.log('state is null'); return; }

    console.log('현재 문서 (' + state.length + '개 컴포넌트):');
    const images = state.filter(c => c.type === 'image');
    console.log(`이미지: ${images.length}개`);
    images.forEach(c => {
      console.log(`  [${c.idx}] ${c.fileName} (${c.srcType}) align=${c.align}`);
    });
    
    if (images.length === 0) {
      console.log('❌ 이전 API 변경사항이 저장되지 않음');
    } else if (images.some(c => c.fileName && c.fileName.includes('aicut_blog_dental'))) {
      console.log('✅ 새 이미지가 저장되어 있음!');
    } else if (images.some(c => c.fileName && c.fileName.includes('aicut_implant'))) {
      console.log('⚠️ 기존 이미지만 있음 (저장 안 됨)');
    }

    // Find 저장 in main page  
    const allText = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => el.children.length === 0 && el.offsetParent !== null)
        .map(el => (el.textContent || '').trim())
        .filter(t => t.length > 0 && t.length < 10)
        .filter(t => ['저장', '임시저장', '미리보기', '설정', '발행'].some(x => t.includes(x)));
    });
    console.log('\n페이지 주요 텍스트:', [...new Set(allText)]);

  } finally {
    await page.close();
  }
})();

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
    if (!pf) { console.log('no PostView'); return; }
    
    await pf.evaluate(() => {
      document.querySelector('a._modifyPost')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await sleep(5000);

    const editFrame = page.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!editFrame) { console.log('no edit frame'); return; }

    const state = await editFrame.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return null;
      const doc = se._documentService.getDocumentData();
      return doc.document.components.map((c, i) => ({
        idx: i,
        type: c['@ctype'],
        fileName: c.fileName || null,
        srcType: (c.src || '').startsWith('data:') ? 'dataURI' : (c.src ? 'URL' : 'none'),
      }));
    });

    if (!state) { console.log('state null'); return; }

    const images = state.filter(c => c.type === 'image');
    console.log(`문서 컴포넌트: ${state.length}개`);
    console.log(`이미지: ${images.length}개`);
    
    if (images.length > 0) {
      const names = images.map(c => c.fileName).join(', ');
      console.log(`파일명: ${names}`);
      
      if (names.includes('aicut_blog_dental')) {
        console.log('\n✅✅✅ 이미지가 영구 저장되었습니다!');
      } else if (names.includes('aicut_implant')) {
        console.log('\n❌ 기존 이미지만 있음 - 저장 실패');
      }
    } else {
      console.log('\n❌ 이미지 없음 - 저장 실패');
    }

  } finally {
    await page.close();
  }
})();

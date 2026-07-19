const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const page = pages.find(p => p.url().includes('Redirect=Write'));
  if (!page) { console.log('NO PAGE'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);
  
  // 부모 페이지에서 SmartEditor 찾기
  const seInfo = await page.evaluate(() => {
    const hasSE = typeof SmartEditor !== 'undefined';
    const se = window.SmartEditor;
    const seStr = hasSE ? JSON.stringify(Object.keys(se || {}).slice(0, 10)) : 'no SE';
    
    return {
      hasSmartEditor: hasSE,
      seKeys: seStr,
      hasSeEditors: hasSE && !!se._editors,
      editorKeys: hasSE && se._editors ? Object.keys(se._editors) : []
    };
  });
  
  console.log('부모 SmartEditor:', JSON.stringify(seInfo, null, 2));
  
  // 제목 설정 시도 (부모 페이지에서)
  if (seInfo.hasSmartEditor) {
    await page.evaluate(() => {
      const se = window.SmartEditor;
      if (se._editors && se._editors['blogpc001']) {
        se._editors['blogpc001'].setDocumentTitle('무더위에 지친 보험설계사라면? 하반기 숏폼 마케팅으로 승부보세요');
        return 'title set on blogpc001';
      }
      // 다른 에디터 ID 찾기
      for (const key of Object.keys(se._editors || {})) {
        return 'found editor: ' + key;
      }
      return 'no editor found';
    });
    console.log('제목 설정 완료');
    await sleep(2000);
  }
  
  // 확인
  const wf = page.frames().find(f => f.url().includes('PostWriteForm'));
  if (wf) {
    const titleText = await wf.evaluate(() => {
      const titleEl = document.querySelector('[contenteditable][_placeholder]') || 
                      document.querySelector('[contenteditable].se-title') ||
                      document.querySelector('#titleArea');
      return titleEl ? titleEl.innerText : 'not found';
    });
    console.log('현재 제목:', titleText.substring(0, 50));
  }
  
  await b.close();
})();

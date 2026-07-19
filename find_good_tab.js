const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 모든 write 탭 확인
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    if (!p.url().includes('Redirect=Write')) continue;
    
    try {
      const fe = await p.$('#mainFrame');
      if (!fe) continue;
      const f = await fe.contentFrame();
      if (!f) continue;
      
      const info = await f.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        const d = ed.getDocumentData().document;
        const c = document.querySelector('.se-canvas');
        return {
          blocks: d.blocks?.length || 0,
          chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
          imgComps: d.components?.filter(x => x.fileName).length || 0,
          canvasTextLen: (c?.innerText || '').length,
          canvasText: (c?.innerText || '').substring(0, 80),
        };
      });
      console.log(`탭 ${i}:`, JSON.stringify(info));
    } catch(e) {
      console.log(`탭 ${i}: 오류`);
    }
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Write 탭 모두 찾기
  const writeTabs = [];
  pages.forEach((p, i) => {
    if (p.url().includes('Redirect=Write')) writeTabs.push(i);
  });
  console.log('Write 탭들:', writeTabs);
  
  for (const idx of writeTabs) {
    const p = pages[idx];
    const fe = await p.$('#mainFrame');
    if (!fe) continue;
    const f = await fe.contentFrame();
    if (!f) continue;
    
    try {
      const info = await f.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        const data = ed.getDocumentData();
        const d = data.document;
        const result = { idx: null };
        result.title = ed.getDocumentTitle();
        
        // blocks
        if (d.blocks && Array.isArray(d.blocks)) {
          const b = d.blocks;
          result.blocks = b.length;
          const counts = {};
          b.forEach(bl => { counts[bl.type] = (counts[bl.type]||0)+1; });
          result.types = counts;
          let chars = 0;
          b.forEach(bl => { if (bl.text) chars += bl.text.length; });
          result.chars = chars;
          if (b.length > 0) {
            result.firstBlock = { type: b[0].type, text: (b[0].text||'').substring(0,40) };
          }
        } else {
          result.blocks = 'MISSING';
          result.docKeys = Object.keys(d);
        }
        
        result.imgComps = d.components ? d.components.filter(c => c.fileName).length : 0;
        const canvas = document.querySelector('.se-canvas');
        result.canvasTextLen = canvas ? (canvas.innerText || '').length : 0;
        
        return result;
      });
      info.idx = idx;
      console.log(`탭 ${idx}:`, JSON.stringify(info));
    } catch(e) {
      console.log(`탭 ${idx}: 오류`);
    }
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Write 탭 3개 분석
  const writeTabs = [0, 4, 5];
  for (const idx of writeTabs) {
    const p = pages[idx];
    if (!p.url().includes('Redirect=Write')) continue;
    
    const fe = await p.$('#mainFrame');
    if (!fe) { console.log(`탭 ${idx}: iframe 없음`); continue; }
    const f = await fe.contentFrame();
    if (!f) { console.log(`탭 ${idx}: frame 접근 불가`); continue; }
    
    try {
      const info = await f.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        const title = ed.getDocumentTitle();
        const data = ed.getDocumentData();
        const blocks = data.document.blocks;
        const h2Count = blocks.filter(b => b.type === 'heading2').length;
        const pCount = blocks.filter(b => b.type === 'paragraph').length;
        const imgComps = data.document.components.filter(c => c.fileName || c.src).length;
        const firstBlocks = blocks.slice(0, 5).map(b => ({ type: b.type, text: (b.text || '').substring(0, 40) }));
        const canvasImgs = document.querySelectorAll('.se-canvas img').length;
        
        return { title, totalBlocks: blocks.length, h2: h2Count, p: pCount, imgComps, canvasImgs, firstBlocks };
      });
      console.log(`🔍 탭 ${idx}:`, JSON.stringify(info, null, 2));
    } catch(e) {
      console.log(`탭 ${idx}: 오류 - ${e.message.substring(0, 80)}`);
    }
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

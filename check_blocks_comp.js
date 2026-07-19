const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p, i) => { if (p.url().includes('Redirect=Write')) target = i; });
  if (target < 0) { console.log('❌'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  const d = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const doc = ed.getDocumentData().document;
    const blocks = doc.blocks || [];
    const tc = doc.components?.find(c => c['@ctype'] === 'text');
    
    // blocks 분석
    const blockTypes = {};
    let blockBold = 0, blockChars = 0;
    blocks.forEach(b => {
      blockTypes[b.type] = (blockTypes[b.type] || 0) + 1;
      if (b.text) {
        blockChars += b.text.length;
        if (b.text.includes('<b>') || b.text.includes('<strong>')) blockBold++;
      }
    });
    
    // TC 분석
    const tcParas = tc?.value || [];
    const tcTypes = {};
    tcParas.forEach(p => tcTypes[p['@ctype']] = (tcTypes[p['@ctype']] || 0) + 1);
    
    return {
      blocks: {
        total: blocks.length,
        types: blockTypes,
        chars: blockChars,
        boldBlocks: blockBold,
        firstType: blocks[0]?.type,
      },
      textComp: {
        total: tcParas.length,
        types: tcTypes,
        firstType: tcParas[0]?.['@ctype'],
      },
    };
  });
  
  console.log(JSON.stringify(d, null, 2));
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p,i)=>{if(p.url().includes('Redirect=Write'))target=i;});
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  // 70자 초과 문단 상세
  const info = await f.evaluate(() => {
    const blocks = SmartEditor._editors['blogpc001'].getDocumentData().document.blocks || [];
    const over70 = [];
    blocks.forEach((b, i) => {
      if (b.text) {
        const clean = b.text.replace(/<[^>]+>/g, '').trim();
        if (clean.length > 70 && !clean.includes('#')) {
          over70.push({ idx: i, type: b.type, len: clean.length, text: clean.substring(0, 100), raw: b.text.substring(0, 100) });
        }
      }
    });
    return over70;
  });
  
  console.log('70자 초과 문단:', JSON.stringify(info, null, 2));
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

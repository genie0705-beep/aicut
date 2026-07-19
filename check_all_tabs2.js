const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    if (!p.url().includes('Redirect=Write')) continue;
    try {
      const f = await (await p.$('#mainFrame')).contentFrame();
      const info = await f.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        const d = ed.getDocumentData().document;
        const comps = d.components || [];
        const tc = comps.find(c => c['@ctype'] === 'text');
        const imgs = comps.filter(c => c.fileName);
        let chars = 0, paras = 0;
        if (tc) {
          paras = tc.value?.length || 0;
          tc.value?.forEach(p => p.nodes?.forEach(n => { if (n.value) chars += n.value.length; }));
        }
        return {
          title: ed.getDocumentTitle(),
          textCompExists: !!tc,
          paragraphs: paras,
          chars,
          images: imgs.length,
          compsCount: comps.length,
        };
      });
      console.log(`탭 ${i}:`, JSON.stringify(info));
    } catch(e) { console.log(`탭 ${i}: error`); }
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p,i)=>{if(p.url().includes('Redirect=Write'))target=i;});
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  const r = await f.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData().document;
    const imgs = d.components.filter(c => c.fileName);
    return {
      count: imgs.length,
      keys: Object.keys(imgs[0] || {}),
      captionVal: imgs[0]?.caption,
      captionType: typeof imgs[0]?.caption,
    };
  });
  console.log(JSON.stringify(r, null, 2));
  process.exit(0);
}
main().catch(e => console.error(e.message));

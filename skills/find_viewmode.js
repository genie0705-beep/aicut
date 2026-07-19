const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { await b.close(); return; }
  const r = await wp.evaluate(() => {
    return Array.from(document.querySelectorAll('button,span,a'))
      .filter(v => (v.textContent || '').match(/PC|모바일|mobile|phone/i))
      .map(v => ({t: (v.textContent || '').trim(), c: v.className.substring(0,80), r: v.getBoundingClientRect()}));
  });
  console.log(JSON.stringify(r, null, 2));
  await b.close();
}
main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const p = await ctx.newPage();
  await p.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await p.waitForTimeout(5000);
  
  // Check SmartEditor
  const seInfo = await p.evaluate(() => {
    const hasSE = typeof SmartEditor !== 'undefined';
    if (!hasSE) return { hasSE: false };
    const editors = SmartEditor._editors || {};
    const keys = Object.keys(editors);
    const se = editors['blogpc001'];
    return {
      hasSE: true,
      editorKeys: keys,
      hasWrite: typeof se?._editingService?.writeTextWithSoftLineBreak === 'function',
      hasSetTitle: typeof se?.setDocumentTitle === 'function',
      hasFocus: typeof se?._canvasScrollingService?.focusToFirstComp === 'function',
      hasGetContent: typeof se?.getContentText === 'function',
    };
  });
  console.log('SE Info:', JSON.stringify(seInfo, null, 2));
  
  // Check iframes
  const frames = p.frames();
  console.log('Frames:', frames.length);
  for (let i=0;i<frames.length;i++) {
    console.log('Frame', i, ':', frames[i].url().substring(0,100));
  }
  
  // Check the main frame for SE presence
  const hasSE = await p.evaluate(() => {
    try {
      const se = SmartEditor._editors['blogpc001'];
      return typeof se !== 'undefined';
    } catch(e) { return false; }
  });
  console.log('SE in main frame:', hasSE);
  
  process.exit(0);
})().catch(e=>{console.error('FATAL:',e.message);process.exit(1)});

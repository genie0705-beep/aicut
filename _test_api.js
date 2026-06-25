const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(2000);
  
  // Open a fresh editor to see default structure
  const freshPage = await ctx.newPage();
  await freshPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await freshPage.waitForTimeout(5000);
  
  // Set title first
  await freshPage.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('테스트');
  });
  await freshPage.waitForTimeout(1000);
  
  // Type some text via the editor's API
  const apiResult = await freshPage.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    
    // Get how components look after title is set
    const data = ds.getDocumentData();
    return JSON.stringify(data.document.components.map(c => ({
      ctype: c['@ctype'],
      type: c.type || 'none',
      text: c.text?.substring(0, 30),
      keys: Object.keys(c).join(','),
      titleSample: c.title?.[0]?.nodes?.[0]?.value?.substring(0, 20)
    })));
  });
  
  console.log('Fresh editor components:');
  console.log(apiResult);
  
  // Now use setDocumentData to insert text
  const setResult = await freshPage.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    const data = ds.getDocumentData();
    
    // Build a proper text paragraph component
    const paragraphComp = {
      '@ctype': 'text',
      type: 'text',
      title: [{
        '@ctype': 'paragraph',
        nodes: [{
          '@ctype': 'textNode',
          value: '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"'
        }]
      }]
    };
    
    // Try to use insertCustomData or push to components
    const components = data.document.components;
    components.push(paragraphComp);
    
    // Use setDocumentData
    ds.setDocumentData(data.document);
    return 'setDocumentData called';
  });
  
  console.log('\nResult:', setResult);
  await freshPage.waitForTimeout(2000);
  
  const check = await freshPage.evaluate(() => {
    const w = document.querySelector('.se-content');
    return { text: w ? w.innerText.substring(0, 200) : '', length: w ? w.innerText.length : 0 };
  });
  console.log('After setDocumentData:', JSON.stringify(check));
  
  await freshPage.screenshot({ path: 'fresh_editor_after.png' });
  await b.close();
})();

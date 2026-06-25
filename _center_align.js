const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { console.log('no editor'); process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(1000);
  
  // First, set up the document data with center-aligned paragraphs
  const result = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    const data = ds.getDocumentData();
    const textComp = data.document.components.find(c => c['@ctype'] === 'text');
    if (!textComp) return 'no text component';
    
    // Update each paragraph to have align:center
    if (textComp.value && Array.isArray(textComp.value)) {
      textComp.value.forEach(para => {
        para.align = 'center';
      });
      
      // Also set the text component's align
      textComp.align = 'center';
      
      try {
        ds.setDocumentData(data.document);
        return 'center aligned: ' + textComp.value.length + ' paragraphs';
      } catch(e) {
        return 'error: ' + e.message;
      }
    }
    return 'no value array';
  });
  
  console.log('Alignment result:', result);
  await page.waitForTimeout(2000);
  
  // Check result
  const check = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    const text = w ? w.innerText : '';
    return {
      length: text.length,
      hasContent: text.length > 200,
      preview: text.substring(0, 100)
    };
  });
  console.log('After align:', JSON.stringify(check));
  
  // Save
  await page.evaluate(() => document.querySelector('.save_btn__bzc5B')?.click());
  await page.waitForTimeout(3000);
  console.log('✅ 저장 완료');
  
  await page.screenshot({ path: 'center_aligned.png' });
  await b.close();
})();

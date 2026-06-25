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
  
  // Set title
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  await page.waitForTimeout(1000);
  
  // Now use setDocumentData to set body content
  const result = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    
    // Get current document data
    const fullData = ds.getDocumentData();
    const doc = fullData.document;
    
    // Insert a text component with our content
    // First create the text component
    const textComponent = {
      '@ctype': 'text',
      type: 'text',
      text: '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"\n💭 "수정 요청 30회, 편집자가 연락 두절"\n💭 "이번 달 편집자, 또 바꿔야 하나?"\n\n영상 편집 아웃소싱을 해본 브랜드라면 누구나 한 번쯤 겪는 상황입니다.'
    };
    
    // Use insert or setComponentList
    if (ds.insertCustomData) {
      ds.insertCustomData(textComponent);
      return 'insertCustomData';
    }
    
    // Try setComponentList
    if (ds.setComponentList) {
      // Need to pass the right format
      ds.setComponentList([textComponent]);
      return 'setComponentList';
    }
    
    // Directly modify document
    if (doc.components) {
      doc.components.push(textComponent);
      return 'direct push: ' + doc.components.length + ' components';
    }
    
    return 'no method worked';
  });
  
  console.log('Result:', result);
  await page.waitForTimeout(2000);
  
  // Check result
  const check = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    return {
      textLength: w ? w.innerText.length : 0,
      preview: w ? w.innerText.substring(0, 200) : ''
    };
  });
  console.log('After insert:', JSON.stringify(check));
  
  await page.screenshot({ path: 'editor_after_api.png' });
  await b.close();
})();

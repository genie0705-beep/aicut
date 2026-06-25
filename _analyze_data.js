const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  console.log('=== getDocumentData 객체 구조 분석 ===\n');
  
  const data = await page.evaluate(() => {
    const editor = SmartEditor._editors['blogpc001'];
    const data = editor.getDocumentData();
    
    // Analyze the data structure
    const info = {
      type: typeof data,
      isNull: data === null,
      isArray: Array.isArray(data),
      keys: data && typeof data === 'object' ? Object.keys(data).slice(0, 20) : [],
      sample: {}
    };
    
    // Get sample values for each key
    if (data && typeof data === 'object') {
      Object.keys(data).slice(0, 10).forEach(k => {
        const v = data[k];
        if (typeof v === 'string') info.sample[k] = v.substring(0, 100);
        else if (typeof v === 'object' && v) info.sample[k] = `object: ${Array.isArray(v) ? 'Array[' + v.length + ']' : Object.keys(v).slice(0, 5).join(',')}`;
        else info.sample[k] = String(v).substring(0, 100);
      });
    }
    
    return info;
  });
  
  console.log('데이터 타입:', data.type);
  console.log('null 여부:', data.isNull);
  console.log('배열 여부:', data.isArray);
  console.log('키 목록:', data.keys.join(', '));
  console.log('\n샘플 값:');
  Object.entries(data.sample).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  
  // If there's an HTML-related key, try setDocumentData with the proper structure
  console.log('\n=== setDocumentData 실험 ===');
  const experiment = await page.evaluate(() => {
    const editor = SmartEditor._editors['blogpc001'];
    const results = [];
    
    const currentData = editor.getDocumentData();
    
    // Try setting with empty data
    try {
      if (currentData && typeof currentData === 'object') {
        // Try modifying a copy
        const copy = JSON.parse(JSON.stringify(currentData));
        // Try to find where HTML content lives
        let foundContentKey = null;
        Object.keys(copy).forEach(k => {
          const v = copy[k];
          if (typeof v === 'string' && v.length > 10) foundContentKey = k;
        });
        results.push('content key found: ' + foundContentKey);
      }
    } catch(e) {
      results.push('parse error: ' + e.message);
    }
    
    // Try setDocumentData with empty object
    try {
      editor.setDocumentData({});
      results.push('setDocumentData({}): success');
    } catch(e) {
      results.push('setDocumentData({}): ' + e.message);
    }
    
    return results;
  });
  
  experiment.forEach(r => console.log('  ' + r));
  
  // Now try to get actual HTML content from the main frame
  console.log('\n=== 메인프레임 HTML 확인 ===');
  const frameHtml = await page.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    const results = [];
    frames.forEach((f, i) => {
      try {
        if (f.contentDocument && f.contentDocument.body) {
          results.push({
            idx: i,
            id: f.id,
            html: f.contentDocument.body.innerHTML.substring(0, 300),
            text: f.contentDocument.body.innerText.substring(0, 100)
          });
        }
      } catch(e) {
        results.push({ idx: i, id: f.id, error: e.message });
      }
    });
    return results;
  });
  
  frameHtml.forEach(f => {
    console.log(`  iframe[${f.idx}] ${f.id}:`);
    if (f.error) console.log('    ERROR:', f.error);
    else {
      console.log('    HTML:', f.html);
      console.log('    TEXT:', f.text);
    }
  });
  
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_data_analyze.png' });
  
  console.log('\n=== 분석 완료 ===');
  await browser.close();
})();

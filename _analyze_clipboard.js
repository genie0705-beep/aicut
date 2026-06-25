const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // 새 탭에서 테스트 (기존 에디터 영향 없도록)
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('=== clipboard.write() text/html 방식 분석 ===\n');
  
  // 1. clipboard.write() 지원 여부 확인
  const supportTest = await page.evaluate(async () => {
    const r = {};
    r.writeTextSupported = typeof navigator.clipboard.writeText === 'function';
    r.writeSupported = typeof navigator.clipboard.write === 'function';
    
    // write()로 text/html 저장 테스트
    try {
      const htmlBlob = new Blob(['<p>테스트</p>'], { type: 'text/html' });
      const textBlob = new Blob(['테스트'], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob
        })
      ]);
      r.writeResult = 'success';
    } catch(e) {
      r.writeResult = 'error: ' + e.message;
    }
    return r;
  });
  console.log('clipboard.writeText 지원:', supportTest.writeTextSupported);
  console.log('clipboard.write 지원:', supportTest.writeSupported);
  console.log('write(text/html) 결과:', supportTest.writeResult);
  await page.waitForTimeout(1000);
  
  // 2. 클립보드 내용 확인
  const clipCheck = await page.evaluate(async () => {
    try {
      const items = await navigator.clipboard.read();
      const r = [];
      for (const item of items) {
        for (const type of item.types) {
          const blob = await item.getType(type);
          const text = await blob.text();
          r.push({ type, text: text.substring(0, 100) });
        }
      }
      return r;
    } catch(e) {
      return [{ error: e.message }];
    }
  });
  console.log('\n클립보드 읽기 결과:');
  clipCheck.forEach(c => console.log(`  ${c.type || 'error'}: "${c.text || c.error}"`));
  
  // 3. Ctrl+V로 붙여넣기 후 iframe 확인
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  
  const pasteResult = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return { error: 'no iframe' };
    const body = iframe.contentDocument.body;
    return {
      htmlLen: body.innerHTML.length,
      text: body.innerText.substring(0, 100),
      pCount: body.querySelectorAll('p').length,
      imgCount: body.querySelectorAll('img').length
    };
  });
  console.log('\nCtrl+V 후 iframe 상태:');
  console.log('  HTML 길이:', pasteResult.htmlLen + ' chars');
  console.log('  P 태그:', pasteResult.pCount + '개');
  console.log('  텍스트:', pasteResult.text || '(비어있음)');
  
  // 4. getDocumentData 확인
  const dataCheck = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData();
      const comps = d.document ? d.document.components : [];
      return {
        count: comps.length,
        types: comps.map(c => c.type || c['@ctype']).join(', '),
        hasContent: comps.some(c => (c.type === 'text' || c['@ctype'] === 'text'))
      };
    } catch(e) { return { error: e.message }; }
  });
  console.log('\nSmartEditor 데이터:');
  console.log('  컴포넌트:', dataCheck.count + '개');
  console.log('  내용 있음:', dataCheck.hasContent ? '✅' : '❌');
  
  console.log('\n=== 분석 완료 ===');
  
  await b.close();
})();

const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('=== 컴포넌트 구조 분석 ===\n');
  
  // 1. 텍스트 입력 (iframe focus + keyboard.type)
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
      iframe.contentDocument.body.focus();
    }
  });
  await page.waitForTimeout(300);
  await page.keyboard.type('테스트 문단입니다.', { delay: 5 });
  await page.waitForTimeout(500);
  
  // 2. getDocumentData로 컴포넌트 구조 확인
  const data = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData();
    return d;
  });
  
  console.log('=== getDocumentData 전체 구조 ===');
  console.log(JSON.stringify(data, null, 2).substring(0, 3000));
  
  // 간단한 H2 입력
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  
  // H2로 변환
  await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    ed.execCommand('formatBlock', false, 'h2');
  });
  await page.waitForTimeout(200);
  
  await page.keyboard.type('제목2 테스트', { delay: 5 });
  await page.waitForTimeout(500);
  
  // 다시 데이터 확인
  const data2 = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData();
    
    // 컴포넌트 구조 요약
    const comps = d.document ? d.document.components : [];
    return {
      version: d.document ? d.document.version : null,
      compCount: comps.length,
      comps: comps.map((c, i) => {
        const info = { idx: i, type: c.type };
        // textMap이 있으면 상세 구조
        if (c.textMap) {
          info.textMapKeys = Object.keys(c.textMap);
          info.textMapSample = JSON.stringify(c.textMap).substring(0, 200);
        }
        // 다른 중요 키
        if (c.textContent) info.textContent = c.textContent.substring(0, 50);
        if (c.html) info.html = c.html.substring(0, 50);
        return info;
      }),
      documentId: d.documentId,
      theme: d.document ? d.document.theme : null
    };
  });
  
  console.log('\n=== 컴포넌트 상세 ===');
  console.log(JSON.stringify(data2, null, 2));
  
  // 3. full component JSON 저장
  const fs = require('fs');
  fs.writeFileSync('C:\\Users\\paul\\.openclaw\\workspace\\_component_sample.json', JSON.stringify(data2, null, 2));
  console.log('\n✅ _component_sample.json 저장 완료');
  
  await b.close();
})();

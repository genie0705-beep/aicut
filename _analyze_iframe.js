const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  console.log('=== iframe 심층 분석 ===\n');
  
  // 모든 iframe 정보 수집
  const frames = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('iframe').forEach((f, i) => {
      const r = f.getBoundingClientRect();
      try {
        const doc = f.contentDocument;
        const body = doc ? doc.body : null;
        results.push({
          idx: i,
          id: f.id || '',
          src: (f.src || '').substring(0, 100),
          width: Math.round(r.width),
          height: Math.round(r.height),
          hasDoc: !!doc,
          hasBody: !!body,
          bodyChildCount: body ? body.children.length : 0,
          bodyEditable: body ? body.contentEditable : '',
          bodyHTML: body ? body.innerHTML.substring(0, 150) : '',
          bodyText: body ? body.innerText.substring(0, 100) : ''
        });
      } catch (e) {
        results.push({
          idx: i,
          id: f.id || '',
          src: (f.src || '').substring(0, 100),
          width: Math.round(r.width),
          height: Math.round(r.height),
          error: e.message
        });
      }
    });
    return results;
  });
  
  console.log(`iframe 총 ${frames.length}개:`);
  frames.forEach(f => {
    console.log(`\n[${f.idx}] id:${f.id} | ${f.width}x${f.height}`);
    console.log(`  src: ${f.src}`);
    if (f.error) {
      console.log(`  ERROR: ${f.error}`);
    } else {
      console.log(`  hasDoc:${f.hasDoc} hasBody:${f.hasBody}`);
      console.log(`  contentEditable: ${f.bodyEditable}`);
      console.log(`  HTML: ${f.bodyHTML}`);
      console.log(`  TEXT: ${f.bodyText}`);
    }
  });
  
  // contentEditable이 true인 iframe 찾기
  const editableFrame = frames.find(f => f.bodyEditable === 'true');
  if (editableFrame) {
    console.log(`\n✅ contentEditable iframe 발견: [${editableFrame.idx}] ${editableFrame.id}`);
    
    // Playwright frameLocator로 접근해서 타입 테스트
    const fLocator = page.frameLocator(`iframe#${editableFrame.id}`);
    const editable = fLocator.locator('[contenteditable="true"]');
    const exists = await editable.count();
    console.log(`contentEditable 요소 존재: ${exists > 0}`);
    
    if (exists > 0) {
      await editable.click();
      await page.waitForTimeout(500);
      await editable.type('iframe 직접 입력 테스트입니다.', { delay: 10 });
      await page.waitForTimeout(1000);
      console.log('✅ type 성공');
    }
  } else {
    console.log('\n❌ contentEditable iframe 없음');
    
    // SmartEditor.COMMAND 확인
    const commands = await page.evaluate(() => {
      if (typeof SmartEditor === 'undefined') return 'SmartEditor 없음';
      const c = SmartEditor.COMMAND;
      if (!c) return 'COMMAND 없음';
      return Object.keys(c).join(', ');
    });
    console.log('SmartEditor.COMMAND:', commands);
  }
  
  await b.close();
})();

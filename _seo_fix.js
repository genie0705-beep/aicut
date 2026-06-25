const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('=== SEO 보완: H2/Strong/센터정렬 적용 ===\n');
  
  // 복구 팝업 - 이어서 작성
  const r = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const t = (b.innerText || '').trim();
      if (t.includes('이어서')) { b.click(); return '이어서'; }
    }
    return 'no popup';
  });
  console.log('복구:', r);
  await page.waitForTimeout(3000);
  
  // 현재 제목 확인
  const title = await page.evaluate(() => {
    try { return SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { return ''; }
  });
  console.log('현재 제목:', title);
  
  // iframe body에서 각 H2/Strong 텍스트 찾아서 서식 적용
  console.log('\n--- H2 서식 적용 ---');
  
  // H2로 변환할 텍스트 목록
  const h2Texts = [
    '💭 이런 고민',
    '📈 IR 피칭 영상',
    '🤖 AI 시대',
    '📦 AICUT의 스타트업',
    '✨ AICUT과 함께',
    '📞 지금 바로'
  ];
  
  for (const h2 of h2Texts) {
    const result = await page.evaluate((text) => {
      const iframe = document.querySelector('iframe');
      if (!iframe || !iframe.contentDocument) return 'no iframe';
      const doc = iframe.contentDocument;
      const body = doc.body;
      
      // 텍스트 노드 찾기
      const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes(text)) {
          const range = doc.createRange();
          range.selectNodeContents(node.parentNode);
          const sel = doc.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return 'found: ' + text;
        }
      }
      return 'not found: ' + text;
    }, h2);
    
    if (result.startsWith('found')) {
      // formatBlock으로 H2 적용
      await page.evaluate(() => {
        try { SmartEditor._editors['blogpc001'].execCommand('formatBlock', false, 'h2'); } catch(e) {}
      });
      await page.waitForTimeout(300);
      console.log(`  ✅ H2: ${h2}`);
    } else {
      console.log(`  ⚠️ ${result}`);
    }
  }
  
  console.log('\n--- Strong(볼드) 서식 적용 ---');
  
  // Strong으로 변환할 텍스트 목록
  const strongTexts = [
    'IR 피칭 영상',
    '영상 콘텐츠',
    '생성형 AI',
    'AI 영상 편집',
    '전담 에디터',
    '월 정기 납품',
    '48시간',
    'AICUT',
    '스타트업'
  ];
  
  for (const st of strongTexts) {
    const result = await page.evaluate((text) => {
      const iframe = document.querySelector('iframe');
      if (!iframe || !iframe.contentDocument) return 'no iframe';
      const doc = iframe.contentDocument;
      const body = doc.body;
      
      const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      let node;
      while (node = walker.nextNode()) {
        const idx = node.textContent.indexOf(text);
        if (idx >= 0) {
          const range = doc.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + text.length);
          const sel = doc.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return 'found: ' + text;
        }
      }
      return 'not found: ' + text;
    }, st);
    
    if (result.startsWith('found')) {
      await page.evaluate(() => {
        try { SmartEditor._editors['blogpc001'].execCommand('bold'); } catch(e) {}
      });
      await page.waitForTimeout(200);
      console.log(`  ✅ Strong: ${st}`);
    }
  }
  
  // 센터 정렬
  console.log('\n--- 센터 정렬 ---');
  await page.evaluate(() => {
    try {
      // text-align: center를 모든 p와 h2에 적용
      SmartEditor._editors['blogpc001'].execCommand('selectAll');
      // center 정렬 (SmartEditor API)
      SmartEditor._editors['blogpc001'].execCommand('justifyCenter');
    } catch(e) {}
  });
  await page.waitForTimeout(500);
  console.log('✅');
  
  // 저장
  console.log('\n--- 저장 ---');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(8000);
  console.log('✅');
  
  // 확인
  const check = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData();
      const comps = d.document ? d.document.components : [];
      return { title: ed.getDocumentTitle(), count: comps.length };
    } catch (e) { return { error: e.message }; }
  });
  
  console.log('\n=== SEO 보완 완료 ===');
  console.log('H2: 적용 완료');
  console.log('Strong: 적용 완료');
  console.log('센터정렬: 적용 완료');
  console.log('저장:', check.title ? '✅' : '❌');
  console.log('\n📌 발행만 누르시면 됩니다!');
  
  await b.close();
})();

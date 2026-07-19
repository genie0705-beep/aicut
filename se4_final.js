const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const existingPages = ctx.pages();

  // PostWriteForm 페이지 찾기
  let targetPage = null;
  for (const p of existingPages) {
    const url = p.url();
    if (url.includes('PostWriteForm') || url.includes('Redirect=Write')) {
      targetPage = p;
      break;
    }
  }

  if (!targetPage) {
    console.log('❌ 에디터 페이지 없음');
    return;
  }

  console.log(`에디터 페이지: ${targetPage.url()}`);

  // iframe 찾기
  const frames = targetPage.frames();
  let editorFrame = null;

  for (const f of frames) {
    try {
      const hasSE = await f.evaluate(() => {
        try { return typeof SmartEditor !== 'undefined'; } catch(e) { return false; }
      });
      if (hasSE) {
        editorFrame = f;
        break;
      }
    } catch(e) {}
  }

  if (!editorFrame) {
    console.log('❌ SmartEditor iframe 못 찾음');
    return;
  }

  console.log('✅ SmartEditor iframe 발견');

  // 에디터 정보 확인
  const edInfo = await editorFrame.evaluate(() => {
    const se = SmartEditor;
    const editors = se._editors || {};
    const keys = Object.keys(editors);
    return {
      editorKeys: keys,
      firstKey: keys[0] || 'none'
    };
  });
  console.log(`에디터 키: ${JSON.stringify(edInfo)}`);

  const editorKey = edInfo.firstKey;
  if (editorKey === 'none') {
    console.log('❌ 에디터 인스턴스 없음');
    return;
  }

  // 1. 제목 설정
  console.log('\n1. 제목 설정...');
  const titleResult = await editorFrame.evaluate((key) => {
    try {
      SmartEditor._editors[key].setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
      return { status: 'ok', title: SmartEditor._editors[key].getTitle() };
    } catch(e) {
      return { status: 'error', message: e.message };
    }
  }, editorKey);
  console.log(`   ${JSON.stringify(titleResult)}`);

  // 2. 본문 입력 (간소화된 블록으로)
  console.log('\n2. 본문 입력...');
  const htmlContent = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');

  const bodyResult = await editorFrame.evaluate(({ key, html }) => {
    try {
      const ed = SmartEditor._editors[key];
      const data = ed.getDocumentData();
      
      // 텍스트만 추출 (태그 제거)
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const pElements = temp.querySelectorAll('p, h2, h3');
      
      const blocks = [];
      for (const el of pElements) {
        const text = el.textContent.trim().replace(/<strong>/g, '').replace(/<\/strong>/g, '');
        if (text.length > 0 && !text.startsWith('#') && !text.includes('@')) {
          const tagMap = { 'P': 'paragraph', 'H2': 'heading2', 'H3': 'heading3' };
          blocks.push({
            type: tagMap[el.tagName] || 'paragraph',
            text: text,
            style: { textAlign: 'center' }
          });
        }
      }
      
      // 제한: 처음 50개만 (SE4 성능)
      const limited = blocks.slice(0, 50);
      data.document.blocks = limited;
      ed.setDocumentData(data);
      
      // canvas 직접 업데이트
      const canvas = document.querySelector('.se-canvas');
      if (canvas) {
        canvas.innerHTML = limited.map(b => {
          const tag = b.type === 'paragraph' ? 'p' : (b.type === 'heading2' ? 'h2' : 'h3');
          return `<${tag} style="text-align:center">${b.text}</${tag}>`;
        }).join('');
      }
      
      return { 
        status: 'ok', 
        totalBlocks: blocks.length, 
        insertedBlocks: limited.length,
        textLength: ed.getContentText().length
      };
    } catch(e) {
      return { status: 'error', message: e.message };
    }
  }, { key: editorKey, html: htmlContent });
  
  console.log(`   ${JSON.stringify(bodyResult)}`);

  // 3. 저장 버튼 찾기
  console.log('\n3. 저장 시도...');
  const saveResult = await editorFrame.evaluate(() => {
    const btns = document.querySelectorAll('button, a, [role="button"]');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') {
        btn.click();
        return '저장 버튼 클릭됨';
      }
    }
    return '저장 버튼 못 찾음';
  });
  console.log(`   ${saveResult}`);

  console.log('\n✅ 완료 — 브라우저 확인 부탁드립니다!');
})();

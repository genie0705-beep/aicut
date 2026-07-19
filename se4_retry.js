const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];

  // 깨끗한 새 페이지
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('=== SE4 에디터 재시도 ===');

  // 1. 블로그 포스트 목록 → 글쓰기
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(3000);

  if (page.url().includes('nid.naver.com')) {
    console.log('❌ 로그인 필요');
    return;
  }

  // JS로 글쓰기 버튼 클릭 (onclick 이벤트 실행)
  await page.evaluate(() => {
    const btn = document.querySelector('a[href*="Redirect=Write"]');
    if (btn) {
      // Trigger the onclick event which Naver uses
      const onclick = btn.getAttribute('onclick');
      if (onclick) eval(onclick);
      btn.click();
    }
  });
  await page.waitForTimeout(5000);

  const writeUrl = page.url();
  console.log(`1. 글쓰기 후 URL: ${writeUrl}`);

  // 2. iframe에서 SmartEditor 찾기
  const frames = page.frames();
  let editorFrame = null;

  for (const f of frames) {
    try {
      const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined');
      if (hasSE) { editorFrame = f; break; }
    } catch(e) {}
  }

  if (!editorFrame) {
    console.log('❌ SmartEditor iframe 못 찾음');
    // redirect=Write 페이지의 iframe 목록 출력
    const frameInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('iframe')).map((f, i) => ({
        i, id: f.id, name: f.name, src: (f.src || '').substring(0, 150)
      }));
    });
    console.log(`iframe 목록: ${JSON.stringify(frameInfo)}`);
    return;
  }

  console.log('✅ SmartEditor iframe 발견');
  
  const edInfo = await editorFrame.evaluate(() => {
    const se = SmartEditor;
    return {
      keys: Object.keys(se._editors || {}),
      version: se.version || 'unknown'
    };
  });
  console.log(`   에디터 키: ${JSON.stringify(edInfo)}`);

  const ek = 'blogpc001';

  // 3. 제목 설정
  console.log('\n2. 제목 설정...');
  const titleResult = await editorFrame.evaluate((key) => {
    try {
      const ed = SmartEditor._editors[key];
      if (!ed) return { error: 'editor not found: ' + key };
      
      // setDocumentTitle은 존재하는지 체크
      if (typeof ed.setDocumentTitle === 'function') {
        ed.setDocumentTitle('제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5');
        return { ok: true, method: 'setDocumentTitle' };
      }
      
      // 대체: title 필드 직접 설정
      if (ed.title !== undefined) {
        ed.title = '제헌절 7월, 서울 가족·연인 데이트 코스 BEST 5';
        return { ok: true, method: 'direct' };
      }
      
      return { error: 'no title method', keys: Object.keys(ed).slice(0, 20) };
    } catch(e) {
      return { error: e.message };
    }
  }, ek);
  console.log(`   ${JSON.stringify(titleResult)}`);

  // 4. 본문 입력 — writeTextWithSoftLineBreak 방식 (6-2-3)
  console.log('\n3. 본문 입력...');
  
  const htmlContent = fs.readFileSync(path.join(__dirname, 'blog_content_20260717.html'), 'utf-8');
  
  // 텍스트만 추출
  const textOnly = htmlContent
    .replace(/<[^>]+>/g, '')
    .replace(/\n\s*\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join('\n');
  
  // 6-2-3 방식: _editingService.writeTextWithSoftLineBreak
  const writeResult = await editorFrame.evaluate(({ key, text }) => {
    try {
      const ed = SmartEditor._editors[key];
      
      // 방법 A: _editingService.writeTextWithSoftLineBreak (최신 6-2-3 방식)
      if (ed._editingService && typeof ed._editingService.writeTextWithSoftLineBreak === 'function') {
        ed._canvasScrollingService.focusToFirstComp();
        ed._editingService.writeTextWithSoftLineBreak(text);
        
        // 가운데 정렬
        document.querySelectorAll('.se-text-paragraph').forEach(p => {
          p.classList.add('se-text-paragraph-align-center');
          p.style.textAlign = 'center';
        });
        
        return { 
          method: 'writeTextWithSoftLineBreak',
          textLength: ed.getContentText().length,
          paraCount: document.querySelectorAll('.se-text-paragraph').length
        };
      }
      
      // 방법 B: setDocumentData (fallback)
      const data = ed.getDocumentData();
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const blocks = lines.slice(0, 60).map(line => ({
        type: 'paragraph',
        text: line,
        style: { textAlign: 'center' }
      }));
      data.document.blocks = blocks;
      ed.setDocumentData(data);
      
      return { 
        method: 'setDocumentData',
        textLength: ed.getContentText().length,
        blocksCount: blocks.length
      };
    } catch(e) {
      return { error: e.message };
    }
  }, { key: ek, text: textOnly });
  
  console.log(`   ${JSON.stringify(writeResult)}`);

  // 5. 본문 확인 및 저장
  const checkResult = await editorFrame.evaluate(() => {
    const canvas = document.querySelector('.se-canvas');
    const canvasText = canvas ? canvas.innerText.substring(0, 100) : 'no canvas';
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    return { canvasText, paraCount: paras };
  });
  console.log(`\n4. 확인: ${JSON.stringify(checkResult)}`);

  // 6. 저장 버튼 클릭
  console.log('\n5. 저장...');
  const saveResult = await editorFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') {
        btn.click();
        return '저장 버튼 클릭';
      }
    }
    return '저장 버튼 없음';
  });
  console.log(`   ${saveResult}`);

  console.log('\n✅ SE4 처리 완료!');
  console.log('브라우저에서 확인해주세요. 내용이 이상하면 말씀주세요!');
})();

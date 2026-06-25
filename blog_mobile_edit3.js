const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    
    const editPage = pages.find(p => p.url().includes('Redirect=Update'));
    if (!editPage) { console.log('수정 페이지 없음'); await context.close(); return; }
    
    await editPage.bringToFront();
    await editPage.waitForTimeout(2000);
    
    // 모든 하위 프레임 재귀 탐색하며 se-main-container 찾기
    async function findEditor(frame, depth = 0) {
      if (depth > 5) return null;
      const indent = '  '.repeat(depth);
      
      try {
        const hasContainer = await frame.$('.se-main-container').catch(() => null);
        if (hasContainer) {
          console.log(`${indent}>>> .se-main-container 발견! depth=${depth}, url=${frame.url().substring(0, 80)}`);
          return frame;
        }
        
        // contenteditable 찾기
        const editable = await frame.$('[contenteditable="true"]').catch(() => null);
        if (editable) {
          const textLen = await editable.evaluate(el => el.innerHTML.length).catch(() => 0);
          if (textLen > 100) {
            console.log(`${indent}>>> contenteditable 발견! 길이=${textLen}, url=${frame.url().substring(0, 80)}`);
            return frame;
          }
        }
      } catch(e) { /* ignore */ }
      
      const children = frame.childFrames();
      for (const child of children) {
        const result = await findEditor(child, depth + 1);
        if (result) return result;
      }
      return null;
    }
    
    const mainFrames = editPage.frames();
    let editorFrame = null;
    for (const f of mainFrames) {
      editorFrame = await findEditor(f);
      if (editorFrame) break;
    }
    
    if (!editorFrame) {
      console.log('에디터 프레임을 찾을 수 없습니다.');
      
      // PostUpdateForm의 모든 하위 프레임 출력
      const pf = editPage.frames().find(f => f.url().includes('PostUpdateForm'));
      if (pf) {
        function printTree(frame, d = 0) {
          console.log('  '.repeat(d) + '프레임:', frame.url().substring(0, 100));
          for (const c of frame.childFrames()) printTree(c, d + 1);
        }
        printTree(pf);
      }
      
      await context.close();
      return;
    }
    
    console.log('\n=== 에디터 프레임에서 작업 ===');
    
    // 현재 본문 내용 확인
    const currentText = await editorFrame.evaluate(() => {
      const container = document.querySelector('.se-main-container');
      if (container) {
        return {
          text: container.textContent.substring(0, 200),
          html: container.innerHTML.substring(0, 200)
        };
      }
      const editable = document.querySelector('[contenteditable="true"]');
      if (editable) return { text: editable.textContent.substring(0, 200), html: editable.innerHTML.substring(0, 200) };
      return { text: 'nothing found' };
    });
    console.log('현재 내용:', JSON.stringify(currentText, null, 2));
    
    // 모바일 최적화 HTML 로드
    const bodyContent = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = bodyContent.match(/<body>([\s\S]*?)<\/body>/);
    const innerHtml = bodyMatch ? bodyMatch[1].trim() : bodyContent;
    
    // 방법: contenteditable에 직접 innerHTML 설정 후 클립보드로 교체
    // 1. 에디터 영역 찾기
    const editorEl = await editorFrame.$('.se-main-container') || await editorFrame.$('[contenteditable="true"]');
    if (!editorEl) {
      console.log('에디터 요소 없음');
      await context.close();
      return;
    }
    
    // 2. 전체 선택
    await editorEl.focus();
    await editorFrame.keyboard.press('Control+a');
    await editorFrame.waitForTimeout(500);
    
    // 3. 클립보드에 HTML 복사
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
    await editPage.evaluate((html) => {
      const blob = new Blob([html], { type: 'text/html' });
      const item = new ClipboardItem({ 'text/html': blob });
      return navigator.clipboard.write([item]);
    }, innerHtml).catch(() => {
      // 대체 방법: text/plain도 함께
      const plainText = innerHtml.replace(/<[^>]*>/g, '');
      const blob = new Blob([innerHtml], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const item = new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob });
      return navigator.clipboard.write([item]);
    });
    await editorFrame.waitForTimeout(1000);
    
    // 4. Ctrl+V
    await editorFrame.keyboard.press('Control+v');
    await editorFrame.waitForTimeout(3000);
    
    // 변경 확인
    const afterText = await editorFrame.evaluate(() => {
      const c = document.querySelector('.se-main-container');
      if (c) return { text: c.textContent.substring(0, 200), len: c.textContent.length };
      const e = document.querySelector('[contenteditable="true"]');
      if (e) return { text: e.textContent.substring(0, 200), len: e.textContent.length };
      return { text: 'nothing' };
    });
    console.log('변경 후:', JSON.stringify(afterText, null, 2));
    
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
    console.error(e.stack);
  }
})();

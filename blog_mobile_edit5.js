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
    await editPage.waitForTimeout(3000);
    
    const pf = editPage.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await context.close(); return; }
    
    // SmartEditor contenteditable 영역 찾기 - 모든 요소 스캔
    const editableInfo = await pf.evaluate(() => {
      const allDivs = document.querySelectorAll('div');
      let found = [];
      
      allDivs.forEach((div, i) => {
        const style = window.getComputedStyle(div);
        const isEditable = div.getAttribute('contenteditable');
        const hasClass = div.className;
        
        // 편집 영역 관련 클래스
        if (isEditable === 'true' || 
            hasClass.includes('se') || 
            hasClass.includes('editor') ||
            hasClass.includes('edit') ||
            style.getPropertyValue('--se-') !== '' ||
            div.id.includes('editor')) {
          found.push({
            tag: div.tagName,
            id: div.id,
            cls: hasClass.substring(0, 60),
            contenteditable: isEditable,
            innerLen: div.innerHTML.length,
            textLen: div.textContent.length,
            display: style.display,
            visibility: style.visibility,
            position: style.position,
            zIndex: style.zIndex,
            rect: div.getBoundingClientRect().toJSON()
          });
        }
      });
      
      // SmartEditor 캔버스/바디 찾기
      const editor = SmartEditor._editors['blogpc001'];
      const canvasInfo = {};
      const keys = Object.keys(editor);
      keys.forEach(k => {
        if (k.includes('body') || k.includes('canvas') || k.includes('root') || k.includes('el') || k.includes('editable') || k.includes('virtual')) {
          canvasInfo[k] = typeof editor[k];
          if (editor[k] && editor[k].tagName) canvasInfo[k + '_tag'] = editor[k].tagName;
        }
      });
      
      return { editableChunks: found.slice(0, 30), canvasInfo };
    }).catch(e => ({ error: e.message }));
    
    console.log('편집 영역 정보:', JSON.stringify(editableInfo, null, 2));
    
    // SmartEditor virtual editable 찾기
    const virtualInfo = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      
      // _virtualEditable 확인
      if (se._virtualEditable) {
        const ve = se._virtualEditable;
        return {
          hasVirtualEditable: true,
          type: typeof ve,
          el: ve._el ? {
            tag: ve._el.tagName,
            id: ve._el.id,
            cls: ve._el.className?.substring(0, 60),
            innerLen: ve._el.innerHTML.length,
          } : 'no _el',
          isContentEditable: ve._isContentEditable,
          isShow: ve._isShow,
        };
      }
      return { hasVirtualEditable: false };
    }).catch(e => ({ error: e.message }));
    console.log('Virtual editable:', JSON.stringify(virtualInfo, null, 2));
    
    // _virtualEditable._el 찾아서 직접 HTML 설정
    if (virtualInfo.hasVirtualEditable && virtualInfo.el && virtualInfo.el.innerLen > 0) {
      console.log('\n=== virtualEditable 발견, 클립보드 접근 시도 ===');
      
      const bodyContent = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
      const bodyMatch = bodyContent.match(/<body>([\s\S]*?)<\/body>/);
      const innerHtml = bodyMatch ? bodyMatch[1].trim() : bodyContent;
      
      // virtualEditable._el에 포커스
      await pf.evaluate(() => {
        const se = SmartEditor._editors['blogpc001'];
        if (se._virtualEditable && se._virtualEditable._el) {
          se._virtualEditable._el.focus();
        }
      });
      await pf.waitForTimeout(500);
      
      // 클립보드 복사
      await context.grantPermissions(['clipboard-write', 'clipboard-read']);
      
      // Clipboard API로 HTML 복사
      await editPage.evaluate((html) => {
        const type = 'text/html';
        const blob = new Blob([html], { type });
        // fallback: text/plain도 함께
        const plainBlob = new Blob([html.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
        const item = new ClipboardItem({ [type]: blob, 'text/plain': plainBlob });
        return navigator.clipboard.write([item]);
      }, innerHtml).catch(e => console.log('clipboard error:', e.message));
      
      await pf.waitForTimeout(1000);
      
      // Ctrl+V
      await pf.keyboard.press('Control+v');
      await pf.waitForTimeout(3000);
      
      // 변경 확인
      const result = await pf.evaluate(() => {
        const se = SmartEditor._editors['blogpc001'];
        const data = se.getDocumentData();
        return {
          dataType: typeof data,
          dataLen: data?.length || 0,
          dataFirst200: typeof data === 'string' ? data.substring(0, 200) : JSON.stringify(data).substring(0, 200)
        };
      }).catch(e => ({ error: e.message }));
      console.log('paste 후 확인:', JSON.stringify(result, null, 2));
    }
    
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
    console.error(e.stack);
  }
})();

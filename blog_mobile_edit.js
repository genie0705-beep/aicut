const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  try {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
    const context = browser.contexts()[0];
    const pages = context.pages();
    
    // 수정 페이지 탭 찾기 (Redirect=Update)
    let editPage = pages.find(p => p.url().includes('Redirect=Update'));
    if (!editPage) {
      editPage = pages.find(p => p.url().includes('aicut/224326578253'));
    }
    if (!editPage) {
      console.log('블로그 수정 페이지를 찾을 수 없습니다.');
      await context.close();
      return;
    }
    
    console.log('수정 페이지:', editPage.url());
    await editPage.bringToFront();
    await editPage.waitForLoadState('networkidle');
    await editPage.waitForTimeout(3000);
    
    // iframe 분석
    const frames = editPage.frames();
    let editorFrame = null;
    for (const f of frames) {
      const url = f.url();
      if (url.includes('smarteditor') || url.includes('smart_editor') || url.includes('SE4') || url.includes('Editor')) {
        editorFrame = f;
        console.log('에디터 프레임 발견:', url.substring(0, 120));
        break;
      }
    }
    
    if (!editorFrame) {
      console.log('에디터 프레임을 찾지 못했습니다. 프레임 목록:');
      for (const f of frames) {
        const url = f.url();
        if (!url.startsWith('about:blank')) console.log(' -', url.substring(0, 100));
      }
      
      // PostView iframe에서 찾기
      for (const f of frames) {
        if (f.url().includes('PostView')) {
          console.log('PostView 프레임 발견, 하위 프레임 탐색...');
          const subFrames = f.frames();
          for (const sf of subFrames) {
            const sfUrl = sf.url();
            console.log('  하위:', sfUrl.substring(0, 100));
            if (sfUrl.includes('smart_editor') || sfUrl.includes('SE')) {
              editorFrame = sf;
            }
          }
        }
      }
    }
    
    if (editorFrame) {
      console.log('\n=== 에디터 접근 성공 ===');
      
      // 에디터 내용 확인
      const seContainer = await editorFrame.$('.se-main-container');
      if (seContainer) {
        const currentText = await seContainer.textContent();
        console.log('현재 본문 텍스트 길이:', currentText?.length || 0);
        console.log('현재 본문 미리보기:', (currentText || '').substring(0, 100));
        
        // 에디터 전체 선택
        await seContainer.focus();
        await editorFrame.keyboard.press('Control+a');
        await editorFrame.waitForTimeout(500);
        
        // 모바일 최적화 HTML 읽기
        const mobileHtml = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
        // body 안의 내용만 추출
        const bodyMatch = mobileHtml.match(/<body>([\s\S]*?)<\/body>/);
        const bodyContent = bodyMatch ? bodyMatch[1].trim() : mobileHtml;
        console.log('모바일 최적화 HTML 길이:', bodyContent.length);
        
        // 클립보드에 HTML 복사
        await context.grantPermissions(['clipboard-write', 'clipboard-read']);
        await editPage.evaluate((html) => {
          const blob = new Blob([html], { type: 'text/html' });
          const clipboardItem = new ClipboardItem({ 'text/html': blob });
          return navigator.clipboard.write([clipboardItem]);
        }, bodyContent);
        await editorFrame.waitForTimeout(1000);
        
        // Ctrl+V 붙여넣기 (React paste 트리거)
        await editorFrame.keyboard.press('Control+v');
        await editorFrame.waitForTimeout(2000);
        
        // 본문 업데이트 확인
        const newText = await seContainer.textContent();
        console.log('변경 후 텍스트 길이:', newText?.length || 0);
        
        // 저장 버튼 찾기
        console.log('\n=== 저장 버튼 찾기 ===');
        const allButtons = await editPage.$$('button, a, span, em');
        for (const btn of allButtons) {
          const text = await btn.textContent().catch(() => '');
          const cls = await btn.getAttribute('class').catch(() => '');
          if (text.includes('저장') || text.includes('등록') || cls?.includes('save') || cls?.includes('publish')) {
            console.log('저장 버튼:', text.trim(), '| 클래스:', cls?.substring(0, 80));
          }
        }
        
      } else {
        console.log('se-main-container를 찾을 수 없습니다.');
      }
    } else {
      console.log('에디터 프레임을 어디서도 찾을 수 없습니다.');
      
      // 전체 페이지 내용 확인
      const body = await editPage.content();
      console.log('페이지 HTML 길이:', body.length);
    }
    
    console.log('\n=== 완료 ===');
    // disconnect - browser 닫지 않음
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
    console.error(e.stack);
  }
})();

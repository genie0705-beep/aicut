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
    // 페이지 리로드
    await editPage.reload();
    await editPage.waitForTimeout(5000);
    
    const pf = editPage.frames().find(f => f.url().includes('PostUpdateForm'));
    if (!pf) { console.log('PostUpdateForm 없음'); await context.close(); return; }
    
    // 현재 내용 백업
    const before = await pf.evaluate(() => {
      const se = SmartEditor._editors['blogpc001'];
      return {
        title: se.getDocumentTitle(),
        text: se.getContentText().substring(0, 100)
      };
    }).catch(() => ({}));
    console.log('Before:', JSON.stringify(before));
    
    // 모바일 최적화 HTML 불러오기
    const html = fs.readFileSync('C:\\Users\\paul\\.openclaw\\workspace\\blog_aicut_20260625_mobile.html', 'utf-8');
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
    const contentHtml = bodyMatch ? bodyMatch[1].trim() : html;
    
    // SmartEditor SE4: se-content 내 contenteditable 찾기
    const editableEl = await pf.$('.se-canvas .se-section-documentTitle, .se-canvas [contenteditable]');
    
    if (editableEl) {
      console.log('contenteditable 발견, 클립보드 접근 시도');
      
      // Grant clipboard permission on the main page
      await context.grantPermissions(['clipboard-write', 'clipboard-read']);
      
      // 클립보드에 HTML 복사 (main page context)
      const clipboardSet = await editPage.evaluate((htmlContent) => {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const textBlob = new Blob([htmlContent.replace(/<[^>]+>/g, '')], { type: 'text/plain' });
        const item = new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob });
        return navigator.clipboard.write([item]).then(() => true).catch(e => e.message);
      }, contentHtml);
      console.log('클립보드 설정:', clipboardSet);
      await pf.waitForTimeout(1000);
      
      // 에디터 본문 영역 클릭 후 Ctrl+A → Ctrl+V
      // .se-content-guide 아래 실제 편집 영역 찾기
      const canvas = await pf.$('.se-canvas');
      if (canvas) {
        await canvas.click();
        await pf.waitForTimeout(500);
        
        // Ctrl+A 전체 선택
        await pf.keyboard.press('Control+a');
        await pf.waitForTimeout(500);
        
        // Ctrl+V 붙여넣기
        await pf.keyboard.press('Control+v');
        await pf.waitForTimeout(3000);
        
        // 확인
        const after = await pf.evaluate(() => {
          const se = SmartEditor._editors['blogpc001'];
          return {
            title: se.getDocumentTitle(),
            textLen: se.getContentText().length,
            textSample: se.getContentText().substring(0, 100)
          };
        }).catch(() => ({}));
        console.log('After:', JSON.stringify(after));
        
        if (after.textLen > 100) {
          console.log('✅ 붙여넣기 성공!');
        } else {
          console.log('⚠️ 붙여넣기 후 내용 변화 없음, 다른 방법 시도');
        }
      }
    } else {
      console.log('contenteditable 찾지 못함');
      // setDocumentData 재시도 - 단순 HTML 먼저
      const simpleHtml = '<p style="text-align:center;">테스트</p>';
      const result = await pf.evaluate((html) => {
        try {
          const se = SmartEditor._editors['blogpc001'];
          se._documentService.setDocumentData(html);
          return { ok: true };
        } catch(e) {
          return { ok: false, error: e.message };
        }
      }, simpleHtml);
      console.log('단순 HTML setDocumentData:', JSON.stringify(result));
    }
    
    await context.close();
  } catch(e) {
    console.error('오류:', e.message);
  }
})();

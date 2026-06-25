const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  if (!p) { await ctx.close(); return; }
  await p.bringToFront();
  await p.waitForTimeout(3000);
  const pf = p.frames().find(f => f.url().includes('PostUpdateForm'));
  if (!pf) { await ctx.close(); return; }
  
  // 이미지 파일 읽기
  const imgPath = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_worldcup_main.png';
  if (!fs.existsSync(imgPath)) { console.log('파일 없음'); await ctx.close(); return; }
  const buf = fs.readFileSync(imgPath);
  const b64 = buf.toString('base64');
  
  // Step 1: write()로 텍스트 입력
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('이미지 paste 테스트');
    se._canvasScrollingService.focusToFirstComp();
    const es = se._editingService;
    es.write('첫 번째 텍스트 블록입니다.');
  });
  await new Promise(r => setTimeout(r, 2000));
  console.log('1. write() 성공, textLen:', await pf.evaluate(() => SmartEditor._editors['blogpc001'].getContentText().length));
  
  // Step 2: 이미지 clipboard 적재 (메인 페이지)
  await ctx.grantPermissions(['clipboard-write', 'clipboard-read']);
  const clipOk = await p.evaluate((b64img) => {
    try {
      const binary = atob(b64img);
      const arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
      const blob = new Blob([arr], { type: 'image/png' });
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    } catch(e) { return e.message; }
  }, b64);
  console.log('2. 클립보드 적재:', clipOk);
  
  // Step 3: contenteditable에 focus 후 메인 페이지에서 Ctrl+V
  await pf.evaluate(() => {
    const ce = document.querySelector('[contenteditable="true"]');
    if (ce) {
      ce.focus();
      // selection을 ce의 끝으로 이동
      const r = document.createRange();
      r.selectNodeContents(ce);
      r.collapse(false);
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
    }
  });
  await new Promise(r => setTimeout(r, 500));
  
  // 메인 페이지에서 Ctrl+V (실제 클립보드 데이터 사용)
  await p.keyboard.press('Control+v');
  await new Promise(r => setTimeout(r, 3000));
  
  // Step 4: 확인
  const check = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const imgs = wrap?.querySelectorAll('.se-component.se-image');
    const texs = wrap?.querySelectorAll('.se-component.se-text');
    return {
      textLen: se.getContentText().length,
      imgComps: imgs?.length || 0,
      textComps: texs?.length || 0,
      totalComps: wrap?.querySelectorAll('.se-component').length || 0
    };
  });
  console.log('3. 결과:', JSON.stringify(check));
  
  await ctx.close();
})().catch(e => console.error('ERR:', e.message));

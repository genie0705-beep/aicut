const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  
  // 현재 CTA 부분 확인
  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const idx = ft.indexOf('카카오톡');
    if (idx < 0) return { error: 'CTA 없음' };
    
    // CTA 앞뒤 컨텍스트
    const before = ft.substring(Math.max(0, idx - 50), idx);
    const cta = ft.substring(idx, idx + 200);
    const after = ft.substring(idx + 200, idx + 280);
    
    // OG link 컴포넌트 확인 (링크 삽입 기능)
    const oglinkBtns = document.querySelectorAll('.se-oglink-toolbar-button, [class*="oglink"]');
    
    return {
      before,
      cta,
      after,
      oglinkButtons: oglinkBtns.length,
      oglinkComponents: document.querySelectorAll('.se-oglink-component, [class*="oglink"]').length
    };
  });
  
  console.log('CTA 앞부분:', r.before);
  console.log('CTA 본문:', r.cta);
  console.log('CTA 뒷부분:', r.after);
  console.log('OG링크 버튼:', r.oglinkButtons);
  console.log('OG링크 컴포넌트:', r.oglinkComponents);
  
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

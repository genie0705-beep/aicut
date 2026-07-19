const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  const r = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const titleInput = document.querySelector('input[placeholder*="제목"]');
    return {
      title: titleInput ? titleInput.value : '(확인불가)',
      contentLen: se.getContentText().length,
      paraCount: document.querySelectorAll('.se-text-paragraph').length,
      centerAligned: document.querySelectorAll('.se-text-paragraph-align-center').length
    };
  });
  console.log('에디터 상태:', JSON.stringify(r, null, 2));
  await wp.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\_se_editor_final.png' });
  console.log('스크린샷 저장 완료');
  await b.close();
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });

const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 사진 버튼 클릭 시도 → file chooser 핸들링
  const btn = wp.locator('.se-document-toolbar-basic-button').filter({ hasText: '사진' }).first();
  
  // file chooser 이벤트 대기 설정
  wp.once('filechooser', async (fc) => {
    console.log('✅ 파일 선택기 열림!');
    await fc.setFiles([path.join(WS, 'aicut_blog_fp_main.png')]);
    console.log('파일 설정 완료');
    await wp.waitForTimeout(3000);
  });

  console.log('사진 버튼 클릭 시도...');
  await btn.click();
  await wp.waitForTimeout(5000);

  // 업로드 후 상태
  const after = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    return { textLen: se.getContentText().length };
  });
  console.log('업로드 후 텍스트 길이:', after.textLen);
  
  await wp.screenshot({ path: path.join(WS, '_se_after_photo.png') });
  console.log('스크린샷 저장');

  await b.close();
}
main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // 누락된 CTA 추가
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._editingService.writeTextWithSoftLineBreak('\n📧 이메일: master@aicut.co.kr\n🌐 홈페이지: https://aicut.co.kr');
  });
  await wp.waitForTimeout(500);

  // 센터정렬
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  await wp.waitForTimeout(500);

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);

  // 검증
  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('CTA 완료:', ft.includes('pf.kakao.com') && ft.includes('master@aicut.co.kr') && ft.includes('aicut.co.kr'));
  console.log('글자수:', ft.length + '자');
  console.log('AICUT 제거:', !ft.includes('AICUT') ? '✅' : '⚠️ 있음');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

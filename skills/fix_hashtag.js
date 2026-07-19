const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // 해시태그 줄 찾아서 수정
  await wp.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let target = null;
    paras.forEach(p => {
      const t = (p.textContent || '').trim();
      if (t.startsWith('#보험영업') || t.startsWith('#보험마케팅')) target = p;
    });
    if (target) {
      target.textContent = (target.textContent || '').trim() + ' #태아보험 #출산준비';
      document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }
  });
  await wp.waitForTimeout(300);

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);

  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('태아보험:', ft.includes('태아보험') ? '✅' : '⚠️');
  console.log('출산준비:', ft.includes('출산준비') ? '✅' : '⚠️');
  console.log('해시태그:', (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개');
  console.log('✅ 저장 완료');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // 팝업 닫기
  await wp.keyboard.press('Escape');
  await wp.waitForTimeout(1000);

  // 저장 (evaluate로 직접 클릭)
  await wp.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '저장') {
        btn.click();
        break;
      }
    }
  });
  await wp.waitForTimeout(2000);

  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('본문:', ft.length + '자');
  console.log('이미지:', document.querySelectorAll('img').length + '장');
  console.log('해시태그:', (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개');
  console.log('CTA:', ft.includes('pf.kakao.com') && ft.includes('aicut.co.kr') ? '✅' : '⚠️');
  console.log('✅ 저장 완료');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

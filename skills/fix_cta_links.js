const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('에디터 없음'); await b.close(); return; }

  // CTA 링크 부분을 새로 추가 (링크 뒤에 엔터로 활성화)
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const text = `
📞 카카오톡: https://pf.kakao.com/_GIesX/chat

📧 이메일: master@aicut.co.kr

🌐 홈페이지: https://aicut.co.kr
`;
    se._editingService.writeTextWithSoftLineBreak(text);
  });
  await wp.waitForTimeout(800);

  // 센터 정렬
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);

  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('✅ 저장 완료');
  console.log('본문:', ft.length + '자');
  console.log('카톡 링크:', ft.includes('pf.kakao.com') ? '✅' : '⚠️');
  console.log('홈페이지 링크:', ft.includes('aicut.co.kr') ? '✅' : '⚠️');
  console.log('링크 뒤 줄바꿈:', ft.includes('chat\n') && ft.includes('kr\n') ? '✅ 엔터 적용' : '⚠️');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

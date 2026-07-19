const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // 추가 텍스트
  const extra = [
    '',
    '"직원들한테 릴스 찍자고 하기도 미안하고 편집할 사람은 없고..."',
    '',
    '이런 고민, 저희가 이미 수없이 들어왔습니다.',
    '',
    '촬영 가이드 한 장이면 누구나 5분 안에 찍을 수 있습니다.',
    '찍은 영상만 보내주세요. 나머지는 저희가 다 합니다.',
    '',
    '지금 바로 문의주세요.',
  ].join('\n');

  await wp.evaluate((text) => {
    SmartEditor._editors['blogpc001']._editingService.writeTextWithSoftLineBreak(text);
  }, extra);
  await wp.waitForTimeout(500);

  // 센터 + Strong
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });

  // 저장
  await wp.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '저장') { btn.click(); break; }
    }
  });
  await wp.waitForTimeout(2000);

  // 같은 connection에서 검증
  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('본문:', ft.length + '자');
  console.log('CTA:', ft.includes('pf.kakao.com') ? '✅' : '⚠️');
  console.log('해시태그:', (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개');

  await b.close();
  console.log('✅ 완료');
}
main().catch(e => console.error('에러:', e.message));

const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // 추가 텍스트 입력 (1,184자 → 1,500자 목표)
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

  // 센터 정렬 + Strong
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    const kws = ['병원마케팅', '피부과', '숏폼', '릴스', '영상편집', '촬영가이드'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => { html = html.replace(new RegExp('(?![^<]*>)(' + kw + ')', 'g'), '<strong>$1</strong>'); });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  await wp.waitForTimeout(500);

  // 저장
  await wp.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '저장') { btn.click(); break; }
    }
  });
  await wp.waitForTimeout(2000);

  // 검증
  const { chromium: c2 } = require('playwright');
  const b2 = await c2.connectOverCDP('http://127.0.0.1:9224');
  const wp2 = b2.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  const ft = await wp2.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('본문:', ft.length + '자');
  console.log('이미지:', document.querySelectorAll('img').length + '장');
  console.log('해시태그:', (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개');
  console.log('CTA:', ft.includes('pf.kakao.com') && ft.includes('aicut.co.kr') ? '✅' : '⚠️');
  await b2.close();
  await b.close();
}
main().catch(e => console.error('에러:', e.message));

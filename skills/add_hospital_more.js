const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const text = [
      '',
      '"직원들한테 릴스 찍자고 하기도 미안하고 편집할 사람은 없고..."',
      '',
      '이런 고민, 저희가 이미 수없이 들어왔습니다.',
      '',
      '촬영 가이드 한 장이면 누구나 5분 안에 찍을 수 있습니다.',
      '찍은 영상만 보내주세요. 나머지는 저희가 다 합니다.',
      '',
      '많은 병원이 이미 에이컷과 함께하고 있습니다.',
      '지금 바로 문의주세요.',
    ].join('\n');
    se._editingService.writeTextWithSoftLineBreak(text);
  });
  await wp.waitForTimeout(500);
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
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);
  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('본문:', ft.length + '자');
  console.log('✅ 저장 완료');
  await b.close();
}
main().catch(e => console.log('err:', e.message));

const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));

  // 추가 텍스트
  const extra = `1일 1릴스, 생각보다 어렵지 않습니다.

출근길 거울 샷, 점심시간 커피 한 잔,
상담 후 간단한 소감, 하루 마무리 인사.

4컷이면 충분합니다. 📱

중요한 것은 꾸준함입니다.
하루 1개씩만 올려도 한 달이면 30개,
알고리즘이 당신의 콘텐츠를 기억하기 시작합니다.

하반기, 지금 시작하면 늦지 않습니다.
오늘 당신의 첫 릴스를 찍어보세요.`;

  await wp.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    se._editingService.writeTextWithSoftLineBreak('\n' + text);
  }, extra);
  await wp.waitForTimeout(500);

  // 센터 정렬
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });

  // Strong 재적용
  await wp.evaluate(() => {
    const kws = ['보험영업', '보험설계사', '사회초년생', '릴스', '숏폼', '태아보험'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => {
        html = html.replace(new RegExp('(?![^<]*>)(' + kw + ')', 'g'), '<strong>$1</strong>');
      });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });

  // 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);

  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('본문:', ft.length + '자');
  console.log('✅ 저장 완료');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('에디터 없음'); await b.close(); return; }

  // 1. 태아보험 문장 추가
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._editingService.writeTextWithSoftLineBreak('\n\n태아보험도 많은 사회 초년생 부부들이 찾는 인기 상품입니다.\n자연스럽게 키워드에 녹여보세요.');
  });
  await wp.waitForTimeout(500);

  // 2. 센터 정렬
  await wp.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });

  // 3. 해시태그에 태아보험 추가
  await wp.evaluate(() => {
    const lastP = document.querySelector('.se-text-paragraph:last-of-type');
    if (lastP && (lastP.textContent || '').startsWith('#')) {
      lastP.textContent = (lastP.textContent || '').trim() + ' #태아보험 #출산준비';
      document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }
  });
  await wp.waitForTimeout(300);

  // 4. Strong 재적용 (태아보험 포함)
  await wp.evaluate(() => {
    const kws = ['보험영업', '보험설계사', '사회초년생', '릴스', '숏폼', '태아보험'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => {
        const re = new RegExp('(?![^<]*>)(' + kw + ')', 'g');
        html = html.replace(re, '<strong>$1</strong>');
      });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });

  // 5. 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);

  // 6. 검증
  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  console.log('본문:', ft.length + '자');
  console.log('태아보험 포함:', ft.includes('태아보험') ? '✅' : '⚠️');
  console.log('출산준비 포함:', ft.includes('출산준비') ? '✅' : '⚠️');
  console.log('해시태그:', (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개');
  console.log('저장 완료 ✅');

  await b.close();
}
main().catch(e => console.error('에러:', e.message));

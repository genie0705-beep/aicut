// 팝업 정리 + 에디터 포커스 + 타이핑
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) { page = p; break; }
  }
  if (!page) { console.log('에디터 탭 없음'); process.exit(1); }

  // 팝업 레이어 닫기
  await page.evaluate(() => {
    // 모든 레이어 팝업 제거
    const popups = document.querySelectorAll('.layer_popup__WjlfW, [class*="layer_popup"], [class*="popup"]');
    popups.forEach(el => {
      el.style.display = 'none';
      el.remove();
    });
    // 팝업 배경 제거
    const dims = document.querySelectorAll('[class*="dim"]');
    dims.forEach(el => el.style.display = 'none');
  });
  await page.waitForTimeout(1000);
  console.log('팝업 정리 완료');

  // contenteditable 찾아서 포커스
  await page.evaluate(() => {
    const ed = document.querySelector('[contenteditable="true"]');
    if (ed) {
      ed.focus();
      // 강제로 focus 이벤트 발생
      ed.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      ed.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // React Slate editor 이벤트
      const clickEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      ed.dispatchEvent(clickEvent);
    }
  });
  await page.waitForTimeout(1000);
  console.log('에디터 포커스');

  // 타이핑
  const bodyLines = [
    '"편집을 어떻게 해결할까?"',
    '',
    '직접 하기엔 시간이 없고, 채용하기엔 비용이 부담스럽다.',
    '스타트업이라면 누구나 한 번쯤 하는 고민이다.',
    '',
    '대부분 선택하는 두 가지 길.',
    '',
    '프리랜서에게 건당 의뢰하거나,',
    '영상편집 월정액 서비스를 쓰거나.',
    '',
    '이 글에서 두 방식의 실제 비용과 운영 방식을 비교한다.',
    '',
    '──────────',
    '',
    '프리랜서 편집, 실제 비용은?',
    '',
    '월 10편 기준 50만~150만 원.',
    '여기에 브리핑·수정·납기 리스크가 더해진다.',
    '',
    '──────────',
    '',
    '에이컷 월정액, 비용 구조는?',
    '',
    '월 4편 기준 49만 원~',
    '전담 에디터 · 수정 무제한 · D+1 납품',
    '',
    '──────────',
    '',
    '지금 바로 무료 상담 신청하세요.',
    '👉 aicut.co.kr',
  ];

  let typed = false;
  for (const line of bodyLines) {
    if (line === '') {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(30);
    } else {
      await page.keyboard.type(line, { delay: 5 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(30);
      typed = true;
    }
  }
  console.log(typed ? '✅ 본문 입력 완료' : '❌ 입력 실패');

  // 확인
  const result = await page.evaluate(() => {
    const eds = document.querySelectorAll('[contenteditable]');
    let maxLen = 0;
    for (const ed of eds) {
      const len = (ed.innerText || '').length;
      if (len > maxLen) maxLen = len;
    }
    return maxLen;
  }).catch(() => 0);
  console.log(`본문: ${result > 0 ? '✅ ' + result + '자' : '❌ 없음'}`);

  try { await b.close(); } catch(e) {}
})();

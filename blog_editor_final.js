// postwrite iframe 찾아서 keyboard 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // postwrite iframe 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com') && p.url().includes('Redirect=Write')) {
      page = p;
      break;
    }
  }
  if (!page) {
    console.log('❌ 블로그 페이지 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // postwrite iframe
  let pwFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes('postwrite')) {
      pwFrame = f;
      console.log('✅ postwrite iframe:', f.url().substring(0, 80));
      break;
    }
  }
  if (!pwFrame) {
    console.log('❌ postwrite iframe 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // child frame 중 contenteditable이 있는 에디터 프레임 찾기
  let edFrame = null;
  for (const f of pwFrame.childFrames()) {
    try {
      const hasEd = await f.evaluate(() => document.querySelector('[contenteditable]') !== null);
      if (hasEd) {
        edFrame = f;
        console.log('✅ 에디터 프레임:', f.url().substring(0, 80));
      }
    } catch(e) {}
  }

  if (!edFrame) {
    console.log('❌ 에디터 프레임 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // se-body 클릭해서 에디터 활성화
  await pwFrame.evaluate(() => {
    document.querySelector('.se-body.__se-body')?.click();
  });
  await pwFrame.waitForTimeout(1500);

  // 에디터 프레임 body focus
  await edFrame.evaluate(() => {
    if (document.body.isContentEditable) {
      document.body.innerHTML = '';
      document.body.focus();
    }
  });
  await edFrame.waitForTimeout(500);

  // 제목 입력
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  
  // postwrite 내에서 제목 영역 찾기
  await pwFrame.evaluate((t) => {
    // se-documentTitle 찾기
    const els = document.querySelectorAll('[class*="documentTitle"], [class*="title-text"]');
    for (const el of els) {
      if (el.isContentEditable) {
        el.focus();
        el.innerText = t;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
    // contenteditable 중 첫 번째 (w:17 h:953 요소는 제외)
    const eds = document.querySelectorAll('[contenteditable]');
    for (const ed of eds) {
      const r = ed.getBoundingClientRect();
      if (r.width > 50) { // 가시적인 것만
        ed.focus();
        ed.innerText = t;
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
  }, title);
  console.log('제목 입력 완료');
  await pwFrame.waitForTimeout(500);

  // 본문 — keyboard.insertText 사용
  const body = `"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."

요즘 병원 마케팅 현장에서 실제로 나오는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.

이유 1. 영상이 신뢰도를 결정한다

환자가 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상 하나, 실제 시술 과정과 환자 후기 영상 하나가 블로그 포스팅 10개보다 강력하다. 실제로 병원 영상 마케팅을 시작한 병원 중 신규 환자 문의가 20~40% 증가한 사례가 적지 않다.

이유 2. 릴스·쇼츠가 예약으로 연결된다

"코 성형 고민"으로 검색한 사람에게 해당 병원의 후기 영상이 자동으로 노출된다. 텍스트 광고보다 훨씬 자연스럽고 효과적이다. 문제는 꾸준함. 릴스 마케팅은 하루 1개, 쇼츠는 주 2~3개 업로드가 기본이다.

이유 3. 편집 아웃소싱이 정답이다

병원이 할 일 = 원장님 촬영. 에이컷이 할 일 = 편집부터 납품까지 전부. 의료 영상 편집 경험이 있는 전담팀이 직접 작업한다. 편집 인력을 직접 고용하면 연 3,000만원 이상. 에이컷은 필요한 만큼만, 월 정기로 합리적인 비용.

지금 시작하세요. 편집은 에이컷에 맡기고 진료에 집중하세요.`;

  // chunk로 나눠서 keyboard 입력
  const chunks = body.match(/.{1,100}/g) || [body];
  for (let i = 0; i < chunks.length; i++) {
    try {
      await edFrame.keyboard.insertText(chunks[i]);
      await pwFrame.waitForTimeout(50);
    } catch(e) {
      console.log(`chunk ${i} 오류:`, e.message.substring(0, 40));
    }
  }
  console.log('✅ 본문 입력 완료 (chunks:', chunks.length, ')');

  await pwFrame.waitForTimeout(1000);

  // 확인
  const check = await edFrame.evaluate(() => {
    return { len: (document.body.innerText || '').length, text: (document.body.innerText || '').substring(0, 40) };
  });
  console.log('📝 확인:', JSON.stringify(check));

  try { await b.close(); } catch(e) {}
  console.log('\n✅ 완료! 브라우저에서 확인해주세요.');
})();

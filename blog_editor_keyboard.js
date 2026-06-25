// keyboard API로 React Controlled Component에 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let pwFrame = null;
  let page = null;
  for (const p of ctx.pages()) {
    for (const f of p.frames()) {
      if (f.url().includes('PostWriteForm')) {
        pwFrame = f;
        page = p;
        break;
      }
    }
    if (pwFrame) break;
  }

  if (!pwFrame) {
    console.log('❌ 에디터 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // 1. se-body 클릭해서 에디터 활성화
  await pwFrame.evaluate(() => {
    const seBody = document.querySelector('.se-body.__se-body');
    if (seBody) {
      seBody.click();
      seBody.focus();
    }
  });
  await pwFrame.waitForTimeout(1500);

  // 2. 에디터 iframe(contenteditable) 찾기
  let edFrame = null;
  for (const f of pwFrame.childFrames()) {
    try {
      const hasEd = await f.evaluate(() => document.querySelector('[contenteditable]') !== null);
      if (hasEd) { edFrame = f; break; }
    } catch(e) {}
  }

  if (!edFrame) {
    console.log('❌ 에디터 iframe 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }
  console.log('✅ 에디터 iframe 발견');

  // 3. 제목 입력 - keyboard 사용
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  
  // postwrite 페이지에서 제목 영역에 focus
  await pwFrame.evaluate((t) => {
    // documentTitle 영역 찾기
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const cls = el.className || '';
      if (typeof cls === 'string') {
        if (cls.includes('documentTitle') || cls.includes('title-text')) {
          if (el.isContentEditable) {
            el.focus();
            el.innerText = t;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
        }
      }
    }
    // se-documentTitle 클래스 찾기
    const titleEl = document.querySelector('[class*="documentTitle"]');
    if (titleEl && titleEl.isContentEditable) {
      titleEl.focus();
      titleEl.innerText = t;
      titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }, title);
  console.log('제목 시도');
  await pwFrame.waitForTimeout(500);

  // 4. 본문 입력 - edFrame의 body에 keyboard로 입력
  const body = `"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."

요즘 병원 마케팅 현장에서 실제로 나오는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.

이유 1. 영상이 신뢰도를 결정한다

환자가 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상 하나, 실제 시술 과정과 환자 후기 영상 하나가 블로그 포스팅 10개보다 강력하다. 실제로 병원 영상 마케팅을 시작한 병원 중 신규 환자 문의가 20~40% 증가한 사례가 적지 않다.

이유 2. 릴스·쇼츠가 예약으로 연결된다

"코 성형 고민"으로 검색한 사람에게 해당 병원의 후기 영상이 자동으로 노출된다. 텍스트 광고보다 훨씬 자연스럽고 효과적이다. 문제는 꾸준함. 릴스 마케팅은 하루 1개, 쇼츠는 주 2~3개 업로드가 기본이다.

이유 3. 편집 아웃소싱이 정답이다

병원이 할 일 = 원장님 촬영. 에이컷이 할 일 = 편집부터 납품까지 전부. 의료 영상 편집 경험이 있는 전담팀이 직접 작업한다. 편집 인력을 직접 고용하면 연 3,000만원 이상. 에이컷은 필요한 만큼만, 월 정기로 합리적인 비용.

지금 시작하세요. 편집은 에이컷에 맡기고 진료에 집중하세요.`;

  // 방법 A: frame의 body에 focus 후 keyboard.insertText
  try {
    await edFrame.evaluate(() => {
      const body = document.body;
      if (body.isContentEditable) {
        body.focus();
        body.innerHTML = '';
      }
    });
    
    await edFrame.waitForTimeout(500);
    
    // keyboard로 입력 (천천히)
    // 단, 긴 텍스트를 한 번에 insertText하는 것이 아니라 chunked로
    const chunks = body.match(/.{1,200}/g) || [body];
    for (let i = 0; i < chunks.length; i++) {
      await edFrame.keyboard.insertText(chunks[i]);
      await edFrame.waitForTimeout(100);
    }
    console.log('✅ 본문 keyboard 입력 완료 (chunks:', chunks.length, ')');
  } catch(e) {
    console.log('키보드 입력 오류:', e.message.substring(0, 60));
    
    // 방법 B: clipboard 붙여넣기
    try {
      await pwFrame.evaluate(async (txt) => {
        await navigator.clipboard.writeText(txt);
      }, body);
      console.log('클립보드 복사 완료');
      
      await edFrame.evaluate(() => {
        const body = document.body;
        if (body.isContentEditable) {
          body.focus();
          document.execCommand('paste');
        }
      });
      console.log('✅ 붙여넣기 완료');
    } catch(e) {
      console.log('클립보드 방식 오류:', e.message.substring(0, 60));
    }
  }

  await pwFrame.waitForTimeout(1000);

  // 최종 확인
  const check = await edFrame.evaluate(() => {
    return {
      text: (document.body.innerText || '').substring(0, 50),
      len: (document.body.innerText || '').length
    };
  });
  console.log('📝 확인:', JSON.stringify(check));

  try { await b.close(); } catch(e) {}
  console.log('\n✅ 처리 완료! 브라우저에서 확인해주세요.');
})();

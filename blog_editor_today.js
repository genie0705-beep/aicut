// 오늘자 블로그 포스팅 초안 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // 블로그 에디터 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    const u = p.url();
    if (u.includes('postwrite') || (u.includes('blog.naver.com') && u.includes('write'))) {
      page = p;
      console.log('✅ 에디터 탭 발견');
      break;
    }
  }

  // 에디터 탭 없으면 새로 열기
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/write', { waitUntil: 'domcontentloaded' });
    console.log('📄 새 에디터 탭 열기');
    await page.waitForTimeout(3000);
  }

  await page.waitForTimeout(1500);

  // 제목 입력
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  await page.evaluate((t) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.type === 'text' && inp.offsetParent !== null) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('제목 입력됨');
        return;
      }
    }
  }, title);
  console.log('✅ 제목 입력 완료');

  await page.waitForTimeout(800);

  // 본문
  const body = `"OO성형외과 유튜브 보고 상담 왔어요."
"치과 릴스 보고 예약했어요."

요즘 병원 마케팅 현장에서 가장 자주 듣는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다. 유튜브, 인스타그램 릴스, 틱톡에서 병원의 수술 후기, 시술 과정, 원장 인터뷰 영상을 보고 방문 결정을 내린다.

그런데 문제는 이것이다. "영상이 중요하다는 건 알겠는데, 누가 찍고 누가 편집하나요?"

──────────

영상이 신뢰도를 결정한다

환자 입장에서 병원을 선택할 때 가장 중요한 건 신뢰다.

• 원장의 전문성
• 시술 전후 차이
• 병원 분위기와 시스템

이 모든 것을 텍스트보다 영상이 10배 빠르게 전달한다. 직접 원장이 설명하는 영상, 실제 수술 과정, 환자 인터뷰 영상 하나가 블로그 포스팅 10개보다 강력하다.

실제로 영상 마케팅을 시작한 병원 중 신규 환자 문의가 20~40% 증가한 사례가 적지 않다.

──────────

릴스·쇼츠로 예약까지 이어진다

병원 마케팅의 핵심은 "지금 필요한 사람"에게 도달하는 것이다.

인스타그램 릴스, 유튜브 쇼츠는 사용자의 관심사와 행동 데이터를 기반으로 콘텐츠를 추천한다. "코 성형 고민"을 검색한 사람에게 해당 병원의 코 성형 후기 영상이 자동 추천된다. 텍스트 광고보다 훨씬 자연스럽고 효과적이다.

문제는 꾸준함이다. 릴스는 하루 1개, 쇼츠는 주 2~3개 업로드가 기본이다. 직접 촬영하고 편집하기엔 병원 업무가 너무 바쁘다.

──────────

영상 편집 아웃소싱이 정답이다

결론은 간단하다.

병원이 할 일 = 원장님 촬영 (또는 원본 제공)
에이컷이 할 일 = 편집부터 납품까지 전부

• 촬영본만 보내주시면 편집, 자막, BGM, 타이포그래피까지
• 의료법에 저촉되지 않는 선에서 마케팅 효과 극대화
• 월 정기 계약으로 매주 꾸준한 업로드 가능
• 브랜드 가이드 저장으로 매번 설명 불필요

편집 인력을 직접 고용하면 연 3,000만원 이상. 에이컷은 필요한 만큼만, 월 정기로 훨씬 합리적인 비용으로 운영 가능하다.

──────────

지금 시작하세요

영상 마케팅, 더 이상 선택이 아니라 필수입니다.
환자가 영상으로 병원을 고르는 시대, 편집은 에이컷에 맡기고 진료에 집중하세요.`;

  await page.evaluate((txt) => {
    const eds = document.querySelectorAll('[contenteditable]');
    let editor = null;
    for (const ed of eds) {
      const html = ed.innerHTML || '';
      if (html === '<br>' || html === '' || html.includes('글감과 함께')) {
        editor = ed;
        break;
      }
    }
    if (!editor && eds.length > 0) editor = eds[0];
    if (editor) {
      editor.focus();
      editor.innerText = txt;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('본문 입력됨');
    } else {
      console.log('❌ contenteditable 요소 못 찾음');
    }
  }, body);
  console.log('✅ 본문 입력 완료');

  await page.waitForTimeout(1000);

  // 확인
  const result = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    let titleVal = '';
    for (const inp of inputs) {
      if (inp.value && inp.value.length > 5) { titleVal = inp.value.substring(0, 30); break; }
    }
    const eds = document.querySelectorAll('[contenteditable]');
    let contentLen = 0;
    for (const ed of eds) {
      if (ed.innerText && ed.innerText.length > contentLen) contentLen = ed.innerText.length;
    }
    return { title: titleVal, bodyLen: contentLen };
  });
  console.log(`📝 확인: 제목="${result.title}" 본문=${result.bodyLen}자`);

  try { await b.close(); } catch(e) {}
  console.log('\n✅ 블로그 에디터 입력 완료! 이미지 삽입 후 발행해주세요.');
})();

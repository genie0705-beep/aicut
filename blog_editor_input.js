// 열려있는 에디터에 직접 반영
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
      console.log('에디터 탭 발견:', u.substring(0, 80));
      break;
    }
  }

  if (!page) {
    console.log('에디터 탭 없음. blog.naver.com/aicut 에서 글쓰기 버튼 먼저 클릭해주세요.');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // 제목
  const title = '스타트업 CEO가 영상 PD 대신 월정기 편집을 선택한 이유';
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
  console.log('✅ 제목 입력');

  await page.waitForTimeout(500);

  // 본문
  const body = `"편집을 어떻게 해결할까?"

직접 하기엔 시간이 없고, 채용하기엔 비용이 부담스럽다.
스타트업이라면 누구나 한 번쯤 하는 고민이다.

대부분이 선택하는 두 가지 경로.

프리랜서에게 건당 의뢰하거나,
영상편집 월정액 서비스를 쓰거나.

이 글에서 두 방식의 실제 비용과 운영 현실을 직접 비교한다.

──────────

프리랜서 편집, 실제 비용은?

월 10편 기준 → 50만~150만 원

여기에 숨은 비용이 있다.

❶ 편집자 교체 시마다 처음부터 브리핑 반복
❷ 수정 2~3회 초과 시 추가 비용 발생
❸ 납기 지연 시 광고·업로드 일정 전체 밀림

눈에 보이지 않는 비용이 더 크다.

──────────

에이컷 월정액, 비용 구조는?

월 4편 기준 → 약 49만 원~
편당 환산 시 → 약 12만 원 내외

여기에 포함되는 것들.

✔ 전담 에디터 고정 배정
✔ 브랜드 가이드 누적 저장
✔ 수정 무제한
✔ 48시간 납품 보장

──────────

월정액이 맞는 경우

· 월 4편 이상 정기 제작
· 납기가 콘텐츠 계획과 연동될 때
· 브랜드 품질 일관성이 중요할 때
· 편집에 시간을 너무 빼앗길 때

──────────

마무리

"편당 얼마"만으로 비용을 계산하면 안 된다.

납기 지연 비용, 브리핑 반복 시간, 품질 불일치 리스크까지 더하면
월정액의 실제 효율이 훨씬 높다.

──────────

지금 바로 무료 상담 신청하세요.
👉 aicut.co.kr`;

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
    }
  }, body);
  console.log('✅ 본문 입력');

  await page.waitForTimeout(500);

  // 제목과 본문 확인
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
  console.log(`확인: 제목="${result.title}" 본문=${result.bodyLen}자`);

  try { await b.close(); } catch(e) {}
  console.log('\n✅ 반영 완료! 브라우저에서 확인해주세요.');
})();

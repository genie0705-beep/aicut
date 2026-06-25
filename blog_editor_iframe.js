// 내부 에디터 iframe에 직접 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let pwFrame = null;
  for (const p of ctx.pages()) {
    for (const f of p.frames()) {
      if (f.url().includes('PostWriteForm')) {
        pwFrame = f;
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

  console.log('pwFrame:', pwFrame.url().substring(0, 80));

  // child frames
  const childFrames = pwFrame.childFrames();
  console.log('childFrames 수:', childFrames.length);
  
  // contenteditable body가 있는 iframe 찾기
  let editorIframe = null;
  for (const f of childFrames) {
    try {
      const hasEd = await f.evaluate(() => {
        return document.querySelector('[contenteditable]') !== null;
      });
      const fu = f.url().substring(0, 100);
      console.log(`iframe ${fu}: contenteditable=${hasEd}`);
      if (hasEd) {
        editorIframe = f;
      }
    } catch(e) {
      console.log(`iframe 접근불가: ${e.message.substring(0, 50)}`);
    }
  }

  if (!editorIframe) {
    console.log('❌ 에디터 iframe 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  console.log('✅ 에디터 iframe 발견');

  // 먼저 se-body 클릭해서 에디터 활성화
  await pwFrame.evaluate(() => {
    const seBody = document.querySelector('.se-body.__se-body');
    if (seBody) {
      seBody.click();
      seBody.focus();
    }
  });
  await pwFrame.waitForTimeout(1000);

  // 제목 입력 — se-body 내부에서 찾기
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  
  // postwrite form의 제목 입력 요소 찾기
  const titleResult = await pwFrame.evaluate((t) => {
    // se-document-title 관련 요소
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const cls = el.className || '';
      if (typeof cls === 'string' && (cls.includes('documentTitle') || cls.includes('title-text'))) {
        if (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          if (el.isContentEditable) {
            el.focus();
            el.innerText = t;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            return 'documentTitle입력';
          }
        }
      }
    }
    return '문서제목못찾음';
  }, title);
  console.log('제목:', titleResult);

  // 본문 — iframe contenteditable body에 입력
  const body = `"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."

요즘 병원 마케팅 현장에서 가장 자주 듣는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.

■ 영상이 신뢰도를 결정한다
환자 입장에서 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상, 실제 수술 과정, 환자 인터뷰 영상 하나가 블로그 포스팅 10개보다 강력하다.

■ 릴스·쇼츠로 예약까지 이어진다
병원 마케팅의 핵심은 "지금 필요한 사람"에게 도달하는 것이다. 인스타그램 릴스, 유튜브 쇼츠는 사용자의 관심사와 행동 데이터를 기반으로 콘텐츠를 추천한다.

■ 영상 편집 아웃소싱이 정답이다
병원이 할 일은 원장님 촬영, 에이컷이 할 일은 편집부터 납품까지 전부다.

지금 시작하세요. 영상 마케팅, 더 이상 선택이 아니라 필수입니다.`;

  // body는 새 줄을 br로
  const bodyHtml = body.replace(/\n/g, '<br>');

  const bodyResult = await editorIframe.evaluate((html) => {
    const ce = document.querySelector('[contenteditable]');
    if (ce) {
      ce.innerHTML = html;
      ce.dispatchEvent(new Event('input', { bubbles: true }));
      ce.dispatchEvent(new Event('change', { bubbles: true }));
      return '본문입력완료:길이=' + ce.innerText.length;
    }
    // body 자체가 contenteditable일 경우
    if (document.body.isContentEditable) {
      document.body.innerHTML = html;
      document.body.dispatchEvent(new Event('input', { bubbles: true }));
      return 'body본문입력완료';
    }
    return '본문못찾음';
  }, bodyHtml);
  console.log('본문:', bodyResult);

  console.log('\n✅ 완료! 브라우저에서 확인해주세요.');
  
  try { await b.close(); } catch(e) {}
})();

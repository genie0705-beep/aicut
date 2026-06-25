// 스마트에디터 4 정확한 영역에 입력
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

  // 1. 기존 contenteditable 초기화 (잘못 입력된 내용)
  await pwFrame.evaluate(() => {
    const eds = document.querySelectorAll('[contenteditable]');
    for (const ed of eds) {
      ed.innerText = '';
      ed.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // 2. se-body 영역 찾아서 focus + 클릭 (에디터 활성화)
  await pwFrame.evaluate(() => {
    const seBody = document.querySelector('.se-body.__se-body');
    if (seBody) {
      // 클릭 이벤트 발생시켜 에디터 활성화
      seBody.click();
      seBody.focus();
      console.log('se-body 클릭됨');
    }
  });
  
  await pwFrame.waitForTimeout(2000);

  // 3. 다시 contenteditable 확인 (새로 생겼을 수 있음)
  const edsAfter = await pwFrame.evaluate(() => {
    return Array.from(document.querySelectorAll('[contenteditable]')).map(el => ({
      tag: el.tagName,
      id: el.id,
      cls: (el.className || '').substring(0, 60),
      text: (el.innerText || '').substring(0, 30),
      rect: (() => { try { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }; } catch(e) { return {}; } })()
    }));
  });
  console.log('클릭 후 contenteditable:', JSON.stringify(edsAfter, null, 2));

  // 4. iframe contenteditable 재확인
  for (const f of pwFrame.childFrames()) {
    try {
      const innerEds = await f.evaluate(() => {
        return Array.from(document.querySelectorAll('[contenteditable]')).map(el => ({
          tag: el.tagName,
          id: el.id,
          cls: (el.className || '').substring(0, 50),
          text: (el.innerText || '').substring(0, 50),
          rect: (() => { try { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; } catch(e) { return {}; } })()
        }));
      });
      if (innerEds.length > 0) {
        console.log(`iframe ${f.url().substring(0, 50)} 내 eds:`, JSON.stringify(innerEds));
      }
    } catch(e) {}
  }

  // 5. 제목 입력 - se-body 내부 h1/h2/h3 찾기
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  
  // 제목 영역: se-body 안에 제목 section
  const titleResult = await pwFrame.evaluate((t) => {
    // se-body 안 contenteditable 찾기
    const seBody = document.querySelector('.se-body.__se-body');
    if (seBody) {
      const eds = seBody.querySelectorAll('[contenteditable]');
      console.log('se-body 내 contenteditable:', eds.length);
      if (eds.length > 0) {
        eds[0].focus();
        eds[0].innerText = t;
        eds[0].dispatchEvent(new Event('input', { bubbles: true }));
        return 'se-body제목입력:' + eds[0].innerText;
      }
    }
    return '제목못찾음';
  }, title);
  console.log('제목:', titleResult);

  // 6. 본문 입력
  const body = `"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."

요즘 병원 마케팅 현장에서 가장 자주 듣는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.

■ 영상이 신뢰도를 결정한다
환자 입장에서 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상, 실제 수술 과정, 환자 인터뷰 영상 하나가 블로그 포스팅 10개보다 강력하다.

■ 릴스·쇼츠로 예약까지 이어진다
병원 마케팅의 핵심은 "지금 필요한 사람"에게 도달하는 것이다. 인스타그램 릴스, 유튜브 쇼츠는 사용자의 관심사와 행동 데이터를 기반으로 콘텐츠를 추천한다.

■ 영상 편집 아웃소싱이 정답이다
병원이 할 일은 원장님 촬영, 에이컷이 할 일은 편집부터 납품까지 전부다.

지금 시작하세요. 영상 마케팅, 더 이상 선택이 아니라 필수입니다.`;

  const bodyResult = await pwFrame.evaluate((txt) => {
    const seBody = document.querySelector('.se-body.__se-body');
    if (seBody) {
      const eds = seBody.querySelectorAll('[contenteditable]');
      if (eds.length > 1) {
        // 두 번째부터 본문
        for (let i = 1; i < eds.length; i++) {
          eds[i].focus();
          eds[i].innerText = txt;
          eds[i].dispatchEvent(new Event('input', { bubbles: true }));
          return '본문입력완료:길이=' + txt.length + ' eds개수=' + eds.length;
        }
      }
    }
    return '본문못찾음';
  }, body);
  console.log('본문:', bodyResult);

  console.log('\n✅ 처리 완료! 브라우저에서 확인해주세요.');
  
  try { await b.close(); } catch(e) {}
})();

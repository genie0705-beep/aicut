// postwrite iframe 내부 직접 입력 (네이버 스마트에디터4 대응)
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let page = null;
  let pwFrame = null;
  
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com/aicut')) {
      page = p;
      for (const f of p.frames()) {
        if (f.url().includes('postwrite') || f.url().includes('PostWriteForm')) {
          pwFrame = f;
          break;
        }
      }
      break;
    }
  }

  if (!page || !pwFrame) {
    console.log('❌ 에디터 못 찾음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  console.log('✅ postwrite iframe 접근 완료');

  // 제목 입력 — contenteditable div 찾기
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  
  const titleResult = await pwFrame.evaluate((t) => {
    // 클래스 기반으로 제목 영역 찾기
    const titles = document.querySelectorAll('.se-documentTitle, .se-title-text, [class*="documentTitle"]');
    for (const el of titles) {
      if (el.isContentEditable) {
        el.focus();
        el.innerText = t;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return '제목입력:contenteditable=' + el.innerText.substring(0, 20);
      }
    }
    // contenteditable 전체 검색
    const all = document.querySelectorAll('[contenteditable]');
    for (const el of all) {
      const html = el.innerHTML || '';
      const cls = el.className || '';
      if (cls.includes('title') || cls.includes('Title') || html === '<br>' || html === '') {
        el.focus();
        el.innerText = t;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return '전체검색제목입력:클래스=' + cls.substring(0, 40);
      }
    }
    // input text 마지막 시도
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const inp of inputs) {
      if (inp.offsetParent !== null && inp.placeholder !== '글감을 검색') {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return 'input제목입력';
      }
    }
    return '제목못찾음';
  }, title);
  console.log('제목:', titleResult);

  await pwFrame.waitForTimeout(1500);

  // 본문 입력 — SE 본문 영역 찾기
  const body = `"OO성형외과 유튜브 보고 상담 왔어요."\n\n"치과 릴스 보고 예약했어요."\n\n요즘 병원 마케팅 현장에서 가장 자주 듣는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다. 유튜브, 인스타그램 릴스, 틱톡에서 병원의 수술 후기, 시술 과정, 원장 인터뷰 영상을 보고 방문 결정을 내린다.\n\n■ 영상이 신뢰도를 결정한다\n환자 입장에서 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상, 실제 수술 과정, 환자 인터뷰 영상 하나가 블로그 포스팅 10개보다 강력하다.\n\n■ 릴스·쇼츠로 예약까지 이어진다\n병원 마케팅의 핵심은 "지금 필요한 사람"에게 도달하는 것이다. 인스타그램 릴스, 유튜브 쇼츠는 사용자의 관심사와 행동 데이터를 기반으로 콘텐츠를 추천한다.\n\n■ 영상 편집 아웃소싱이 정답이다\n병원이 할 일은 원장님 촬영, 에이컷이 할 일은 편집부터 납품까지 전부다. 월 정기 계약으로 매주 꾸준한 업로드가 가능하다.\n\n지금 시작하세요.\n영상 마케팅, 더 이상 선택이 아니라 필수입니다.`;

  const bodyResult = await pwFrame.evaluate((txt) => {
    // SE 본문 영역 찾기
    const sections = document.querySelectorAll('.se-section, [class*="se-section"]');
    for (const sec of sections) {
      const childEd = sec.querySelector('[contenteditable]');
      if (childEd) {
        childEd.focus();
        childEd.innerHTML = txt.replace(/\n/g, '<br>');
        childEd.dispatchEvent(new Event('input', { bubbles: true }));
        childEd.dispatchEvent(new Event('change', { bubbles: true }));
        return 'section본문입력:길이=' + childEd.innerText.length;
      }
    }
    // contenteditable 전체 (제목 제외)
    const all = document.querySelectorAll('[contenteditable]');
    for (const el of all) {
      const cls = el.className || '';
      if (!cls.includes('title') && !cls.includes('Title')) {
        el.focus();
        el.innerHTML = txt.replace(/\n/g, '<br>');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'contenteditable본문입력:길이=' + el.innerText.length + ' 클래스=' + cls.substring(0, 40);
      }
    }
    return '본문못찾음';
  }, body);
  console.log('본문:', bodyResult);

  await pwFrame.waitForTimeout(500);

  // 최종 확인
  const final = await pwFrame.evaluate(() => {
    const all = document.querySelectorAll('[contenteditable]');
    const result = [];
    for (const el of all) {
      result.push({
        cls: (el.className || '').substring(0, 40),
        text: (el.innerText || '').substring(0, 30)
      });
    }
    return result;
  });
  console.log('📝 최종 상태:', JSON.stringify(final, null, 2));

  console.log('\n✅ 블로그 에디터 입력 완료!');
  console.log('이미지 삽입 후 발행해주세요.');
  
  try { await b.close(); } catch(e) {}
})();

// 오늘자 블로그 포스팅 초안 입력 v2 - 상세 디버깅
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // 블로그 에디터 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    const u = p.url();
    console.log('탭 확인:', u.substring(0, 100));
    if (u.includes('postwrite') || (u.includes('blog.naver.com') && (u.includes('write') || u.includes('post')))) {
      page = p;
      console.log('✅ 에디터 탭 발견:', u);
      break;
    }
  }

  // 에디터 탭 없으면 새로 열기
  if (!page) {
    console.log('📄 에디터 탭 없음. 새로 열기 시도...');
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('📄 새 에디터 탭 열림:', page.url().substring(0, 80));
    await page.waitForTimeout(3000);
  }

  // 현재 URL과 페이지 상태 확인
  const currentUrl = page.url();
  console.log('현재 URL:', currentUrl);

  // 로그인 페이지인지 확인
  const pageTitle = await page.title();
  console.log('페이지 제목:', pageTitle);

  // DOM 구조 확인
  const domInfo = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    const textareas = document.querySelectorAll('textarea');
    const contenteditables = document.querySelectorAll('[contenteditable]');
    const iframes = document.querySelectorAll('iframe');
    const seIframes = document.querySelectorAll('iframe[id*="SE"]');
    return {
      inputCount: inputs.length,
      textareaCount: textareas.length,
      contenteditableCount: contenteditables.length,
      iframeCount: iframes.length,
      seIframeCount: seIframes.length,
      bodyHtml: document.body ? document.body.innerHTML.substring(0, 200) : 'no body'
    };
  });
  console.log('DOM 구조:', JSON.stringify(domInfo, null, 2));

  // SE iframe이 있다면 그 안으로 들어감
  let editorFrame = null;
  const seIframes = await page.$$('iframe[id*="SE"], iframe[name*="SE"], iframe.editor, iframe');
  for (const f of seIframes) {
    const src = await f.getAttribute('src') || '';
    const id = await f.getAttribute('id') || '';
    const name = await f.getAttribute('name') || '';
    console.log('iframe 발견:', { id, name, src: src.substring(0, 100) });
    if (src && (src.includes('SE') || src.includes('editor'))) {
      try {
        const frame = await f.contentFrame();
        if (frame) {
          editorFrame = frame;
          console.log('✅ 에디터 iframe 접근 성공');
          const frameHtml = await frame.evaluate(() => document.body ? document.body.innerHTML.substring(0, 200) : 'no body');
          console.log('iframe body:', frameHtml);
        }
      } catch(e) {
        console.log('iframe 접근 실패:', e.message);
      }
    }
  }

  // 제목 입력 시도 (다양한 방식)
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';

  // 방식 1: input[type="text"]
  let titleDone = await page.evaluate((t) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.type === 'text' && inp.offsetParent !== null) {
        try {
          const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          s.call(inp, t);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
          return 'input방식:' + inp.value?.substring(0, 20);
        } catch(e) { return 'input방식에러:' + e.message; }
      }
    }
    return '입력창못찾음';
  }, title);
  console.log('제목 입력 시도 1:', titleDone);

  // 방식 2: placeholder로 찾기
  if (titleDone === '입력창못찾음' || titleDone.startsWith('입력창못찾음')) {
    titleDone = await page.evaluate((t) => {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if (el.placeholder && (el.placeholder.includes('제목') || el.placeholder.includes('Title'))) {
          try {
            const tag = el.tagName;
            if (tag === 'INPUT') {
              const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              s.call(el, t);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              return 'placeholder방식:' + el.value?.substring(0, 20);
            }
          } catch(e) { return 'placeholder에러:' + e.message; }
        }
      }
      return 'placeholder못찾음';
    }, title);
    console.log('제목 입력 시도 2:', titleDone);
  }

  await page.waitForTimeout(1000);

  // 본문 입력 시도
  const body = `"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."

요즘 병원 마케팅 현장에서 가장 자주 듣는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.

영상이 신뢰도를 결정한다. 환자 입장에서 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상, 실제 수술 과정, 환자 인터뷰 영상 하나가 블로그 포스팅 10개보다 강력하다.

릴스·쇼츠로 예약까지 이어진다. 병원 마케팅의 핵심은 "지금 필요한 사람"에게 도달하는 것이다. 인스타그램 릴스, 유튜브 쇼츠는 사용자의 관심사와 행동 데이터를 기반으로 콘텐츠를 추천한다.

영상 편집 아웃소싱이 정답이다. 병원이 할 일은 원장님 촬영, 에이컷이 할 일은 편집부터 납품까지 전부다. 월 정기 계약으로 매주 꾸준한 업로드가 가능하다.

지금 시작하세요. 영상 마케팅, 더 이상 선택이 아니라 필수입니다.`;

  // 에디터 프레임에 입력
  if (editorFrame) {
    await editorFrame.evaluate((txt) => {
      document.body.innerText = txt;
      document.body.dispatchEvent(new Event('input', { bubbles: true }));
    }, body);
    console.log('✅ iframe 본문 입력 완료');
  } else {
    // contenteditable 찾기
    const bodyResult = await page.evaluate((txt) => {
      const eds = document.querySelectorAll('[contenteditable]');
      if (eds.length > 0) {
        const ed = eds[0];
        ed.focus();
        ed.innerText = txt;
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        ed.dispatchEvent(new Event('change', { bubbles: true }));
        return 'contenteditable입력:길이=' + ed.innerText.length;
      }
      // textarea 찾기
      const tas = document.querySelectorAll('textarea');
      if (tas.length > 0) {
        const ta = tas[0];
        ta.value = txt;
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
        return 'textarea입력:길이=' + ta.value.length;
      }
      return '본문입력요소못찾음';
    }, body);
    console.log('본문 입력 결과:', bodyResult);
  }

  // 최종 확인
  const final = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    let t = '';
    for (const inp of inputs) {
      if (inp.value && inp.value.length > 5) { t = inp.value.substring(0, 30); break; }
    }
    const eds = document.querySelectorAll('[contenteditable]');
    let cl = 0;
    for (const ed of eds) { if (ed.innerText && ed.innerText.length > cl) cl = ed.innerText.length; }
    const tas = document.querySelectorAll('textarea');
    for (const ta of tas) { if (ta.value && ta.value.length > cl) cl = ta.value.length; }
    return { title: t, contentLen: cl };
  });
  console.log(`📝 최종 확인: 제목="${final.title}" 본문=${final.contentLen}자`);

  try { await b.close(); } catch(e) {}
  console.log('\n✅ 처리 완료! 브라우저에서 확인 후 이미지 삽입+발행해주세요.');
})();

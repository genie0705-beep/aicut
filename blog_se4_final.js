// SM4 React Controlled Component 직접 조작
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // postwrite iframe 찾기
  let pwFrame = null;
  let page = null;
  for (const p of ctx.pages()) {
    for (const f of p.frames()) {
      if (f.url().includes('postwrite')) {
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

  // 1. se-body 영역 클릭해서 활성화
  await pwFrame.evaluate(() => {
    document.querySelector('.se-body.__se-body')?.click();
  });
  await pwFrame.waitForTimeout(2000);

  // 2. postwrite 내부 input_buffer iframe 찾기 (실제 SE 에디터)
  let seFrame = null;
  for (const f of pwFrame.childFrames()) {
    try {
      // contenteditable 체크
      const info = await f.evaluate(() => {
        return {
          url: document.location.href.substring(0, 80),
          bodyEditable: document.body?.isContentEditable || false,
          ceCount: document.querySelectorAll('[contenteditable]').length,
          bodyLen: (document.body?.innerText || '').length
        };
      });
      if (info.ceCount > 0 || info.bodyEditable) {
        seFrame = f;
        console.log('✅ SE 프레임:', JSON.stringify(info));
        break;
      }
    } catch(e) {}
  }

  if (!seFrame) {
    console.log('⚠️ SE 프레임 못 찾음, pwFrame에서 직접 execCommand 시도');

    // pwFrame에서 직접 execCommand 시도
    const body = `"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."

요즘 병원 마케팅 현장에서 실제로 나오는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.

이유 1. 영상이 신뢰도를 결정한다

환자가 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상 하나, 실제 시술 과정과 환자 후기 영상 하나가 블로그 포스팅 10개보다 강력하다.

이유 2. 릴스·쇼츠가 예약으로 연결된다

"코 성형 고민"으로 검색한 사람에게 해당 병원의 후기 영상이 자동으로 노출된다. 텍스트 광고보다 훨씬 자연스럽고 효과적이다.

이유 3. 편집 아웃소싱이 정답이다

병원이 할 일 = 원장님 촬영. 에이컷이 할 일 = 편집부터 납품까지 전부. 의료 영상 편집 경험이 있는 전담팀이 직접 작업한다.

지금 시작하세요. 편집은 에이컷에 맡기고 진료에 집중하세요.`;

    // React fiber 접근 시도
    const result = await pwFrame.evaluate((txt) => {
      const seBody = document.querySelector('.se-body.__se-body');
      if (!seBody) return 'seBody 없음';

      // 방법 1: execCommand
      try {
        const ed = document.querySelector('[contenteditable]');
        if (ed && ed.getBoundingClientRect().width > 50) {
          ed.focus();
          document.execCommand('selectAll', false);
          document.execCommand('insertText', false, txt);
          return 'execCommand성공:' + ed.innerText.length;
        }
      } catch(e) {}

      // 방법 2: React fiber 탐색
      const allKeys = Object.keys(seBody);
      const fiberKey = allKeys.find(k => k.startsWith('__reactFiber$'));
      if (fiberKey) {
        let fiber = seBody[fiberKey];
        // editor instance 찾기
        let depth = 0;
        while (fiber && depth < 20) {
          if (fiber.stateNode && fiber.stateNode.editor) {
            const editor = fiber.stateNode.editor;
            if (typeof editor.setContent === 'function') {
              editor.setContent(txt);
              return 'ReactEditor.setContent 성공';
            }
          }
          if (fiber.memoizedState && fiber.memoizedState.queue) {
            // checked - may have editor ref
          }
          fiber = fiber.child || fiber.sibling || fiber.return;
          depth++;
        }
        return 'fiber탐색실패 depth=' + depth;
      }
      
      return 'fiberKey 없음';
    }, body);
    console.log('결과:', result);
    
  } else {
    // SE 프레임에서 본문 입력
    console.log('✅ SE 프레임 발견, 본문 입력 중...');
    
    const body = `"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."

요즘 병원 마케팅 현장에서 실제로 나오는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.

이유 1. 영상이 신뢰도를 결정한다

환자가 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상 하나, 실제 시술 과정과 환자 후기 영상 하나가 블로그 포스팅 10개보다 강력하다.

이유 2. 릴스·쇼츠가 예약으로 연결된다

"코 성형 고민"으로 검색한 사람에게 해당 병원의 후기 영상이 자동으로 노출된다. 텍스트 광고보다 훨씬 자연스럽고 효과적이다.

이유 3. 편집 아웃소싱이 정답이다

병원이 할 일 = 원장님 촬영. 에이컷이 할 일 = 편집부터 납품까지 전부. 의료 영상 편집 경험이 있는 전담팀이 직접 작업한다.

지금 시작하세요. 편집은 에이컷에 맡기고 진료에 집중하세요.`;

    // execCommand 시도
    const result = await seFrame.evaluate((txt) => {
      const body = document.body;
      if (body.isContentEditable) {
        body.focus();
        body.innerHTML = '';
        document.execCommand('insertText', false, txt);
        return 'execCommand성공 길이=' + body.innerText.length;
      }
      // contenteditable 찾기
      const ce = document.querySelector('[contenteditable]');
      if (ce) {
        ce.focus();
        ce.innerHTML = '';
        document.execCommand('insertText', false, txt);
        return 'ce execCommand성공 길이=' + ce.innerText.length;
      }
      return 'contenteditable 없음';
    }, body);
    console.log('SE 프레임 결과:', result);
  }
  
  try { await b.close(); } catch(e) {}
  console.log('\n✅ 처리 완료! 브라우저에서 확인해주세요.');
})();

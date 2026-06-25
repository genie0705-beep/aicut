const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages().find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // 1. 에디터 영역(se-body) 클릭해서 활성화
  await page.evaluate(() => {
    const seBody = document.querySelector('.se-body');
    if (seBody) {
      seBody.click();
      seBody.focus();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // 2. SE4 에디터 인스턴스 찾기
  const editorFound = await page.evaluate(() => {
    const win = window;
    // SE4 에디터 전역 객체 확인
    const candidates = [
      'Editor', 'SmartEditor', 'SE4', 'SeEditor', 'editor', 'se_editor',
      'naver.editor', 'SmartEditor2'
    ];
    const found = [];
    for (const key of candidates) {
      const parts = key.split('.');
      let val = win;
      for (const p of parts) {
        val = val?.[p];
        if (!val) break;
      }
      if (val && typeof val === 'object') {
        found.push(key);
      }
    }
    return found;
  });
  console.log('에디터 객체 후보:', editorFound);

  // 3. 에디터 내부 __editor 찾기
  const apiFound = await page.evaluate(() => {
    const results = [];
    // SE_editor의 __editor
    const se = document.querySelector('#SE_editor, .blog_editor, .se-editor');
    if (se) {
      const keys = Object.keys(se);
      results.push('SE_editor keys: ' + keys.filter(k => k.startsWith('__') || k.startsWith('_')).join(', '));
      // React internal
      const ri = se['__reactInternalInstance$' + Object.keys(se).find(k => k.startsWith('__reactInternalInstance'))?.slice(24)];
      if (ri) results.push('React internal found');
    }
    return results;
  });
  console.log('API 탐색:', apiFound);

  // 4. contenteditable 찾아서 paste 이벤트 발생
  const content = `쇼핑몰·이커머스 운영자라면 영상 마케팅이 필요한 이유

쇼핑몰을 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다.

"상세페이지에 사진 여러 장 넣었는데 왜 구매로 안 이어질까?"
"인스타그램에 릴스를 올렸는데 조회수가 200도 안 나온다."

정답은 하나입니다. 쇼핑몰 마케팅의 핵심은 이제 사진이 아니라 영상입니다.

■ 쇼핑몰, 왜 영상 마케팅이 필수인가

제품 영상 하나가 상세페이지 10장보다 강력합니다. 실제로 제품 영상을 본 고객의 구매 전환율은 사진만 본 고객보다 최대 80% 높습니다.

숏폼이 쇼핑몰 트래픽의 중심입니다. 인스타그램 릴스, 틱톡, 유튜브 쇼츠는 이제 필수입니다.

스마트스토어·네이버쇼핑도 영상을 우선합니다. 제품 영상 등록 시 검색 랭킹과 노출 가중치를 높게 줍니다.

■ 쇼핑몰 운영자가 영상 제작에 실패하는 이유

직접 촬영+편집 → 하루 2~3편 한계
인플루언서 위탁 → 시점 불확실
건당 외주 → 편집자마다 퀄리티 상이

■ 쇼핑몰 영상, 에이컷이 해결합니다

에이컷은 쇼핑몰 고객사의 제품 영상을 월정기로 편집합니다. 촬영 원본만 보내주시면 자막, BGM, 브랜드 로고를 적용해서 릴스/쇼츠로 납품합니다.

패션/의류 → 착용샷 릴스
뷰티/화장품 → 제품 사용법
식품/맛집 → 조리 과정
리빙/잡화 → 개봉기

브랜드 가이드 한 번 저장으로 모든 영상이 동일한 톤으로 제작됩니다.

■ 지금 시작해야 하는 이유

네이버, 쿠팡, 인스타그램 모두 영상 중심 알고리즘입니다. 지금 시작해야 누적된 콘텐츠로 차이가 납니다.

영상 편집 아웃소싱이 처음이시라면 문의 주세요.

카카오톡 채널: 에이컷
이메일: contact@aicut.co.kr
홈페이지: aicut.co.kr`;

  // 5. ClipboardEvent paste 시뮬레이션
  const pasteResult = await page.evaluate((txt) => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return 'CE 없음';

    // 1) 먼저 contenteditable 초기화
    ce.innerHTML = '';
    ce.innerText = '';

    // 2) focus
    ce.focus();
    
    // 3) DataTransfer 생성
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', txt);
      
      // paste 이벤트 생성 및 dispatch
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true
      });
      
      const dispatched = ce.dispatchEvent(pasteEvent);
      
      // 4) input 이벤트도 추가로 발생
      ce.dispatchEvent(new Event('input', { bubbles: true }));
      
      return 'paste dispatched: ' + dispatched + ', ce text: ' + (ce.innerText || '').substring(0, 30);
    } catch (e) {
      return 'paste error: ' + e.message;
    }
  }, content);

  console.log('paste 결과:', pasteResult);
  await new Promise(r => setTimeout(r, 2000));

  // 6. 화면에 보이는지 확인
  const visibleCheck = await page.evaluate(() => {
    // se-body 영역 내 텍스트 확인
    const seBody = document.querySelector('.se-body');
    const other = document.querySelector('.se-section, [class*="se-section"]');
    
    const results = {};
    
    if (seBody) {
      results.seBodyText = seBody.innerText.substring(0, 100);
      results.seBodyChildren = seBody.children.length;
      
      // se-body 내부에 contenteditable이 있는지
      const innerCE = seBody.querySelector('[contenteditable]');
      results.innerCE = innerCE ? (innerCE.innerText || '').substring(0, 50) : '없음';
    }
    
    // SE editor 내 모든 텍스트 노드
    const editor = document.querySelector('.blog_editor');
    if (editor) {
      results.editorText = editor.innerText.substring(0, 100);
    }
    
    return results;
  });
  
  console.log('화면 표시 확인:', JSON.stringify(visibleCheck, null, 2));

  // 7. 스크린샷
  await page.screenshot({ path: 'postwrite_after_paste.png' });
  console.log('스크린샷: postwrite_after_paste.png');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

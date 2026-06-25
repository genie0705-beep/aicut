// 블로그 메인 탭 → 글쓰기 버튼 클릭 → 에디터 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // 블로그 메인 탭 찾기
  let blogPage = null;
  for (const p of ctx.pages()) {
    const u = p.url();
    if (u.includes('blog.naver.com/aicut') && !u.includes('write')) {
      blogPage = p;
      blogPage.bringToFront();
      console.log('✅ 블로그 메인 탭 발견:', u);
      break;
    }
  }

  if (!blogPage) {
    console.log('❌ 블로그 메인 탭 없음. blog.naver.com/aicut 탭을 먼저 열어주세요.');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // 글쓰기 버튼 찾아서 클릭
  console.log('📝 글쓰기 버튼 찾는 중...');
  
  // 다양한 선택자로 글쓰기 버튼 시도
  const clicked = await blogPage.evaluate(() => {
    // 버튼 찾기
    const selectors = [
      'a[href*="PostWrite"]',
      'a[href*="/write"]',
      'a[onclick*="write"]',
      'a[class*="write"]',
      'a[class*="post"]',
      'button[class*="write"]',
      'button[class*="post"]',
      '.btn_write a',
      '.post_write a',
      '[class*="writeBtn"]',
      '[class*="btnWrite"]',

    ];
    
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        el.click();
        return '클릭성공:' + sel;
      }
    }

    // SVG/아이콘 버튼 찾기 (마지막 시도)
    const allLinks = document.querySelectorAll('a, button');
    for (const el of allLinks) {
      const text = el.innerText || el.textContent || '';
      if (text.includes('글쓰기') || text.includes('작성')) {
        el.click();
        return '텍스트클릭성공:' + text.substring(0, 10);
      }
    }

    return '버튼못찾음';
  });
  console.log('글쓰기 버튼 클릭 결과:', clicked);

  await blogPage.waitForTimeout(3000);

  // 새 탭이 열렸는지 확인
  let editorPage = null;
  for (const p of ctx.pages()) {
    const u = p.url();
    if (u.includes('PostWrite') || u.includes('write')) {
      editorPage = p;
      console.log('✅ 에디터 탭 발견:', u.substring(0, 100));
      break;
    }
  }

  if (!editorPage) {
    // 현재 페이지가 에디터로 전환됐는지 확인
    const currUrl = blogPage.url();
    console.log('현재 페이지 URL:', currUrl.substring(0, 100));
    if (currUrl.includes('write') || currUrl.includes('PostWrite')) {
      editorPage = blogPage;
      console.log('✅ 현재 페이지가 에디터입니다');
    }
  }

  if (!editorPage) {
    console.log('❌ 에디터를 찾을 수 없습니다. 직접 에디터를 열어주세요.');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  await editorPage.waitForTimeout(2000);

  // 제목 입력 - SE 에디터 구조 확인
  const editorInfo = await editorPage.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    const frameInfo = [];
    for (const f of frames) {
      frameInfo.push({
        id: f.id,
        name: f.name,
        src: (f.src || '').substring(0, 100),
        title: f.title
      });
    }
    const inputs = document.querySelectorAll('input[type="text"]');
    const inputInfo = [];
    for (const inp of inputs) {
      inputInfo.push({
        id: inp.id,
        name: inp.name,
        className: inp.className?.substring(0, 50),
        placeholder: inp.placeholder,
        value: inp.value?.substring(0, 20),
        visible: inp.offsetParent !== null
      });
    }
    return { frames: frameInfo, inputs: inputInfo };
  });
  console.log('에디터 구조:', JSON.stringify(editorInfo, null, 2));

  // 제목 입력
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  
  // SE 에디터의 제목 input 찾기
  const titleResult = await editorPage.evaluate((t) => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const inp of inputs) {
      if (inp.offsetParent !== null) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return '입력완료:' + inp.value?.substring(0, 20);
      }
    }
    // title 속성으로 검색
    const allInputs = document.querySelectorAll('input');
    for (const inp of allInputs) {
      if (inp.title && (inp.title.includes('제목') || inp.title.includes('title'))) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return 'title속성입력완료';
      }
    }
    return '제목입력창못찾음';
  }, title);
  console.log('제목 입력:', titleResult);

  await editorPage.waitForTimeout(1000);

  // SE iframe 찾아서 본문 입력
  let bodyInjected = false;
  
  // SE iframe 찾기
  const seFrame = await editorPage.$('iframe#se2, iframe[id*="SE"], iframe[name*="SE"]');
  if (seFrame) {
    try {
      const frame = await seFrame.contentFrame();
      if (frame) {
        const body = `"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."\n\n요즘 병원 마케팅 현장에서 가장 자주 듣는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.\n\n■ 영상이 신뢰도를 결정한다\n환자 입장에서 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상, 실제 수술 과정, 환자 인터뷰 영상 하나가 블로그 포스팅 10개보다 강력하다.\n\n■ 릴스·쇼츠로 예약까지 이어진다\n병원 마케팅의 핵심은 "지금 필요한 사람"에게 도달하는 것이다. 인스타그램 릴스, 유튜브 쇼츠는 사용자의 관심사와 행동 데이터를 기반으로 콘텐츠를 추천한다.\n\n■ 영상 편집 아웃소싱이 정답이다\n병원이 할 일은 원장님 촬영, 에이컷이 할 일은 편집부터 납품까지 전부다. 월 정기 계약으로 매주 꾸준한 업로드가 가능하다.\n\n지금 시작하세요. 영상 마케팅, 더 이상 선택이 아니라 필수입니다.`;
        
        await frame.evaluate((txt) => {
          const bodyEl = document.body;
          if (bodyEl) {
            bodyEl.innerHTML = txt.replace(/\n/g, '<br>');
            bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
            bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, body);
        bodyInjected = true;
        console.log('✅ SE iframe 본문 입력 완료');
      }
    } catch(e) {
      console.log('iframe 접근 실패:', e.message);
    }
  }

  // iframe 못 찾았으면 contenteditable 직접 찾기
  if (!bodyInjected) {
    const bodyResult = await editorPage.evaluate(() => {
      // SE 에디터의 contenteditable 찾기
      const all = document.querySelectorAll('[contenteditable]');
      if (all.length > 0) {
        return 'contenteditable있음:' + all.length;
      }
      const textareas = document.querySelectorAll('textarea');
      if (textareas.length > 0) {
        return 'textarea있음:' + textareas.length;
      }
      return '본문요소못찾음';
    });
    console.log('본문 요소 상태:', bodyResult);
  }

  console.log('\n✅ 처리 완료! 브라우저에서 확인 후 이미지 삽입+발행해주세요.');
  
  try { await b.close(); } catch(e) {}
})();

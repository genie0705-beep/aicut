// 네이버 블로그 iframe 대응 + 에디터 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // 모든 페이지/iframe 목록 출력
  for (const p of ctx.pages()) {
    console.log('메인탭:', p.url().substring(0, 100));
    const frames = p.frames();
    for (const f of frames) {
      if (f.url() !== 'about:blank') {
        console.log('  └ iframe:', f.url().substring(0, 100));
      }
    }
  }

  // 블로그 메인 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com/aicut')) {
      page = p;
      break;
    }
  }

  if (!page) {
    console.log('❌ 블로그 탭 없음');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // mainFrame iframe 찾기
  const mainFrame = page.frames().find(f => f.url().includes('mainFrame') || f.name() === 'mainFrame' || f.url().includes('BlogHome'));
  if (mainFrame) {
    console.log('✅ mainFrame 발견:', mainFrame.url().substring(0, 80));
    
    // mainFrame 안에서 글쓰기 버튼 찾기
    const btnResult = await mainFrame.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const el of links) {
        const text = el.innerText || el.textContent || '';
        if (text.includes('글쓰기')) {
          el.click();
          return '찾음:' + text.trim().substring(0, 10);
        }
      }
      // aria-label 검색
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const aria = el.getAttribute('aria-label') || '';
        if (aria.includes('글쓰기')) {
          el.click();
          return 'aria글쓰기클릭';
        }
        const cls = el.className || '';
        if (typeof cls === 'string' && (cls.includes('write') || cls.includes('post'))) {
          el.click();
          return 'class글쓰기클릭:' + cls.substring(0, 30);
        }
      }
      return '못찾음';
    });
    console.log('글쓰기 버튼:', btnResult);
  } else {
    console.log('mainFrame 없음, 새 탭 열기 시도');
    const newPage = await ctx.newPage();
    await newPage.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('직접 이동 URL:', newPage.url().substring(0, 100));
  }

  await page.waitForTimeout(3000);

  // 에디터 찾기
  let editorPage = null;
  for (const p of ctx.pages()) {
    const u = p.url();
    if (u.includes('PostWrite') || u.includes('write')) {
      editorPage = p;
      console.log('✅ 에디터 탭:', u.substring(0, 100));
      break;
    }
  }

  // 새로 열린 탭들 확인
  if (!editorPage) {
    console.log('현재 페이지들:');
    for (const p of ctx.pages()) {
      console.log(' -', p.url().substring(0, 100));
      // 새 탭은 about:blank일 수 있으니 다시 goto
      if (p.url() === 'about:blank') {
        try {
          await p.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut', { timeout: 10000 });
          console.log('  → 이동 후:', p.url().substring(0, 100));
          if (p.url().includes('write') || p.url().includes('PostWrite')) {
            editorPage = p;
            break;
          }
        } catch(e) {
          console.log('  → 이동 실패:', e.message.substring(0, 50));
        }
      }
    }
  }

  if (!editorPage) {
    console.log('❌ 에디터를 열 수 없습니다. 직접 네이버 블로그에서 글쓰기를 열어주세요.');
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  await editorPage.waitForTimeout(2000);

  // 에디터 iframe 분석
  const frameInfo = await editorPage.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    return Array.from(frames).map(f => ({
      id: f.id,
      name: f.name,
      src: (f.src || '').substring(0, 120),
      title: f.title
    }));
  });
  console.log('에디터 iframes:', JSON.stringify(frameInfo, null, 2));

  // 제목 입력
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  const titleResult = await editorPage.evaluate((t) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.type === 'text' || inp.type === 'search') && inp.offsetParent !== null) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return '입력완료';
      }
    }
    return '못찾음';
  }, title);
  console.log('제목:', titleResult);

  await editorPage.waitForTimeout(1000);

  // 본문 - SE iframe 찾아서 입력
  let bodyIn = false;
  for (const f of editorPage.frames()) {
    const fu = f.url();
    // SE, editor, smart 등 본문 에디터 iframe
    if (fu.includes('SE') || fu.includes('editor') || fu.includes('smart') || fu.includes('Writer')) {
      console.log('에디터 iframe:', fu.substring(0, 100));
      try {
        const body = `"OO성형외과 유튜브 보고 상담 왔어요."\n\n"치과 릴스 보고 예약했어요."\n\n요즘 병원 마케팅 현장에서 가장 자주 듣는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다. 유튜브, 인스타그램 릴스, 틱톡에서 병원의 수술 후기, 시술 과정, 원장 인터뷰 영상을 보고 방문 결정을 내린다.\n\n■ 영상이 신뢰도를 결정한다\n환자 입장에서 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상, 실제 수술 과정, 환자 인터뷰 영상 하나가 블로그 포스팅 10개보다 강력하다.\n\n■ 릴스·쇼츠로 예약까지 이어진다\n병원 마케팅의 핵심은 "지금 필요한 사람"에게 도달하는 것이다. 인스타그램 릴스, 유튜브 쇼츠는 사용자의 관심사와 행동 데이터를 기반으로 콘텐츠를 추천한다.\n\n■ 영상 편집 아웃소싱이 정답이다\n병원이 할 일은 원장님 촬영, 에이컷이 할 일은 편집부터 납품까지 전부다. 월 정기 계약으로 매주 꾸준한 업로드가 가능하다.\n\n지금 시작하세요.\n영상 마케팅, 더 이상 선택이 아니라 필수입니다.\n환자가 영상으로 병원을 고르는 시대, 편집은 에이컷에 맡기고 진료에 집중하세요.`;
        
        await f.evaluate((txt) => {
          const body = document.body;
          if (body) {
            body.innerHTML = txt.replace(/\n/g, '<br>');
            body.dispatchEvent(new Event('input', { bubbles: true }));
            body.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, body);
        bodyIn = true;
        console.log('✅ 본문 입력 완료');
        break;
      } catch(e) {
        console.log('iframe 입력 실패:', e.message.substring(0, 60));
      }
    }
  }

  if (!bodyIn) {
    // 에디터 프레임에서 contenteditable 찾기
    for (const f of editorPage.frames()) {
      try {
        const result = await f.evaluate(() => {
          const eds = document.querySelectorAll('[contenteditable]');
          return 'contenteditable:' + eds.length;
        });
        console.log(f.url().substring(0, 60), '→', result);
      } catch(e) {}
    }
  }

  console.log('\n✅ 완료! 브라우저에서 확인 후 이미지 삽입+발행해주세요.');
  
  try { await b.close(); } catch(e) {}
})();

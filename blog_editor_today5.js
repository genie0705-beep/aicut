// 이미 열린 에디터에 내용 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  // 블로그+postwrite iframe이 있는 탭 찾기
  let page = null;
  let pwFrame = null;
  
  for (const p of ctx.pages()) {
    const u = p.url();
    if (u.includes('blog.naver.com/aicut')) {
      page = p;
      console.log('✅ 블로그 탭:', u);
      // postwrite iframe 찾기
      for (const f of p.frames()) {
        const fu = f.url();
        if (fu.includes('postwrite')) {
          pwFrame = f;
          console.log('✅ postwrite iframe 발견:', fu);
          break;
        }
      }
      break;
    }
  }

  if (!page || !pwFrame) {
    console.log('❌ 블로그/에디터 찾지 못함');
    console.log('사용 가능한 모든 프레임:');
    for (const p of ctx.pages()) {
      if (p.url().includes('blog.naver.com')) {
        console.log('블로그 탭:', p.url());
        for (const f of p.frames()) {
          console.log('  iframe:', f.url().substring(0, 100));
        }
      }
    }
    try { await b.close(); } catch(e) {}
    process.exit(1);
  }

  // postwrite iframe 내부 분석
  const info = await pwFrame.evaluate(() => {
    const frames = document.querySelectorAll('iframe');
    const inputs = document.querySelectorAll('input');
    const all = document.querySelectorAll('*');
    const classes = new Set();
    all.forEach(el => {
      if (el.className && typeof el.className === 'string') {
        el.className.split(' ').forEach(c => { if (c) classes.add(c); });
      }
    });
    return {
      iframes: Array.from(frames).map(f => ({ id: f.id, name: f.name, src: (f.src || '').substring(0, 100) })),
      inputs: Array.from(inputs).map(inp => ({ id: inp.id, type: inp.type, placeholder: inp.placeholder, className: (inp.className || '').substring(0, 50) })),
      titleElement: document.querySelector('title')?.innerText?.substring(0, 50),
      classList: Array.from(classes).filter(c => c.toLowerCase().includes('title') || c.toLowerCase().includes('edit') || c.toLowerCase().includes('write') || c.toLowerCase().includes('input')).slice(0, 30)
    };
  });
  console.log('postwrite 내부:', JSON.stringify(info, null, 2));

  // postwrite 안에 있는 SE iframe 찾기
  let editorFrame = null;
  for (const f of pwFrame.frames()) {
    const fu = f.url();
    console.log('postwrite 내부 iframe:', fu.substring(0, 120));
    if (fu.includes('SE') || fu.includes('editor') || fu.includes('smartEditor') || fu.includes('smart_editor')) {
      editorFrame = f;
      console.log('✅ 본문 에디터 iframe 발견');
      break;
    }
  }

  // 제목: postwrite 내에서 input 찾기
  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  const titleResult = await pwFrame.evaluate((t) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.type === 'text' || inp.type === 'search') && inp.offsetParent !== null) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return '입력완료:' + inp.className?.substring(0, 30);
      }
    }
    return '제목입력요소못찾음';
  }, title);
  console.log('제목 입력:', titleResult);

  await pwFrame.waitForTimeout(1000);

  // 본문 입력
  const body = `"OO성형외과 유튜브 보고 상담 왔어요."\n\n"치과 릴스 보고 예약했어요."\n\n요즘 병원 마케팅 현장에서 가장 자주 듣는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다. 유튜브, 인스타그램 릴스, 틱톡에서 병원의 수술 후기, 시술 과정, 원장 인터뷰 영상을 보고 방문 결정을 내린다.\n\n■ 영상이 신뢰도를 결정한다\n환자 입장에서 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상, 실제 수술 과정, 환자 인터뷰 영상 하나가 블로그 포스팅 10개보다 강력하다.\n\n■ 릴스·쇼츠로 예약까지 이어진다\n병원 마케팅의 핵심은 "지금 필요한 사람"에게 도달하는 것이다. 인스타그램 릴스, 유튜브 쇼츠는 사용자의 관심사와 행동 데이터를 기반으로 콘텐츠를 추천한다.\n\n■ 영상 편집 아웃소싱이 정답이다\n병원이 할 일은 원장님 촬영, 에이컷이 할 일은 편집부터 납품까지 전부다. 월 정기 계약으로 매주 꾸준한 업로드가 가능하다.\n\n지금 시작하세요.\n영상 마케팅, 더 이상 선택이 아니라 필수입니다.`;

  if (editorFrame) {
    await editorFrame.evaluate((txt) => {
      const bodyEl = document.body;
      if (bodyEl) {
        bodyEl.innerHTML = txt.replace(/\n/g, '<br>');
        bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
        bodyEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, body);
    console.log('✅ SE iframe 본문 입력 완료');
  } else {
    // postwrite 내부에서 contenteditable 찾기
    const bodyResult = await pwFrame.evaluate((txt) => {
      const all = document.querySelectorAll('[contenteditable]');
      if (all.length > 0) {
        const ed = all[0];
        ed.focus();
        ed.innerHTML = txt.replace(/\n/g, '<br>');
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        ed.dispatchEvent(new Event('change', { bubbles: true }));
        return 'contenteditable입력완료:길이=' + ed.innerText.length;
      }
      return 'contenteditable없음';
    }, body);
    console.log('본문 입력:', bodyResult);

    // textarea도 확인
    if (bodyResult.includes('없음')) {
      const taResult = await pwFrame.evaluate((txt) => {
        const tas = document.querySelectorAll('textarea');
        if (tas.length > 0) {
          tas[0].value = txt;
          tas[0].dispatchEvent(new Event('input', { bubbles: true }));
          tas[0].dispatchEvent(new Event('change', { bubbles: true }));
          return 'textarea입력완료:길이=' + tas[0].value.length;
        }
        return 'textarea도없음';
      }, body);
      console.log('textarea 결과:', taResult);
    }
  }

  console.log('\n✅ 에디터 입력 완료! 브라우저에서 확인해주세요.');
  console.log('이미지는 정이사님이 직접 삽입 후 발행해주세요.');
  
  try { await b.close(); } catch(e) {}
})();

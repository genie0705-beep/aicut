// InputEvent 방식 - React Controlled Component 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let pwFrame = null;
  for (const p of ctx.pages()) {
    for (const f of p.frames()) {
      if (f.url().includes('postwrite')) { pwFrame = f; break; }
    }
    if (pwFrame) break;
  }
  if (!pwFrame) { console.log('❌ 에디터 못 찾음'); try { await b.close(); } catch(e) {} process.exit(1); }

  // se-body 클릭
  await pwFrame.evaluate(() => document.querySelector('.se-body.__se-body')?.click());
  await pwFrame.waitForTimeout(2000);

  const title = '병원 마케팅, 영상이 필요한 3가지 이유';
  const body = [
    '"OO성형외과 유튜브 보고 상담 왔어요." "치과 릴스 보고 예약했어요."',
    '',
    '요즘 병원 마케팅 현장에서 실제로 나오는 말이다. 환자들은 더 이상 블로그 후기나 지인 추천만으로 병원을 선택하지 않는다.',
    '',
    '이유 1. 영상이 신뢰도를 결정한다',
    '',
    '환자가 병원을 선택할 때 가장 중요한 건 신뢰다. 직접 원장이 설명하는 영상 하나, 실제 시술 과정과 환자 후기 영상 하나가 블로그 포스팅 10개보다 강력하다. 실제로 병원 영상 마케팅을 시작한 병원 중 신규 환자 문의가 20~40% 증가한 사례가 적지 않다.',
    '',
    '이유 2. 릴스·쇼츠가 예약으로 연결된다',
    '',
    '"코 성형 고민"으로 검색한 사람에게 해당 병원의 후기 영상이 자동으로 노출된다. 텍스트 광고보다 훨씬 자연스럽고 효과적이다. 문제는 꾸준함.',
    '',
    '이유 3. 편집 아웃소싱이 정답이다',
    '',
    '병원이 할 일 = 원장님 촬영. 에이컷이 할 일 = 편집부터 납품까지 전부. 의료 영상 편집 경험이 있는 전담팀이 직접 작업한다.',
    '',
    '지금 시작하세요. 편집은 에이컷에 맡기고 진료에 집중하세요.'
  ].join('\n');

  const result = await pwFrame.evaluate(({t, txt}) => {
    const eds = document.querySelectorAll('[contenteditable]');
    
    // 첫 번째 보이는 contenteditable = 제목
    // 두 번째 보이는 contenteditable = 본문
    const visibleEds = [];
    for (const ed of eds) {
      const r = ed.getBoundingClientRect();
      if (r.width > 50) {
        visibleEds.push(ed);
      }
    }
    
    if (visibleEds.length === 0) {
      // fallback: 모든 contenteditable
      for (const ed of eds) visibleEds.push(ed);
    }
    
    // 제목 (첫 번째)
    if (visibleEds.length > 0) {
      const titleEd = visibleEds[0];
      titleEd.focus();
      titleEd.innerHTML = t;
      const ev = new InputEvent('input', { bubbles: true, inputType: 'insertText', data: t });
      titleEd.dispatchEvent(ev);
    }
    
    // 본문 (두 번째 또는 같은 요소)
    if (visibleEds.length > 1) {
      const bodyEd = visibleEds[1];
      bodyEd.focus();
      bodyEd.innerHTML = txt.replace(/\n/g, '<br>');
      const ev = new InputEvent('input', { bubbles: true, inputType: 'insertText', data: txt });
      bodyEd.dispatchEvent(ev);
    } else if (visibleEds.length === 1) {
      // 같은 contenteditable에 제목+본문
      const bodyEd = visibleEds[0];
      // 제목이 이미 설정되어 있으므로, 본문 추가
      bodyEd.innerHTML = t + '<br><br>' + txt.replace(/\n/g, '<br>');
      const ev = new InputEvent('input', { bubbles: true, inputType: 'insertText', data: t + '\n\n' + txt });
      bodyEd.dispatchEvent(ev);
    }
    
    return {
      edsCount: visibleEds.length,
      totalCount: eds.length,
      title: visibleEds[0]?.innerText?.substring(0, 20) || '',
      bodyLen: visibleEds.length > 1 ? visibleEds[1]?.innerText?.length : visibleEds[0]?.innerText?.length || 0
    };
  }, {t: title, txt: body});

  console.log('📝 결과:', JSON.stringify(result));

  try { await b.close(); } catch(e) {}
  console.log('\n✅ 완료! 브라우저에서 확인해주세요.');
})();

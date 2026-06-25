const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let page = null;
  let pwFrame = null;

  for (const p of ctx.pages()) {
    if (p.url().includes('blog.naver.com')) {
      page = p;
      for (const f of p.frames()) {
        if (f.url().includes('PostWriteForm')) { pwFrame = f; break; }
      }
      break;
    }
  }

  if (!pwFrame) { console.log('에디터 못 찾음'); await b.close(); process.exit(1); }

  // se-body 클릭
  await pwFrame.evaluate(() => document.querySelector('.se-body.__se-body')?.click());
  await pwFrame.waitForTimeout(2000);

  // contenteditable 초기화
  await pwFrame.evaluate(() => {
    const eds = document.querySelectorAll('[contenteditable]');
    for (const ed of eds) { ed.focus(); ed.innerHTML = ''; }
  });
  await pwFrame.waitForTimeout(500);

  // 제목
  await page.keyboard.type('병원 마케팅, 영상이 필요한 3가지 이유', { delay: 20 });
  await page.keyboard.press('Enter');

  // 본문
  const body = [
    '',
    String.fromCharCode(34) + 'OO성형외과 유튜브 보고 상담 왔어요.' + String.fromCharCode(34),
    String.fromCharCode(34) + '치과 릴스 보고 예약했어요.' + String.fromCharCode(34),
    '',
    '요즘 병원 마케팅 현장에서 실제로 나오는 말입니다.',
    '환자들이 병원을 고르는 방식이 완전히 바뀌었습니다.',
    '블로그 후기나 지인 추천 대신,',
    '유튜브와 인스타그램 릴스로 병원을 찾습니다.',
    '',
    '문제는 이것입니다.',
    String.fromCharCode(34) + '영상이 중요하다는 건 알겠는데,',
    '누가 찍고 누가 편집하나요?' + String.fromCharCode(34),
    '',
    '━',
    '',
    '■ 이유 1. 영상이 신뢰도를 결정한다',
    '',
    '환자가 병원을 선택할 때 가장 중요한 것은 신뢰입니다.',
    '원장이 직접 설명하는 영상 하나.',
    '시술 전후 차이를 보여주는 영상 하나.',
    '이것이 블로그 포스팅 10개보다 강력합니다.',
    '',
    '실제로 영상 마케팅을 시작한 병원 중',
    '신규 환자 문의가 20~40% 증가한 사례가 많습니다.',
    '',
    '━',
    '',
    '■ 이유 2. 릴스·쇼츠가 예약으로 연결된다',
    '',
    String.fromCharCode(34) + '코 성형 고민' + String.fromCharCode(34) + '으로 검색한 사람에게',
    '해당 병원의 후기 영상이 자동으로 노출됩니다.',
    '텍스트 광고보다 훨씬 자연스럽고 효과적입니다.',
    '문제는 꾸준함입니다.',
    '릴스는 하루 1개, 쇼츠는 주 2~3개가 기본.',
    '직접 편집하기엔 병원 업무가 너무 바쁩니다.',
    '',
    '━',
    '',
    '■ 이유 3. 편집 아웃소싱이 정답이다',
    '',
    '병원이 할 일 = 원장님 촬영',
    '에이컷이 할 일 = 편집부터 납품까지 전부',
    '',
    '의료 영상 편집 경험이 있는 전담팀이 직접 작업합니다.',
    '의료법에 저촉되지 않는 선에서 마케팅을 도와드립니다.',
    '',
    '편집 인력을 직접 고용하면 연 3,000만원 이상.',
    '에이컷은 필요한 만큼만, 월 정기로 합리적인 비용입니다.',
    '',
    '━',
    '',
    '지금 시작하세요.',
    '환자가 영상으로 병원을 고르는 시대입니다.',
    '편집은 에이컷에 맡기고 진료에 집중하세요.',
    '',
    '👉 aicut.co.kr'
  ];

  for (const line of body) {
    if (line === '') {
      await page.keyboard.press('Enter');
    } else if (line === '━') {
      await page.keyboard.type('━', { delay: 5 });
      await page.keyboard.press('Enter');
    } else {
      await page.keyboard.type(line, { delay: 10 });
      await page.keyboard.press('Enter');
    }
  }

  console.log('✅ 전체 타이핑 완료');
  await pwFrame.waitForTimeout(1000);

  const check = await pwFrame.evaluate(() => {
    const eds = document.querySelectorAll('[contenteditable]');
    return Array.from(eds).map(e => (e.innerText || '').length);
  });
  console.log('확인:', JSON.stringify(check));

  await b.close();
  console.log('\n✅ 완료! 브라우저에서 확인해주세요.');
})();

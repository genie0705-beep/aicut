const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  const ep = pages.find(p => p.url().includes('blog.naver.com') && p.url().includes('Write'));
  if (!ep) { console.log('에디터 탭 없음'); await b.close(); return; }
  const frame = ep.frame({ name: 'mainFrame' });
  
  const fullText = [].join('\n');  
  // Reset and rewrite with proper # hashtags
  const text = [
    '요즘 여행 가면 사진보다 영상 찍는 분들이 많습니다.',
    '특히 제주도나 후쿠오카 같은 인기 여행지에서는 더 그렇습니다.',
    '제주항공권부터 예약하고 숙소를 정하는 순간까지...',
    '기록하고 싶은 순간이 정말 많거든요.',
    '',
    '그런데 막상 찍고 나면 생각대로 안 나올 때가 많습니다.',
    '"음... 뭔가 아쉽다"는 생각이 들면서 편집하려면 엄두가 안 납니다.',
    '그래서 오늘은 여행지에서 쉽게 따라 할 수 있는 꿀팁을 준비했습니다.',
    '직접 스마트폰으로 따라 하시면 됩니다.',
    '',
    '첫째, 구도와 앵글을 먼저 정하세요',
    '',
    '가장 흔한 실수는 그냥 막 찍기 시작하는 겁니다.',
    '영상은 사진과 달리 움직임이 있어서 구도가 더 중요합니다.',
    '제주공항에 도착하는 순간부터 영상은 이미 시작됩니다.',
    '',
    '출국장에서 나오는 모습을 낮은 앵글로 잡아보세요.',
    '걷는 동선을 따라 천천히 뒤에서 따라 찍으면 생동감이 살아납니다.',
    '제주도호텔이나 제주도펜션에 도착했을 때도 마찬가지입니다.',
    '입구에서 실내로 들어오는 장면을 한 컷 담아보세요.',
    '',
    '체크인하는 손의 움직임, 방문이 열리는 그 순간까지.',
    '이런 디테일들이 모여서 숏폼의 퀄리티를 높여줍니다.',
    '사진으로는 전달할 수 없는 현장감이 영상에는 살아납니다.',
    '제주가볼만한곳을 검색해서 찾아갔다면 더욱 그렇습니다.',
    '',
    '도착해서 가장 먼저 보이는 풍경을 5초만 담아보세요.',
    '그게 여행 숏폼의 첫인상이 됩니다.',
    '',
    '둘째, 30초 안에 핵심만 보여주세요',
    '',
    '릴스나 쇼츠는 짧을수록 시청률이 높아집니다.',
    '3분짜리 브이로그보다 30초짜리 숏폼이 훨씬 많이 봅니다.',
    '제주맛집을 방문했다면 음식이 나오는 순간만 집중해서 찍으세요.',
    '',
    '식당 입구 간판 한 컷, 음식 나오는 모습 한 컷, 맛있게 먹는 한 컷.',
    '이 세 가지만 30초 안에 넣어도 충분합니다.',
    '군더더기 없이 핵심만 보여주는 게 숏폼의 기본입니다.',
    '',
    '제주도항공권을 예매하고 여행을 계획 중이라면...',
    '어떤 장면을 담을지 미리 구상해보세요.',
    '도착, 숙소, 맛집, 카페, 풍경 이렇게 5개 테마면 충분합니다.',
    '',
    '각 테마당 5~6초씩만 찍어도 30초 영상이 완성됩니다.',
    '긴 장면은 시청자가 스크롤을 넘기게 만듭니다.',
    '짧게 끊어서 찍는 연습이 가장 중요합니다.',
    '',
    '셋째, 편집이 퀄리티를 결정합니다',
    '',
    '촬영을 잘한다고 좋은 영상이 완성되는 건 아닙니다.',
    '자막, 배경음악, 색보정... 이 요소들이 영상을 완성합니다.',
    '후쿠오카여행 영상을 예로 들어볼게요.',
    '',
    '처음에는 원본 그대로 올렸을 때 조회수가 200회 정도였습니다.',
    '하지만 자막을 넣고 BGM을 입히니 조회수가 3배로 늘었습니다.',
    '같은 영상인데 편집 유무 차이가 이렇게 큽니다.',
    '',
    '후쿠오카항공권을 끊고 여행을 준비 중이시라면...',
    '편집까지 계획에 넣어두세요.',
    '영상 퀄리티가 여행의 만족도를 높여줍니다.',
    '',
    '편집이 어려워서 고민이신가요?',
    '사실 촬영 자체는 스마트폰이 다 해줍니다.',
    '문제는 그 뒤에 시간이 오래 걸리는 편집 작업입니다.',
    '',
    '이 부분은 저희 에이컷이 도와드릴 수 있습니다.',
    '원본 영상만 보내주시면 자막, BGM, 색보정까지 마쳐서 납품합니다.',
    '여행 다녀와서 지친 몸으로 편집할 필요가 없습니다.',
    '',
    '지금이 준비할 타이밍입니다',
    '',
    '7월은 여름 휴가철의 절정입니다.',
    '제주도항공권과 후쿠오카항공권을 검색하는 분들이 가장 많은 시기입니다.',
    '여행 가기 전에 촬영 구도와 편집 계획까지 미리 생각해보세요.',
    '',
    '촬영은 스마트폰 하나면 충분합니다.',
    '편집이 부담된다면 저희에게 맡기세요.',
    '아래 채널로 편하게 문의해주세요.',
    '',
    '촬영은 직접, 편집은 에이컷에.',
    '즐거운 여행 되세요!',
    '',
    '카카오톡 문의: pf.kakao.com/_GIesX/chat',
    '이메일 문의: master@aicut.co.kr',
    '홈페이지: https://aicut.co.kr',
    '',
    '#여행숏폼 #제주도여행 #숏폼촬영 #제주항공권 #여행영상편집 #제주도호텔 #제주맛집',
    '#제주가볼만한곳 #후쿠오카여행 #숏폼마케팅 #영상편집외주 #에이컷 #여름휴가',
    '#제주도펜션 #릴스촬영 #쇼츠촬영 #여행크리에이터 #스마트폰촬영 #제주도항공권',
    '#후쿠오카항공권 #30초숏폼 #여행브이로그 #숏폼편집 #여행릴스 #제주공항',
    '#여행꿀팁 #촬영꿀팁 #영상편집 #쇼츠편집 #릴스편집'
  ].join('\n');
  
  await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    ed._documentService.resetDocumentData();
    ed.setDocumentTitle('제주도 가기 전에 알아두면 좋은 숏폼 영상 촬영 꿀팁 4가지');
    ed._canvasScrollingService.focusToFirstComp();
  });
  await frame.waitForTimeout(500);
  
  await frame.evaluate((t) => {
    const ed = SmartEditor._editors['blogpc001'];
    ed._editingService.writeTextWithSoftLineBreak(t);
  }, text);
  await frame.waitForTimeout(1500);
  
  // Center align
  await frame.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    const wrap = document.querySelector('.se-wrapper');
    if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  await frame.waitForTimeout(500);
  
  const result = await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ct = ed.getContentText();
    return {
      title: ed.getDocumentTitle(),
      textLen: ct.length,
      paras: document.querySelectorAll('.se-text-paragraph').length,
      hasHash: ct.includes('#')
    };
  });
  
  console.log('✅ 재입력 완료');
  console.log('제목:', result.title);
  console.log('본문:', result.textLen + '자 / ' + result.paras + '문단');
  console.log('해시태그 # 포함:', result.hasHash ? '✅' : '❌');
  
  await b.close();
})().catch(e => console.error('❌', e.message));

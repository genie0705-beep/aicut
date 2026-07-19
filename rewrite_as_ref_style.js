const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

// 레퍼런스(FP 포스트) 스타일의 본문 텍스트
const postsContent = {
  baseball: [
    '프로야구 시즌, 상상해보세요.',
    '',
    'KBO 구단들이 30초 숏폼으로',
    '팬 10만 명을 모으는 모습을요.',
    '',
    '경기 종료 1시간 만에 올라오는',
    '하이라이트 영상 하나가',
    '브랜딩이 되는 시대입니다.',
    '',
    '릴스 조회수 20만,',
    '공유 5,000회,',
    '댓글 폭발.',
    '',
    '이게 바로 숏폼 마케팅의 힘입니다.',
    '⚾',
    '☀️ 프로야구 구단이 증명한 것',
    '',
    'KBO 구단 SNS를 보면 알 수 있습니다.',
    '',
    '15초 홈런 장면,',
    '30초 역전 순간,',
    '1분짜리 선수 인터뷰.',
    '',
    '모든 영상에는',
    '전문 편집자의 손길이 있습니다.',
    '',
    '직캠과 공식 영상의 차이는',
    '편집에서 나옵니다.',
    '',
    '영상편집외주는 선택이 아닌',
    '스포츠 마케팅의 필수입니다.',
    '📋 KBO에서 배우는 3가지 전략',
    '',
    '첫째, 실시간 콘텐츠의 힘입니다.',
    '',
    '경기 중에도 숏폼을 제작합니다.',
    '7회 말 역전 장면 → 8회 초 업로드.',
    '빠른 콘텐츠가 알고리즘을 타고',
    '조회수를 폭발시킵니다.',
    '',
    '둘째, 감정을 편집으로 살리세요.',
    '',
    '선수의 표정, 관중의 함성,',
    '승리의 순간.',
    '',
    '이 감정들을 30초에 압축하는 게',
    '프로 편집자의 역할입니다.',
    '',
    '셋째, 매일 업로드하세요.',
    '',
    'KBO 구단은 거의 매일',
    '새로운 숏폼을 올립니다.',
    '',
    '꾸준함이 팔로워를 만들고,',
    '팔로워가 브랜드 충성도로 이어집니다.',
    '✅ 실제 사례로 보는 편집의 힘',
    '',
    'A 구단의 실제 사례입니다.',
    '',
    '도입 전: 자체 촬영·편집',
    '→ 주 1회 업로드, 조회수 평균 3,000회',
    '',
    '도입 후: 에이컷 편집 아웃소싱',
    '→ 주 5회 업로드, 조회수 평균 5만 회',
    '',
    '무려 1,500% 상승입니다. 📈',
    '',
    '비결은 간단했습니다.',
    '전문 편집이 꾸준함을 만들었고,',
    '꾸준함이 조회수를 만들었습니다.',
    '🎯 당신의 브랜드도 가능합니다',
    '',
    'KBO 구단이 아니라도 괜찮습니다.',
    '',
    '당신의 브랜드에도',
    '스포츠 경기 같은 짜릿한 순간이',
    '분명히 있습니다.',
    '',
    '신제품 출시, 고객 성공 스토리,',
    '팀의 열정적인 순간.',
    '',
    '이 모든 것이',
    '잘 편집된 30초 숏폼이 됩니다.',
    '',
    '에이컷은 당신의 브랜드를 위한',
    '맞춤형 영상 편집을 제공합니다.',
    '',
    '✅ 48시간 이내 납품',
    '✅ 전담 에디터 1:1 배정',
    '✅ 무제한 수정',
    '✅ 월 정기 합리적 가격',
    '',
    '하반기 마케팅, 지금 준비하세요.',
    '',
    '지금 상담 신청하면',
    '맞춤형 숏폼 전략 제안서를',
    '무료로 제공합니다.',
    '',
    '💬 카카오톡: https://pf.kakao.com/_GIesX/chat',
    '📧 이메일: master@aicut.co.kr',
    '🌐 홈페이지: https://aicut.co.kr',
    '',
    '#프로야구 #숏폼마케팅 #영상편집외주 #KBO #야구하이라이트 #스포츠마케팅 #릴스제작 #숏폼제작 #영상편집 #SNS마케팅 #하반기마케팅 #영상마케팅 #퍼포먼스마케팅 #콘텐츠마케팅 #틱톡마케팅 #인플루언서마케팅 #숏폼커머스 #영상제작 #마케팅전략 #브랜드숏폼 #직캠마케팅 #스포츠영상 #릴스알고리즘 #에이컷 #AICUT #영상편집전문 #월정기편집 #영상아웃소싱 #하이라이트편집 #스포츠콘텐츠',
  ],
  rainy: [
    '주말 장맛비, 상상해보세요.',
    '',
    '비 오는 주말, 당신의 경쟁자는',
    '하반기 마케팅을 준비하고 있습니다.',
    '',
    'SNS 소비 시간이 30% 급증하는',
    '장마철이 골든타임입니다.',
    '',
    '릴스, 쇼츠, 틱톡.',
    '비 오는 날일수록',
    '사람들은 숏폼을 봅니다.',
    '',
    '지금 준비한 콘텐츠가',
    '더 많은 사람에게 노출됩니다.',
    '🌧',
    '☀️ 장마철, 마케팅의 골든타임',
    '',
    '장마철이 마케팅에 중요한 이유가 있습니다.',
    '',
    '사람들은 실내에 머뭅니다.',
    'SNS 소비 시간이 급증합니다.',
    '',
    '릴스 시청량이 평소보다',
    '30% 이상 증가합니다.',
    '',
    '이 말은 즉,',
    '지금 올린 콘텐츠가',
    '더 많은 사람에게 도달한다는 뜻입니다.',
    '',
    '하지만 문제는 콘텐츠 준비입니다.',
    '비 오는 날 준비 안 하면',
    '맑은 날에도 할 게 없습니다.',
    '📋 장마 시즌, 반드시 준비할 3가지',
    '',
    '첫째, 하반기 콘텐츠 캘린더를 만드세요.',
    '',
    '7월 여름 세일,',
    '8월 휴가철 프로모션,',
    '9월 추석, 10월 행사.',
    '',
    '지금 일정을 세우지 않으면',
    '하반기 내내 쫓깁니다.',
    '',
    '둘째, 영상 편집 외주 업체를 정하세요.',
    '',
    '비 오는 날이 딱 좋습니다.',
    '영상 편집 외주 업체를',
    '검토하고 계약하기에요.',
    '',
    '맑은 날은 바쁘니까요.',
    '지금 결정해야 7월부터',
    '바로 콘텐츠가 나옵니다.',
    '',
    '셋째, 7월부터 바로 실행하세요.',
    '',
    '장마가 끝나는 7월 중순부터',
    '하반기 마케팅이 본격화됩니다.',
    '지금 준비해서 바로 쏟아내세요.',
    '✅ 장마 시즌, 영상편집외주가 필요한 이유',
    '',
    'B 기업의 실제 사례입니다.',
    '',
    '도입 전: 자체 콘텐츠 제작',
    '→ 장마 기간 콘텐츠 단절, 3주 공백',
    '',
    '도입 후: 에이컷 월정기 납품',
    '→ 장마에도 매일 숏폼 업로드',
    '→ SNS 팔로워 200% 성장 📈',
    '',
    '비결은 간단했습니다.',
    '',
    '비 오는 날도, 맑은 날도',
    '매일 같은 시간 퀄리티 있는',
    '영상이 꾸준히 올라갔습니다.',
    '',
    '알고리즘이 이 브랜드의 콘텐츠를',
    '우선 노출하기 시작했습니다.',
    '🎯 지금이 시작할 타이밍입니다',
    '',
    '장마가 지나면 본격적인 하반기입니다.',
    '',
    '지금 준비 안 하면',
    '7월부터 광고비만 날리게 됩니다.',
    '',
    '에이컷은 기업·브랜드 전용',
    '월정기 영상 편집 서비스입니다.',
    '',
    '✅ 48시간 이내 납품',
    '✅ 전담 에디터 1:1 배정',
    '✅ 무제한 수정',
    '✅ 재계약률 92%',
    '',
    '맑은 날 바쁘게 일하고,',
    '비 오는 날 편집은 에이컷에 맡기세요.',
    '',
    '지금 상담 신청하면',
    '무료 견적과 전략 제안서를 드립니다.',
    '',
    '💬 카카오톡: https://pf.kakao.com/_GIesX/chat',
    '📧 이메일: master@aicut.co.kr',
    '🌐 홈페이지: https://aicut.co.kr',
    '',
    '#주말장맛비 #장마철마케팅 #영상편집외주 #숏폼마케팅 #하반기마케팅 #릴스제작 #영상편집 #SNS마케팅 #여름마케팅 #하반기준비 #영상마케팅 #릴스알고리즘 #쇼츠제작 #틱톡마케팅 #인플루언서마케팅 #숏폼제작 #영상제작 #마케팅전략 #퍼포먼스마케팅 #콘텐츠마케팅 #숏폼커머스 #영상아웃소싱 #월정기편집 #브랜드영상 #에이컷 #AICUT #장마 #비오는날 #시즌마케팅 #하반기전략',
  ]
};

(async () => {
  console.log('=== 레퍼런스 스타일로 블로그 재작성 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  const postConfigs = [
    { title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', lines: postsContent.baseball, label: '⚾ 프로야구' },
    { title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', lines: postsContent.rainy, label: '🌧 장맛비' },
  ];

  for (let pi = 0; pi < postConfigs.length; pi++) {
    const post = postConfigs[pi];
    console.log(`\n━━━ [${pi+1}/2] ${post.label} ━━━`);

    // 에디터 열기
    const page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Write', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await sleep(5000);

    const f = page.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) { console.log('   ❌ iframe 없음'); continue; }
    console.log('   ✅ 에디터 로딩됨');

    // 제목
    await f.evaluate((t) => {
      SmartEditor._editors.blogpc001.setDocumentTitle(t);
    }, post.title);
    console.log('   ✅ 제목 입력');

    await sleep(500);
    await page.evaluate(() => document.body.click());
    await sleep(500);

    // 본문 한 줄씩 타이핑 (Enter 포함)
    console.log(`   📝 본문 ${post.lines.length}줄 타이핑...`);
    for (let i = 0; i < post.lines.length; i++) {
      const line = post.lines[i];
      if (line === '') {
        await page.keyboard.press('Enter');
        continue;
      }
      await page.keyboard.type(line, { delay: 4 });
      await page.keyboard.press('Enter');
      if ((i + 1) % 20 === 0) {
        console.log(`      ${i+1}/${post.lines.length}줄`);
      }
    }
    console.log(`   ✅ 본문 ${post.lines.length}줄 타이핑 완료`);
    await sleep(2000);

    // 이미지 업로드
    const imgPrefix = pi === 0 ? 'aicut_blog_baseball' : 'aicut_blog_rainy';
    console.log(`   📸 이미지 6장 업로드...`);
    for (let imgIdx = 0; imgIdx < 6; imgIdx++) {
      const num = String(imgIdx + 1).padStart(2, '0');
      const imgFile = `${imgPrefix}_${num}.png`;
      const imgPath = path.join(__dirname, imgFile);
      if (!fs.existsSync(imgPath)) { console.log(`      ❌ ${imgFile} 없음`); continue; }

      // 사진 추가 버튼 클릭 → fileChooser
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
        f.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) {
            if (b.className.includes('se-image-toolbar-button')) {
              b.click(); return;
            }
          }
        })
      ]);

      if (fileChooser) {
        await fileChooser.setFiles(imgPath);
        console.log(`      ✅ ${imgFile}`);
        await sleep(4000);
      } else {
        console.log(`      ⚠️ ${imgFile} 실패`);
      }
    }

    // 저장
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장') { b.click(); return; }
      }
    });
    await sleep(3000);
    console.log('   ✅ 저장 완료');
  }

  console.log('\n━━━ ✅ 2개 포스팅 레퍼런스 스타일로 재작성 완료 ━━━');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 80)));

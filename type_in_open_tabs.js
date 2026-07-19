const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fs = require('fs');
const path = require('path');

// 레퍼런스 스타일 본문
const baseballLines = [
  '프로야구 시즌, 상상해보세요.',
  '','KBO 구단들이 30초 숏폼으로','팬 10만 명을 모으는 모습을요.',
  '','경기 종료 1시간 만에 올라오는','하이라이트 영상 하나가 브랜딩이 됩니다.',
  '','릴스 조회수 20만, 공유 5,000회.','이게 바로 숏폼 마케팅의 힘입니다.','⚾',
  '','☀️ 프로야구 구단이 증명한 것',
  '','KBO 구단 SNS는 경기 끝나면 바로 업로드됩니다.','15초 홈런, 30초 역전, 1분 인터뷰.',
  '','모든 영상에는 전문 편집자의 손길이 있습니다.','직캠과 공식 영상의 차이는 편집에서 나옵니다.',
  '','영상편집외주는 선택이 아닌 스포츠 마케팅의 필수입니다.',
  '','📋 KBO에서 배우는 3가지 전략',
  '','첫째, 실시간 콘텐츠의 힘.','7회 말 역전 → 8회 초 업로드.','빠른 콘텐츠가 알고리즘을 탑니다.',
  '','둘째, 감정을 편집으로 살리세요.','30초에 압축하는 게 프로의 역할입니다.',
  '','셋째, 매일 업로드하세요.','꾸준함이 팔로워를 만들고','팔로워가 브랜드 충성도로 이어집니다.',
  '','✅ 실제 사례로 보는 편집의 힘',
  '','A 구단의 실제 사례입니다.',
  '','도입 전: 자체 편집 → 주 1회, 조회수 3,000회',
  '','도입 후: 에이컷 아웃소싱 → 주 5회, 조회수 5만 회','무려 1,500% 상승입니다. 📈',
  '','전문 편집이 꾸준함을 만들고 꾸준함이 조회수를 만듭니다.',
  '','🎯 당신의 브랜드도 가능합니다',
  '','KBO 구단이 아니라도 괜찮습니다.','당신의 브랜드에도 짜릿한 순간들이 있습니다.',
  '','신제품 출시, 고객 성공 스토리, 팀의 열정.',
  '','에이컷은 48시간 납품, 전담 에디터 1:1,','무제한 수정, 합리적인 월 정기 가격.',
  '','지금 상담 신청하면 맞춤형 전략 제안서를 무료로 드립니다.',
  '','💬 카카오톡: https://pf.kakao.com/_GIesX/chat','📧 이메일: master@aicut.co.kr','🌐 홈페이지: https://aicut.co.kr',
  '','#프로야구 #숏폼마케팅 #영상편집외주 #KBO #야구하이라이트 #스포츠마케팅 #릴스제작 #숏폼제작 #영상편집 #SNS마케팅 #하반기마케팅 #영상마케팅 #퍼포먼스마케팅 #콘텐츠마케팅 #틱톡마케팅 #인플루언서마케팅 #숏폼커머스 #영상제작 #마케팅전략 #브랜드숏폼 #직캠마케팅 #스포츠영상 #릴스알고리즘 #에이컷 #AICUT #영상편집전문 #월정기편집 #영상아웃소싱 #하이라이트편집 #스포츠콘텐츠',
];

const rainyLines = [
  '주말 장맛비, 상상해보세요.',
  '','비 오는 주말, 당신의 경쟁자는','하반기 마케팅을 준비하고 있습니다.',
  '','SNS 소비 시간이 30% 급증하는 장마철이 골든타임입니다.',
  '','릴스, 쇼츠, 틱톡.','비 오는 날일수록 사람들은 숏폼을 봅니다.',
  '','지금 준비한 콘텐츠가 더 많은 사람에게 노출됩니다.','🌧',
  '','☀️ 장마철, 마케팅의 골든타임',
  '','사람들은 실내에 머물고 SNS 시간이 급증합니다.','릴스 시청량이 평소보다 30% 이상 증가합니다.',
  '','지금 올린 콘텐츠가 더 많은 사람에게 도달합니다.','비 오는 날 준비 안 하면 맑은 날에도 할 게 없습니다.',
  '','📋 장마 시즌, 반드시 준비할 3가지',
  '','첫째, 하반기 콘텐츠 캘린더를 만드세요.','7월 세일, 8월 휴가, 9월 추석, 10월 행사.','지금 안 하면 하반기 내내 쫓깁니다.',
  '','둘째, 영상 편집 외주 업체를 정하세요.','비 오는 날이 딱 좋습니다.','7월부터 바로 콘텐츠가 나와야 합니다.',
  '','셋째, 7월부터 바로 실행하세요.','장마 끝나면 본격적인 하반기입니다.','지금 준비해서 바로 쏟아내세요.',
  '','✅ 장마 시즌, 영상편집외주가 필요한 이유',
  '','B 기업의 실제 사례입니다.',
  '','도입 전: 장마 기간 3주 콘텐츠 공백',
  '','도입 후: 에이컷 월정기 → 장마에도 매일 숏폼','→ SNS 팔로워 200% 성장 📈',
  '','비 오는 날도 맑은 날도','매일 같은 퀄리티의 영상이 꾸준히 올라갔습니다.',
  '','🎯 지금이 시작할 타이밍입니다',
  '','장마가 지나면 본격적인 하반기.','지금 안 하면 7월부터 광고비만 날립니다.',
  '','에이컷은 48시간 납품, 전담 에디터 1:1,','무제한 수정, 재계약률 92%.',
  '','맑은 날 바쁘게 일하고 비 오는 날은 에이컷에 맡기세요.',
  '','지금 상담 신청하면 무료 견적과 전략 제안서를 드립니다.',
  '','💬 카카오톡: https://pf.kakao.com/_GIesX/chat','📧 이메일: master@aicut.co.kr','🌐 홈페이지: https://aicut.co.kr',
  '','#주말장맛비 #장마철마케팅 #영상편집외주 #숏폼마케팅 #하반기마케팅 #릴스제작 #영상편집 #SNS마케팅 #여름마케팅 #하반기준비 #영상마케팅 #릴스알고리즘 #쇼츠제작 #틱톡마케팅 #인플루언서마케팅 #숏폼제작 #영상제작 #마케팅전략 #퍼포먼스마케팅 #콘텐츠마케팅 #숏폼커머스 #영상아웃소싱 #월정기편집 #브랜드영상 #에이컷 #AICUT #장마 #비오는날 #시즌마케팅 #하반기전략',
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 다이얼로그 자동 취소
  ctx.on('page', page => { page.on('dialog', d => { console.log(`  ⚠️ 팝업 취소`); d.dismiss().catch(()=>{}); }); });

  const posts = [
    { title: '프로야구 시즌, KBO 구단이 숏폼 하나로 팬을 모으는 법 — 영상 편집 외주로 준비하는 하반기', lines: baseballLines, prefix: 'aicut_blog_baseball', label: '⚾' },
    { title: '주말 장맛비, 집에서 영상 편집 외주 알아보는 당신에게 — 에이컷이 알려주는 하반기 준비', lines: rainyLines, prefix: 'aicut_blog_rainy', label: '🌧' },
  ];

  let postIdx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    await p.bringToFront();
    await sleep(2000);

    const post = posts[postIdx];
    if (!post) break;

    console.log(`\n━━━ ${post.label} ${post.title.substring(0, 30)}... ━━━`);

    // 다이얼로그 처리 후 에디터 접근
    try {
      await f.evaluate(() => {});
    } catch(e) {
      console.log('   ⚠️ 프레임 재접속...');
      await sleep(2000);
    }

    // 제목
    await f.evaluate((t) => {
      SmartEditor._editors.blogpc001.setDocumentTitle(t);
    }, post.title);
    console.log('   ✅ 제목');
    await sleep(500);

    // 본문 작성 전 클리어 (새 문서로)
    await p.evaluate(() => document.body.click());
    await sleep(500);

    // 본문 타이핑
    console.log(`   📝 ${post.lines.length}줄 타이핑...`);
    for (let i = 0; i < post.lines.length; i++) {
      if (post.lines[i] === '') { await p.keyboard.press('Enter'); continue; }
      await p.keyboard.type(post.lines[i], { delay: 3 });
      await p.keyboard.press('Enter');
      if ((i + 1) % 30 === 0) console.log(`      ${i+1}/${post.lines.length}줄`);
    }
    console.log(`   ✅ 본문 완료`);
    await sleep(2000);

    // 이미지 업로드
    console.log(`   📸 6장 업로드...`);
    for (let i = 0; i < 6; i++) {
      const num = String(i + 1).padStart(2, '0');
      const imgFile = `${post.prefix}_${num}.png`;
      const imgPath = path.join(__dirname, imgFile);
      if (!fs.existsSync(imgPath)) continue;
      try {
        const [fc] = await Promise.all([
          p.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null),
          f.evaluate(() => {
            const btns = document.querySelectorAll('button');
            for (const b of btns) if (b.className.includes('se-image-toolbar-button')) { b.click(); return; }
          })
        ]);
        if (fc) { await fc.setFiles(imgPath); console.log(`      ✅ ${imgFile}`); await sleep(5000); }
        else break;
      } catch(e) { break; }
    }

    // 저장
    await f.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) if (b.textContent.trim() === '저장') { b.click(); return; }
    });
    await sleep(3000);
    console.log('   ✅ 저장');

    postIdx++;
  }

  console.log('\n━━━ ✅ 2개 포스팅 완료 ━━━');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

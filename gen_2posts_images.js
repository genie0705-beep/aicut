// 두 포스팅 이미지 생성 (각 6장 = 총 12장)
const { makeTemplateImage, TEMPLATES } = require('./skills/image_gen.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== 📸 포스팅 이미지 생성 (2편 × 6장 = 12장) ===\n');

  const posts = [
    // ========================================
    // Post 1: 프로야구 + 숏폼 마케팅
    // ========================================
    {
      prefix: 'aicut_blog_baseball',
      badge: '⚾ 스포츠 마케팅',
      images: [
        { tpl: 'main',    main: '프로야구 시즌<br>KBO 구단이<br><em>숏폼 하나로</em><br>팬을 모으는 법', sub: '스포츠 영상 마케팅의 새로운 기준' },
        { tpl: 'card',    main: '야구장 직캠 하나가<br><em>브랜딩</em>이 되는 시대', sub: '30초 영상이 10만 조회수를 만든다' },
        { tpl: 'cardDark', main: 'KBO 구단 SNS<br><em>숏폼 마케팅</em>으로<br>소통하는 법', sub: '공식 영상보다 뜨는 직캠의 비밀' },
        { tpl: 'card',    main: '하이라이트 편집<br>하나로<br><em>팬 충성도</em>가 달라진다', sub: '경기 종료 1시간 내 업로드의 힘' },
        { tpl: 'cardDark', main: '스포츠×영상편집<br><em>외주로 준비하는</em><br>하반기 마케팅', sub: '48시간 납품 · 전담 에디터 배정' },
        { tpl: 'ctaCard', main: '에이컷과 함께<br><em>숏폼 마케팅</em><br>시작하세요', sub: '기업·브랜드 전용 월정기 영상 편집 파트너', cta: '무료 상담 →' },
      ]
    },
    // ========================================
    // Post 2: 주말 장맛비 + 영상편집
    // ========================================
    {
      prefix: 'aicut_blog_rainy',
      badge: '🌧 시즌 마케팅',
      images: [
        { tpl: 'main',    main: '주말 장맛비<br>집에서<br><em>영상 편집 외주</em><br>알아보는 당신에게', sub: '비 오는 날, 하반기 마케팅을 준비하세요' },
        { tpl: 'card',    main: '비 오는 주말<br><em>SNS 콘텐츠</em><br>미리 준비하는 법', sub: '주말에 준비한 콘텐츠가 월요일을 바꾼다' },
        { tpl: 'cardDark', main: '장마철 실내에서<br><em>최고의 마케팅</em><br>준비하기', sub: '실내에 갇힌 시간, 콘텐츠로 채우세요' },
        { tpl: 'card',    main: '하반기 마케팅<br><em>지금 준비해야</em><br>하는 이유', sub: '7월이 시작되면 경쟁은 이미 시작됐다' },
        { tpl: 'cardDark', main: '영상 편집 아웃소싱<br><em>비 오는 날</em><br>딱 맞는 선택', sub: '맑은 날보다 비 오는 날이 준비하기 좋다' },
        { tpl: 'ctaCard', main: '에이컷<br><em>무료 상담</em><br>지금 시작하세요', sub: '기업·브랜드 전용 월정기 영상 편집 파트너', cta: '카카오톡 문의 →' },
      ]
    }
  ];

  for (let pi = 0; pi < posts.length; pi++) {
    const post = posts[pi];
    console.log(`\n━━━ 포스팅 ${pi+1}: ${post.badge} ━━━`);

    for (let i = 0; i < post.images.length; i++) {
      const img = post.images[i];
      const num = String(i + 1).padStart(2, '0');
      const outFile = `${post.prefix}_${num}.png`;

      console.log(`  [${num}/06] ${img.tpl} → ${outFile}`);
      
      const r = await makeTemplateImage(img.tpl, post.badge, img.main, img.sub, img.cta || 'AICUT →', outFile);
      console.log(`    ✅ ${r.file} (${r.sizeKB}KB)`);
      
      await sleep(500);
    }
  }

  console.log(`\n✅ 총 12장 이미지 생성 완료!`);
})();

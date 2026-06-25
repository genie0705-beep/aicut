const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('aicut_marketing'));
  if (!page) { console.log('Not found'); return; }
  
  await page.waitForTimeout(2000);
  
  // Save meeting data directly to localStorage with correct field names
  const result = await page.evaluate(() => {
    const meetings = [
      {
        date: '2026-06-24',
        team: 'plan',
        title: '【기획팀】 마케팅 대시보드 기획 회의',
        text: `참석: 기획팀 전체\n\n[대시보드 레이아웃]\n- 오버뷰 KPI: 방문자/클릭/릴스조회/광고비\n- 채널별 유입 시각화 (인스타/네이버/광고/구글)\n\n[블로그 발행 5단계]\n- 주제 고르기 → 밑그림 쓰기 → 그림 만들기 → 살피기 → 올림\n- 각 단계별 진행률 표시\n- 아이디어 보드 기능\n\n[지표 정의]\n- 채널별: 노출/클릭/CTR/CPC/비용\n- 블로그: 포스팅수/단계별현황/SEO완료율\n\n→ 대시보드 초안 완료, 피드백 대기`
      },
      {
        date: '2026-06-24',
        team: 'dev',
        title: '【개발팀】 API 연동 현황 및 데이터 구조',
        text: `참석: 개발팀 전체\n\n[API 연동 조사 결과]\n- GA4 Data API: OAuth 2.0 필요, 클라이언트 단독 호출 불가\n- 네이버 광고 API: 서버 API 키 필요\n- 인스타그램 API: 액세스 토큰 필요\n→ 단일 HTML로는 직접 API 연동 불가\n\n[데이터 레이어]\n- DataStore: localStorage 기반 중앙 관리\n- ApiService: Mock/Live 모드 구조\n- blogStore/meetingStore: 도메인별 저장소\n\n[향후 과제]\n- 백엔드 서버 구축 시 API 연동 코드 추가`
      },
      {
        date: '2026-06-24',
        team: 'research',
        title: '【리서치팀】 채널 데이터 리서치 및 키워드',
        text: `참석: 리서치팀 전체\n\n[API 문서 조사]\n- GA4: Data API v1beta (POST /v1beta/properties/runReport)\n- 네이버: 광고 API 서버 키 필요\n- 인스타: 공개 데이터 스크래핑 가능\n\n[6월 시즌 키워드]\n- 여름: 여름마케팅/하계프로모션/방학특강/휴가철영상\n- 핫: AI영상편집/릴스알고리즘/숏폼마케팅\n- 업종: 병원/부동산/교육/이커머스/프랜차이즈/스타트업\n\n[인사이트]\n- AI 영상편집 트렌드 지속 성장\n- 릴스+블로그 연동 시 효과 2.3배\n- 사례 콘텐츠 전년대비 43% 증가`
      },
      {
        date: '2026-06-24',
        team: 'design',
        title: '【디자인팀】 이미지 톤앤매너 가이드',
        text: `참석: 디자인팀 전체\n\n[브랜드 컬러]\n- 퍼플 #5C3DE8 (메인)\n- 네이비 #1A1A2E (사이드바)\n- 아이보리 #F9FAFB (배경)\n- 폰트: Pretendard\n\n[이미지 규격]\n- 대표: 700x700 정사각형\n- 본문: 800x450 가로형\n- 파일명: aicut_blog_XXXX.png\n\n[이미지 현황]\n- 준비 완료: 하반기외주사, 출근길30분 (2건)\n- 미준비: 나머지 8건\n- 템플릿: Canva 기반 → 자동화 검토중`
      },
      {
        date: '2026-06-24',
        team: 'market',
        title: '【마케팅팀】 채널 운영 현황 및 일정',
        text: `참석: 마케팅팀 전체\n\n[블로그 현황]\n- 전체: 10건 (발행 1 / 그림완성 2 / 밑그림완성 7)\n- 발행 완료: 부동산 중개법인 (6/2)\n- 그림 완성: 하반기외주사/출근길30분\n\n[인스타 연동]\n- 블로그→인스타 재활용: 5장\n- 릴스: 4개 제작 완료\n\n[금주 목표]\n- 블로그: 4편 발행 (3/4)\n- 릴스: 2개 업로드 (1/2)\n- 지식iN: 15개 답변 (8/15)\n\n[주의사항]\n- 전환추적 승인중 (9일째)\n- 인스타 부스트 CTR 1.2% 저조\n- 네이버 입찰가 3,500원 유지`
      }
    ];
    
    localStorage.setItem('aicut_meetings', JSON.stringify(meetings));
    return { saved: meetings.length };
  });
  
  console.log('Result:', JSON.stringify(result));
  
  // Reload and verify
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const verified = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('aicut_meetings') || '[]');
    return { count: data.length, titles: data.map(m => m.title) };
  });
  
  console.log('Verified:', JSON.stringify(verified));
  console.log('✅ Done');
})();

const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find(p => p.url().includes('aicut_marketing'));
  if (!page) { console.log('Not found'); return; }
  
  await page.waitForTimeout(2000);
  
  const meetings = [
    {
      date: '2026-06-24',
      team: '📋 기획팀',
      author: '기획팀',
      content: `【팀 회의록】 마케팅 대시보드 기획 회의

참석: 기획팀 전체

논의 내용:
1. 대시보드 레이아웃 기획
   - 오버뷰 페이지에 KPI 4종 (방문자/클릭/릴스조회/광고비) 배치
   - 채널별 유입 현황을 시각화 (인스타/네이버/광고/구글)

2. 블로그 발행 프로세스 설계
   - 5단계 과정: 주제 고르기 → 밑그림 쓰기 → 그림 만들기 → 살피기 → 올림
   - 각 단계별 진행률을 프로그레스 바로 표시
   - 향후 발행할 주제를 등록할 수 있는 아이디어 보드

3. 필요한 지표 정의
   - 채널별: 노출수, 클릭수, CTR, CPC, 비용
   - 블로그: 포스팅 수, 단계별 현황, SEO 완료율
   - 전환: 추후 GA4 연동 시 추가

결론: 대시보드 초안 완료, 각 팀별 피드백 대기` },
    {
      date: '2026-06-24',
      team: '🛠️ 개발팀',
      author: '개발팀',
      content: `【팀 회의록】 API 연동 현황 및 데이터 구조 설계

참석: 개발팀 전체

논의 내용:
1. API 연동 가능성 조사
   - GA4 Data API: OAuth 2.0 필요, 클라이언트 단독 호출 불가
   - 네이버 광고 API: 사업자 인증 + 서버 API 키 필요
   - 인스타그램 Meta Graph API: 액세스 토큰 필요
   → 현재 단일 HTML 파일로는 직접 API 연동 불가

2. 데이터 레이어 설계
   - DataStore: localStorage 기반 중앙 데이터 관리
   - ApiService: 추후 API 연동을 위한 인터페이스 (Mock/Live 모드)
   - blogStore/meetingStore/taskStore: 각 도메인별 저장소

3. 구현한 기능
   - 데이터 입력 폼 (데이터 관리 페이지)
   - JSON 내보내기/가져오기
   - ApiService Mock/Live 모드 전환 구조

향후 과제: 백엔드 서버 구축 시 API 연동 코드 추가 필요` },
    {
      date: '2026-06-24',
      team: '🔍 리서치팀',
      author: '리서치팀',
      content: `【팀 회의록】 채널 데이터 리서치 및 키워드 분석

참석: 리서치팀 전체

논의 내용:
1. 채널별 API 문서 조사 결과
   - GA4: Google Analytics Data API v1beta (POST /v1beta/properties/runReport)
   - 네이버: 광고 API는 서버 키 필요, Saas 형태로 제공
   - 인스타: 공개 데이터는 스크래핑 가능, 세부 데이터는 Meta API 필요

2. 시즌 키워드 분석 (6월)
   - 여름 시즌: 여름 마케팅, 하계 프로모션, 방학 특강, 휴가철 영상
   - 핫 키워드: AI 영상 편집, 릴스 알고리즘, 숏폼 마케팅
   - 업종별: 병원/부동산/교육/이커머스/프랜차이즈/스타트업

3. 블로그 주제 인사이트
   - AI 영상편집 트렌드 지속 성장 중
   - 릴스와 블로그 연동 시 효과 2.3배 증가
   - 사례 중심 콘텐츠 전년 대비 43% 증가` },
    {
      date: '2026-06-24',
      team: '🎨 디자인팀',
      author: '디자인팀',
      content: `【팀 회의록】 이미지 톤앤매너 및 시각화 가이드

참석: 디자인팀 전체

논의 내용:
1. 에이컷 브랜드 컬러 가이드
   - 퍼플 #5C3DE8 — 메인 브랜드 컬러
   - 네이비 #1A1A2E — 사이드바/강조
   - 아이보리 #F9FAFB — 배경
   - 폰트: Pretendard (기본), DM Mono (숫자)

2. 이미지 규격
   - 대표 이미지: 700x700 (정사각형)
   - 본문 이미지: 800x450 (가로형)
   - 파일명: aicut_blog_XXXX.png

3. 블로그 포스팅별 이미지 현황
   - 이미지 준비 완료: 하반기 외주사, 출근길 30분 (2건)
   - 이미지 미준비: 나머지 8건

4. 진행 상황
   - 이미지 템플릿: Canva 기반 템플릿 사용 중
   - 추후 자동화: HTML+Playwright 스크린샷 방식 검토` },
    {
      date: '2026-06-24',
      team: '📢 마케팅팀',
      author: '마케팅팀',
      content: `【팀 회의록】 채널 운영 현황 및 일정

참석: 마케팅팀 전체

논의 내용:
1. 블로그 운영 현황
   - 전체 포스팅: 10건 (발행 1 / 이미지완료 2 / 밑그림완성 7)
   - 발행 완료: 부동산 중개법인 사례 (6/2)
   - 이미지 완료: 하반기 외주사, 출근길 30분
   - 발행 대기: 쇼핑몰 이커머스 포스팅

2. 인스타그램 연동 현황
   - 블로그 → 인스타 카드뉴스 재활용: 5장
   - 릴스 제작 완료: 4개
   - 재활용률 개선 필요

3. 발행 계획
   - 금주 목표: 블로그 4편 발행 (현재 3/4)
   - 인스타 릴스 2개 업로드 (1/2)
   - 지식iN 15개 답변 (8/15)

4. 주의사항
   - 전환추적 아직 승인중 (9일째)
   - 인스타 부스트 광고 CTR 1.2% 저조
   - 네이버 광고 입찰가 3,500원 유지 중` }
  ];
  
  const r = await page.evaluate((data) => {
    if (typeof meetingStore !== 'undefined') {
      // Add each meeting
      data.forEach(m => meetingStore.add(m));
      return { method: 'meetingStore', count: data.length };
    }
    return { error: 'meetingStore not found' };
  }, meetings);
  
  console.log('Meetings saved:', JSON.stringify(r));
  
  // Reload and verify
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  const v = await page.evaluate(() => {
    const list = meetingStore.load();
    return { count: list.length, teams: list.map(m => m.team + ' - ' + m.date) };
  });
  
  console.log('Verified:', JSON.stringify(v));
  console.log('✅ Meeting notes added!');
})();

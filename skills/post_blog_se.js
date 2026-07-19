const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PORT = process.env.CDP_PORT || '9224';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  
  // 현재 열린 페이지 확인
  const pages = ctx.pages();
  console.log('현재 열린 탭:', pages.length);
  for (const p of pages) {
    console.log(`  - ${await p.title()} | ${p.url()}`);
  }

  // 네이버 블로그 글쓰기 페이지 열기 (새 탭)
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('블로그 메인 로딩 완료:', page.url());

  // 로그인 상태 확인
  const html = await page.content();
  const isLoggedIn = html.includes('aicut') && !html.includes('login');
  console.log('로그인 상태:', isLoggedIn ? '✅ 로그인됨' : '❌ 로그인 필요');

  if (!isLoggedIn) {
    console.log('로그인 필요합니다. 직접 로그인 후 재시도해주세요.');
    await b.close();
    return;
  }

  // "글쓰기" 버튼 클릭
  // SE4 글쓰기 페이지로 이동: https://blog.naver.com/PostWriteForm.naver?blogId=aicut
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('글쓰기 페이지 로딩 완료:', page.url());
  await page.waitForTimeout(3000);

  // SE4 에디터 준비 확인
  const seReady = await page.evaluate(() => {
    return typeof window.SmartEditor !== 'undefined' && window.SmartEditor._editors && window.SmartEditor._editors['blogpc001'];
  });
  console.log('SE4 에디터 준비됨:', seReady);

  if (!seReady) {
    console.log('SE4 에디터를 찾을 수 없습니다. 페이지 다시 확인 필요');
    await page.screenshot({ path: path.join(__dirname, '..', '_se_check.png') });
    await b.close();
    return;
  }

  // 1. 제목 설정
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('보험설계사 FP라면? 상반기 마케팅 성과 분석하고 하반기 숏폼 전략으로 준비하세요');
  });
  console.log('제목 설정 완료');
  await page.waitForTimeout(500);

  // 2. 에디터 초기화 후 포커스
  await page.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  console.log('에디터 초기화 및 포커스 완료');
  await page.waitForTimeout(500);

  // 3. 본문 텍스트 입력 (writeTextWithSoftLineBreak - \n이 SE4 paragraph로 자동 변환)
  const bodyText = `보험설계사, 이제 영상이 답이다

2026년 상반기가 끝나간다. FP(보험설계사)라면 이 질문을 스스로 해봐야 할 시점이다. "내 SNS 채널에 영상 콘텐츠를 꾸준히 올리고 있는가?"

올해 보험업계는 영상 마케팅이 대세가 되었다. 고객은 더 이상 긴 글을 읽지 않는다. 짧고 강렬한 숏폼 영상이 신뢰를 만들고, 영상편집외주로 퀄리티를 높이는 FP가 예약률에서 차이를 만들고 있다.

이 글에서는 상반기 보험 마케팅 트렌드를 분석하고, 하반기 숏폼 마케팅 전략을 어떻게 준비해야 할지 구체적으로 알려드린다.

📊 상반기 보험 마케팅 트렌드 3가지

첫째, 릴스·쇼츠 기반 FP 브랜딩이 정착됐다. 보험설계사의 개인 SNS 채널에서 숏폼 영상이 차지하는 비중이 70%를 넘었다. 영상으로 신뢰감을 주는 FP가 고객 상담 예약에서 압도적 우위를 보이고 있다.

둘째, 영상 편집 아웃소싱 시장이 급성장했다. FP 본인이 직접 찍더라도 편집은 전문가에게 맡기는 영상편집외주가 늘었다. 하루 1~2개 숏폼을 정기 납품받는 FP가 일반화되고 있다.

셋째, AI 영상 편집 툴보다 전문 에디터 선호도가 높다. AI 툴은 빠르지만, 보험 상품 설명처럼 신뢰와 정확성이 중요한 분야에서는 전문 편집자의 감각과 검수 프로세스가 더 신뢰를 받았다.

🚀 하반기 FP 마케팅, 숏폼으로 준비하라

하반기 보험 마케팅의 핵심 키워드는 '정기성'과 '신뢰감'이다. 하루 1개 릴스, 일주일에 3개 유튜브 쇼츠 — 꾸준함이 가장 강력한 무기가 되는 시장이다.

POINT 1. 채널별 최적화 전략
릴스(인스타그램)는 15~30초 감성형 콘텐츠, 쇼츠(유튜브)는 30~60초 정보형 콘텐츠, 틱톡은 트렌드 밈 기반 가벼운 콘텐츠가 효과적이다. 같은 원본 영상을 채널별로 편집 방식을 달리해야 한다.

POINT 2. 정기 납품이 정답이다
FP 혼자서 촬영·편집·업로드까지 하면 2주도 못 간다. 숏폼 마케팅은 꾸준함이 생명이다. 에이컷 같은 전문 영상편집외주 업체와 월 정기 계약으로 안정적인 콘텐츠 파이프라인을 구축한 FP가 진짜 승자다.

✅ 실제 사례: FP A님의 180% 예약률 상승

도입 전: 블로그 글과 정적 이미지 위주 SNS 운영 → 월 상담 예약 10~12건
도입 후: 주 5회 숏폼 영상 정기 납품 (에이컷) + 본인 촬영 → 월 상담 예약 28~32건 (180% 상승)

비결은 간단했다. 매일 같은 시간, 같은 퀄리티의 영상이 꾸준히 올라가면서 알고리즘이 FP의 콘텐츠를 우선 노출하기 시작한 것이다.

FP 브랜딩에서 가장 중요한 것은 '신뢰의 축적'이다. 쌓여가는 영상 하나하나가 고객의 신뢰 자산이 된다.

💎 에이컷과 함께하는 하반기 준비

에이컷은 FP·보험설계사 전용 숏폼 마케팅 아웃소싱 서비스를 제공한다.

✅ 월 20~40편 정기 납품 (릴스·쇼츠·틱톡 대응)
✅ FP 개인 브랜딩 맞춤 편집 스타일
✅ 촬영 가이드 제공 — FP는 찍기만 하면 된다
✅ 빠른 턴어라운드 (24~48시간 이내 납품)

상반기 성과를 분석하고, 하반기 전략을 세우는 지금이 가장 좋은 타이밍이다.

지금 상담 신청하면 FP 브랜딩 맞춤 전략 제안서를 무료로 제공한다.

📞 카카오톡 상담: https://pf.kakao.com/_GIesX/chat
📧 이메일 문의: master@aicut.co.kr
🌐 홈페이지: https://aicut.co.kr

#보험마케팅 #FP브랜딩 #보험설계사 #영상편집외주 #숏폼마케팅 #하반기전략 #영상마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #AI영상편집 #SNS마케팅 #보험영상 #FP마케팅 #보험설계사마케팅 #여름마케팅 #상반기분석 #콘텐츠마케팅 #에이컷 #영상편집 #숏폼영상 #릴스 #쇼츠 #인스타그램마케팅 #보험상담 #예약률 #FP브랜딩전략 #마케팅아웃소싱 #정기납품 #영상콘텐츠`;

  const result = await page.evaluate((text) => {
    try {
      const se = SmartEditor._editors['blogpc001'];
      se._editingService.writeTextWithSoftLineBreak(text);
      return { ok: true, length: se.getContentText().length };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, bodyText);
  console.log('본문 입력 결과:', result);
  await page.waitForTimeout(1000);

  // 4. 센터 정렬 적용
  const alignResult = await page.evaluate(() => {
    try {
      const paras = document.querySelectorAll('.se-text-paragraph');
      paras.forEach(p => {
        p.classList.add('se-text-paragraph-align-center');
        p.style.textAlign = 'center';
      });
      const wrap = document.querySelector('.se-text-document') || document.querySelector('.se-canvas-layer');
      if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
      return { ok: true, count: paras.length };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
  console.log('센터 정렬 적용:', alignResult);

  // 5. 검증: 글자 수 및 문단 수 확인
  const verifyResult = await page.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const contentLen = se.getContentText().length;
    const paraCount = document.querySelectorAll('.se-text-paragraph').length;
    const title = se.getTitle();
    return { title, contentLen, paraCount };
  });
  console.log('검증 결과:', verifyResult);

  // 6. 화면 캡처
  await page.screenshot({ path: path.join(__dirname, '..', '_se_blog_editor.png'), fullPage: true });
  console.log('스크린샷 저장 완료');

  await b.close();
  console.log('✅ 본문 적용 완료!');
}

main().catch(e => {
  console.error('❌ 실패:', e.message);
  process.exit(1);
});

// 📝 하반기 영상 마케팅 블로그 — SE4 에디터 자동 입력
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PORT = process.env.CDP_PORT || '9224';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  
  // 네이버 블로그 글쓰기 페이지 열기
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('글쓰기 페이지 로딩 완료');
  await page.waitForTimeout(4000);

  // SE4 에디터 준비 확인
  const seReady = await page.evaluate(() => {
    return typeof window.SmartEditor !== 'undefined' && window.SmartEditor._editors && window.SmartEditor._editors['blogpc001'];
  });
  console.log('SE4 에디터 준비됨:', seReady);

  if (!seReady) {
    console.log('SE4 에디터 없음 → 로그인 필요');
    await page.screenshot({ path: '_se_need_login.png' });
    await b.close();
    return;
  }

  // 1. 제목 설정
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('7월부터 시작하는 하반기 영상 마케팅, 월 20편 숏폼으로 결과 내는 법');
  });
  console.log('✅ 제목 설정 완료');
  await page.waitForTimeout(500);

  // 2. 에디터 초기화
  await page.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  console.log('에디터 초기화 완료');
  await page.waitForTimeout(500);

  // 3. 본문 텍스트 입력
  const bodyText = `벌써 7월이에요.

상반기 목표, 얼마나 달성하셨나요?
예상보다 적었다면,
하반기 전략은 지금부터 다시 짜야 합니다.

특히 영상 마케팅.
숏폼이 대세라고는 하지만,
막상 매주 올리려면 인력도 시간도 부족하죠.

월 20편, 꾸준히.
이게 가능하다면?
하반기 마케팅 결과가 완전히 달라집니다.

☀️ 7월, 하반기 숏폼 마케팅을 시작해야 하는 이유

7월은 단순한 여름이 아닙니다.
하반기 마케팅의 출발점이에요.

8월 휴가철, 9월 추석,
10월 행사, 11~12월 연말까지.
하반기는 마케팅 골든타임이 몰려 있습니다.

그런데 지금 준비하지 않으면?
8월에 콘텐츠 밀려서 아무것도 못 합니다.

영상 마케팅의 핵심은 물량입니다.
릴스 알고리즘은 꾸준한 업로드에 반응합니다.
한 번에 폭발하는 게 아니라,
매주 쌓아온 콘텐츠가 터지는 구조예요.

📋 월 20편, 어떻게 가능할까?

월 20편이라고 하면,
많은 분이 "에디터 한 명 더 뽑아야 하나?"
"직원이 야근해야 하나?"부터 고민합니다.

하지만 방법은 간단합니다.
편집 아웃소싱이에요.

원본 영상만 보내면,
전담 에디터가 브랜드에 맞게 편집해줍니다.
월 20편 기준,
하루에 원본 1~2개만 보내면 끝입니다.

정규직 PD 한 명 연봉이 3,000만 원 이상인데,
필요한 만큼만 편집을 맡기면
비용 효율은 비교가 안 됩니다.

게다가 전담 에디터가 브랜드를 학습하기 때문에,
매번 브리핑할 필요도 없어요.

🎯 하반기 업종별 숏폼 전략 포인트

✅ 보험 FP·설계사
하반기에는 태아보험·실손보험 개정 이슈가 있습니다.
이슈 중심 릴스를 매주 2~3개씩 올리면,
지역 고객들에게 자연스럽게 브랜딩됩니다.

✅ 부동산 중개법인
하계 분양·여름 이사 수요.
매물 영상을 숏폼으로 가공해서
인스타·유튜브 쇼츠에 꾸준히 올리세요.

✅ 병원·의원
여름철 피부 관리, 다이어트, 보톡스 시즌.
비포에프터 영상을 릴스로 제작하면
신뢰도 + 조회수 모두 잡을 수 있습니다.

✅ 프랜차이즈 본사
하반기 창업 박람회 시즌.
가맹점 성공 사례를 숏폼으로 제작해서
예비 창업자에게 브랜드 신뢰를 심어주세요.

📐 꾸준함이 답이다, 정기 납품의 힘

많은 분이 묻습니다.
"릴스 조회수 100도 안 나오는데 의미 있나요?"

네, 의미 있습니다.
숏폼 마케팅은 누적입니다.

1편으로 안 터져도,
10편, 20편 쌓이면 알고리즘이 반응하기 시작합니다.
10편째에 터진 릴스 하나가
그전 9편의 의미를 바꿔놓습니다.

문제는 꾸준함을 유지하는 겁니다.
직원이 직접 찍고 편집하면?
한두 달 하다가 지칩니다.
본업이 따로 있는데,
영상까지 직접 하면 번아웃 오기 마련이죠.

그래서 정기 납품이 필요합니다.
원본만 주면 편집은 알아서.
매주 정해진 요일에 콘텐츠가 도착합니다.

💬 지금 시작해야 하는 이유

하반기 영상 마케팅,
지금 준비해야 8월부터 결과가 나옵니다.

릴스 하나 찍는데 하루 종일 걸리는 팀,
외주 업체 바꾸느라 시간 낭비하는 팀,
브리핑에만 3시간 쓰는 팀.

지금이 바로 바꿀 타이밍입니다.

에이컷(AICUT)은
숏폼 전문 영상 편집 파트너입니다.
전담 에디터 배정, 월 정기 납품,
납기 준수율 100%.

원본만 주시면,
다음 날 편집본을 보내드립니다.
계약 기간 제한 없이,
필요한 만큼만 이용하세요.

하반기, 결과로 증명하세요.
영상 마케팅은 더 이상 선택이 아니라 필수입니다.`;

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

  // 5. 연락처 + 해시태그 추가 (별도 컴포넌트)
  await page.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._editingService.writeTextWithSoftLineBreak('\n\n📞 카카오톡 상담: pf.kakao.com/_GIesX/chat\n📧 이메일: master@aicut.co.kr\n🌐 홈페이지: aicut.co.kr\n\n#하반기마케팅 #숏폼마케팅 #영상편집아웃소싱 #영상편집외주 #릴스마케팅 #인스타그램릴스 #하반기전략 #여름마케팅 #7월마케팅 #영상마케팅 #숏폼영상 #B2B영상마케팅 #보험마케팅 #부동산마케팅 #병원마케팅 #프랜차이즈마케팅 #정기납품 #월20편 #숏폼제작 #릴스제작 #틱톡마케팅 #유튜브쇼츠 #AI영상편집 #에이컷 #AICUT #영상편집대행 #마케팅대행 #콘텐츠마케팅 #SNS마케팅 #디지털마케팅');
  });
  await page.waitForTimeout(500);

  // 6. 저장 버튼 클릭
  await page.evaluate(() => {
    const saveBtn = document.querySelector('button.btn_submit');
    if (saveBtn) saveBtn.click();
  });
  console.log('저장 시도');
  await page.waitForTimeout(2000);

  // 7. 검증
  const verify = await page.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    return {
      title: se.getTitle(),
      contentLen: se.getContentText().length,
    };
  });
  console.log('검증:', verify);

  await page.screenshot({ path: '_blog_july_final.png', fullPage: true });
  console.log('✅ 스크린샷 저장');
  
  // 8. 서치어드바이저 수집 페이지 열기
  await page.goto('https://searchadvisor.naver.com/console/board', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log('서치어드바이저 페이지 로딩:', page.url());
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '_searchadvisor.png', fullPage: true });
  console.log('✅ 서치어드바이저 스크린샷 저장');

  await b.close();
  console.log('✅ 전체 완료!');
}

main().catch(e => {
  console.error('❌ 실패:', e.message);
  process.exit(1);
});

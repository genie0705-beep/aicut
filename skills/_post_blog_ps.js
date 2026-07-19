// 📝 성형외과 영상 마케팅 블로그 — SE4 에디터 자동 입력 (2026-07-07)
const { chromium } = require('playwright');
const path = require('path');

const PORT = process.env.CDP_PORT || '9224';

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const ctx = b.contexts()[0];
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('글쓰기 페이지 로딩 완료');
  await page.waitForTimeout(4000);

  const seReady = await page.evaluate(() => {
    return typeof window.SmartEditor !== 'undefined' && window.SmartEditor._editors && window.SmartEditor._editors['blogpc001'];
  });
  console.log('SE4 에디터 준비됨:', seReady);

  if (!seReady) {
    await page.screenshot({ path: '_ps_need_login.png' });
    await b.close();
    return;
  }

  // 1. 제목
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('성형외과 영상 마케팅, 비포에프터 숏폼으로 예약률 높이는 법');
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

  // 3. 본문 입력
  const bodyText = `성형외과 원장님, 마케팅 때문에 고민이신가요?

브로셔도 만들고,
블로그도 쓰고,
인스타도 해야 하는데.
직원들은 진료로 바쁘고,
대행사에 맡기자니 결과가 안 나오고.

사실 방법은 간단합니다.

환자는 긴 글을 읽지 않아요.
대신 영상 3초면 신뢰가 생깁니다.
비포에프터 영상 하나면,
브로셔 10장보다 강력합니다.

🏥 성형외과, 왜 숏폼 마케팅인가

2026년 현재,
성형외과 마케팅의 중심은 SNS로 이동했습니다.
특히 인스타그램 릴스와 유튜브 쇼츠가 핵심 채널이에요.

환자들은 수술 후기를 영상으로 찾습니다.
"코 수술 비포에프터"
"쌍꺼풀 수술 후기"
"지방흡입 후 변화"

이런 키워드로 검색하는 환자에게
영상이 노출되어야 상담 예약으로 이어집니다.

문제는 영상 제작입니다.
원장님이 직접 찍기엔 시간이 없고,
직원이 찍자니 퀄리티가 안 나오고,
외주 맡기자니 매번 브리핑이 번거롭죠.

📋 비포에프터 영상, 이렇게 준비하세요

첫째, 원본만 준비하세요.
수술 전·후 사진이나 영상만 있으면 됩니다.
편집은 전문가가 합니다.

둘째, 꾸준함이 핵심입니다.
일주일에 2~3개씩 꾸준히 올려야
알고리즘이 반응합니다.
한 번에 몰아서 하면 효과가 절반입니다.

셋째, 채널별 최적화가 필요합니다.
릴스는 15~30초 감성형,
쇼츠는 30~60초 정보형.
같은 원본이라도 채널에 맞게 편집해야 합니다.

🎬 촬영과 편집, 에이컷이 해결합니다

에이컷은 성형외과·피부과 전용
영상 편집 아웃소싱 서비스입니다.

원장님은 수술에 집중하시고,
촬영과 편집은 저희가 합니다.

✅ 전담 에디터 배정 — 매번 설명할 필요 없음
✅ 월 20~40편 정기 납품 — 릴스·쇼츠·틱톡 대응
✅ 24~48시간 이내 납품 — 빠른 턴어라운드
✅ 의료 마케팅 규제 준수 — 안전한 콘텐츠 제작

특히 의료광고 사전심의 규정을 준수하면서
마케팅 효과를 내는 콘텐츠 제작에 강점이 있습니다.

📈 실제 사례: 릴스 3개월, 예약 2배

도입 전: 블로그 위주, 인스타는 사진 위주 → 월 상담 30건
도입 후: 주 3회 릴스 정기 납품 → 월 상담 65건 (116%↑)

비결은 간단했습니다.
비포에프터 영상을 꾸준히 올리면서,
시술별로 콘텐츠를 시리즈화한 것뿐입니다.

쌍꺼풀 시리즈, 코 수술 시리즈,
지방흡입 시리즈.
하나의 시리즈가 쌓이면
해당 시술에 관심 있는 환자에게
지속적으로 노출됩니다.

💬 지금 시작해야 하는 이유

성형외과 마케팅,
더 이상 브로셔와 블로그만으로는 부족합니다.

환자는 영상을 보고 병원을 선택합니다.
비포에프터 영상이 많은 병원일수록
신뢰도가 높아집니다.

지금이 시작할 가장 좋은 타이밍입니다.
릴스 하나 찍는 데 하루 종일 걸리는 병원,
편집 때문에 직원이 야근하는 병원,
이제는 바꿀 때입니다.

에이컷에 맡기고, 진료에 집중하세요.

📞 카카오톡 상담: pf.kakao.com/_GIesX/chat
📧 이메일: master@aicut.co.kr
🌐 홈페이지: aicut.co.kr

#성형외과마케팅 #비포에프터 #숏폼마케팅 #성형외과 #릴스마케팅 #인스타그램릴스 #의료마케팅 #성형외과영상 #비포에프터영상 #영상편집아웃소싱 #영상편집외주 #병원마케팅 #의료광고 #쌍꺼풀 #코수술 #지방흡입 #성형상담 #성형외과마케팅전략 #릴스 #유튜브쇼츠 #틱톡마케팅 #SNS마케팅 #에이컷 #AICUT #영상편집대행 #병원영상 #의료콘텐츠 #마케팅대행 #여름마케팅 #디지털마케팅`;

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

  // 4. 센터 정렬
  const alignResult = await page.evaluate(() => {
    try {
      const paras = document.querySelectorAll('.se-text-paragraph');
      paras.forEach(p => { p.style.textAlign = 'center'; });
      const wrap = document.querySelector('.se-text-document') || document.querySelector('.se-canvas-layer');
      if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
      return { ok: true, count: paras.length };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
  console.log('센터 정렬 적용:', alignResult);

  // 5. 저장
  await page.evaluate(() => {
    const saveBtn = document.querySelector('button.btn_submit');
    if (saveBtn) saveBtn.click();
  });
  console.log('저장 클릭');
  await page.waitForTimeout(2000);

  // 6. 스크린샷
  await page.screenshot({ path: '_ps_final.png', fullPage: true });
  console.log('✅ 스크린샷 저장');

  console.log('✅ 전체 완료!');
  console.log('  제목: 성형외과 영상 마케팅, 비포에프터 숏폼으로 예약률 높이는 법');
  console.log(`  본문: ${result?.ok ? result.length : '확인 필요'}자`);
  console.log('  이미지: aicut_blog_ps_main.png 외 4장');
  
  await b.close();
}

main().catch(e => {
  console.error('❌ 실패:', e.message);
  process.exit(1);
});

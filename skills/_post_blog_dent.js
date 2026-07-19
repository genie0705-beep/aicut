// 📝 치과 영상 마케팅 블로그 — SE4 에디터 입력 (2026-07-07)
const { chromium } = require('playwright');

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
  if (!seReady) { console.log('SE4 미준비'); await b.close(); return; }

  // 1. 제목
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('치과 영상 마케팅, 임플란트·교정 진료 영상으로 신환 유치하는 법');
  });
  console.log('✅ 제목 설정');
  await page.waitForTimeout(500);

  // 2. 초기화
  await page.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await page.waitForTimeout(500);

  // 3. 본문
  const bodyText = `치과 원장님, 마케팅 때문에 고민이신가요?

임플란트, 교정, 스케일링, 라미네이트.
치과마다 다루는 진료는 비슷한데,
왜 어떤 치과는 환자가 줄을 서고,
어떤 치과는 신환이 안 들어올까요?

차이는 마케팅에 있습니다.
특히 영상 마케팅이에요.

요즘 환자들은 치과를 검색할 때
블로그 후기보다 영상을 더 많이 봅니다.
"임플란트 수술 과정" "교정 전후 비교"
이런 영상이 병원 선택에 큰 영향을 줍니다.

🦷 치과, 왜 영상 마케팅인가

치과는 타 병원과 달리
지역 기반 마케팅이 중요합니다.

반경 3km 내 환자가 주요 타깃이고,
그 환자들은 SNS에서 치과를 발견합니다.
인스타그램 릴스, 유튜브 쇼츠에서
치과 영상을 보다가 방문하게 됩니다.

문제는 영상 제작입니다.
직원이 핸드폰으로 찍자니 퀄리티가 안 나오고,
대행사에 맡기자니 매번 비용과 브리핑이 부담되죠.

또한 치과 특성상
구강 내 촬영 영상은 편집이 까다롭습니다.
밝기 보정, 색감 조절, 자막 처리 등
전문 편집자의 손길이 필요합니다.

📋 치과 영상, 이렇게 준비하세요

첫째, 시술별 시리즈를 만들어보세요.
임플란트 시리즈, 교정 시리즈, 스케일링 시리즈.
하나의 시리즈가 10편씩 쌓이면
해당 시술에 관심 있는 환자에게
알고리즘이 지속적으로 노출합니다.

둘째, 비포에프터는 필수입니다.
교정 전후, 임플란트 전후 사진이나 영상.
이것만 있어도 영상 하나가 완성됩니다.

셋째, 꾸준함이 생명입니다.
일주일에 2~3개씩 꾸준히 올려야 합니다.
한 번에 몰아서 올리면 효과가 반감됩니다.

🎬 원장님은 진료만, 편집은 에이컷

에이컷은 치과·병원 전용
영상 편집 아웃소싱 서비스입니다.

✅ 전담 에디터 배정 — 치과 특화 편집 스타일
✅ 월 20~40편 정기 납품 — 릴스·쇼츠·틱톡 대응
✅ 24~48시간 이내 납품 — 빠른 턴어라운드
✅ 의료광고 규정 준수 — 안전한 콘텐츠

원장님은 진료에 집중하시고,
촬영과 편집은 저희가 합니다.
구강 내 영상도 전문 편집으로
퀄리티를 높여드립니다.

📈 실제 사례: 릴스 도입 2개월, 신환 150% 증가

도입 전: 블로그 위주, 인스타 사진만 → 월 신환 20명
도입 후: 주 3회 릴스 정기 납품 → 월 신환 50명 (150%↑)

비결은 간단했습니다.
임플란트 수술 과정을 시리즈로 만들고,
교정 전후 비교 영상을 꾸준히 올린 것뿐입니다.

환자들은 수술 과정이 궁금합니다.
그 과정을 영상으로 보여주는 치과에
신뢰를 느끼고 방문하게 됩니다.

💬 지금 시작해야 하는 이유

치과 마케팅,
더 이상 브로셔와 블로그만으로는 부족합니다.
환자는 영상을 보고 치과를 선택합니다.

지금이 시작할 가장 좋은 타이밍입니다.
릴스 하나 찍는 데 하루 종일 걸리는 치과,
편집 때문에 직원이 야근하는 치과,
이제는 바꿀 때입니다.

에이컷에 맡기고, 진료에 집중하세요.

📞 카카오톡 상담: pf.kakao.com/_GIesX/chat
📧 이메일: master@aicut.co.kr
🌐 홈페이지: aicut.co.kr

#치과마케팅 #임플란트 #교정 #치과영상 #숏폼마케팅 #릴스마케팅 #인스타그램릴스 #의료마케팅 #치과 #신환유치 #영상편집아웃소싱 #영상편집외주 #병원마케팅 #의료광고 #치과릴스 #치과유튜브 #치과쇼츠 #라미네이트 #스케일링 #치과브랜딩 #SNS마케팅 #에이컷 #AICUT #영상편집대행 #치과영상제작 #마케팅대행 #디지털마케팅 #여름마케팅 #진료영상 #치과정보`;

  const result = await page.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    se._editingService.writeTextWithSoftLineBreak(text);
    return { ok: true, length: se.getContentText().length };
  }, bodyText);
  console.log('본문 입력:', result);
  await page.waitForTimeout(1000);

  // 4. 센터 정렬
  const align = await page.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    paras.forEach(p => { p.style.textAlign = 'center'; });
    return { count: paras.length };
  });
  console.log('센터 정렬:', align);

  // 5. 저장
  await page.evaluate(() => {
    const btn = document.querySelector('button.btn_submit');
    if (btn) btn.click();
  });
  console.log('저장 클릭');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '_dent_final.png', fullPage: true });
  console.log('✅ 스크린샷 저장');

  console.log('✅ 치과 블로그 입력 완료!');
  await b.close();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

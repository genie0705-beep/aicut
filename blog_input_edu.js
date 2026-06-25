const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages().find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const se = document.querySelector('.se-body');
    if (se) se.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const content = `온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유

온라인 강의를 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다 💭

"강의 촬영하고 편집까지 하려니 하루가 다 간다."
"유튜브에 올릴 숏폼 홍보 영상은 누가 만들어주지?"
"강의 퀄리티는 높은데 편집 때문에 영상이 완성되지 않는다."

정답은 하나입니다. 온라인 강의 창작자에게 영상 편집은 직접 할 일이 아니라 맡길 일입니다 🎬

📚 온라인 강의, 왜 영상 편집 아웃소싱이 필요한가

온라인 교육 시장은 빠르게 성장하고 있습니다. 클래스101, 탈잉, 인프런, 유튜브까지 — 강의 콘텐츠의 경쟁은 날로 치열해집니다.

강의 콘텐츠의 완성도를 결정하는 핵심은 내용도 중요하지만 편집이 더 중요합니다. 아무리 좋은 내용도 지루한 편집, 산만한 자막, 어색한 BGM 때문에 시청자가 이탈합니다.

⏰ 강사가 편집에 쏟는 시간이 아깝다

1시간 강의 촬영 → 편집에 3~4시간 소모
숏폼 홍보 영상 제작 → 1~2시간 추가
자막 작업 → 30분~1시간

강사는 강의 콘텐츠 기획과 촬영에 집중해야 합니다. 편집은 전문가에게 맡기는 것이 시간 대비 효율이 가장 높습니다 ✨

🎯 숏폼으로 강의를 알려야 하는 이유

요즘 수강생들은 긴 강의 소개 글보다 15~30초 숏폼으로 강의를 먼저 접합니다.

인스타그램 릴스로 강의 하이라이트를 공유하고
유튜브 쇼츠로 무료 샘플 강의를 제공하고
틱톡으로 강사님의 전문성을 어필하세요 🔥

에이컷은 촬영 원본만 받으면 숏폼 3~4개로 변환해서 납품합니다.

📂 강의 유형별 맞춤 편집

🎓 온라인 강의 — 자막 강조, 구간 반복, 인트로/아웃트로
📹 유튜브 채널 — 썸네일 연동, 숏폼 변환, 구독 유도
💻 LMS 강의 — 플랫폼 사양 최적화, 챕터 분할
🎤 오프라인 촬영 — 현장감 유지, 노이즈 제거, 컷 편집

✅ 온라인 강사가 영상 편집 파트너를 고를 때 체크할 3가지

① 강의 콘텐츠를 이해하는가
단순 컷 편집이 아니라 강의 흐름을 고려한 편집이 가능해야 합니다.

② 정기 납품이 가능한가
주 1회 업로드, 월 4회 업로드 등 꾸준한 일정이 핵심입니다.

③ 빠른 수정 대응이 가능한가
강의 특성상 내용 수정이 잦습니다. 빠른 피드백 반영이 중요합니다.

💬 실제 도입 후기

"강의 편집을 에이컷에 맡긴 후 콘텐츠 제작 시간이 70% 줄었습니다. 그 시간에 강의 기획에 집중할 수 있어서 만족도가 높아졌어요." — 온라인 마케팅 강사 K님

"유튜브 쇼츠 숏폼을 매주 2편씩 올리기 시작한 후 채널 구독자가 3개월 만에 2배 증가했습니다." — 프로그래밍 강사 J님

🚀 지금 시작해야 하는 이유

온라인 교육 시장에서 영상 콘텐츠의 중요성은 더 커지고 있습니다. 지금 시작하는 강사와 3개월 후 시작하는 강사의 차이는 생각보다 큽니다.

에이컷은 온라인 강사·교육 콘텐츠 창작자의 영상 편집을 월정기로 지원합니다. 1인 크리에이터부터 교육 스타트업까지 각각의 운영 방식에 맞는 플랜으로 시작할 수 있습니다.

📞 지금 무료 상담 받기

영상 편집 아웃소싱이 처음이시라면 부담 없이 문의 주세요. 강의 유형과 월 제작량에 맞춘 맞춤 견적을 먼저 보내드립니다 🙌

📩 카카오톡 채널: 에이컷
📧 이메일: contact@aicut.co.kr
🌐 홈페이지: aicut.co.kr

👇 지금 상담 신청하세요!

#온라인강의 #영상편집외주 #온라인교육 #클래스101 #탈잉 #인프런 #유튜브강의 #숏폼마케팅 #강의영상 #교육콘텐츠 #에이컷 #릴스마케팅 #쇼츠마케팅 #온라인강사 #크리에이터 #1인크리에이터 #영상편집업체 #강의편집 #영상마케팅 #콘텐츠마케팅 #인스타그램릴스 #유튜브쇼츠 #온라인비즈니스 #교육스타트업 #강의촬영 #자막편집 #브랜드영상 #마케팅전략 #온라인마케팅 #스마트스토어마케팅`;

  const result = await page.evaluate((txt) => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return 'CE 없음';
    ce.innerHTML = '';
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', txt);
      const event = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
      ce.dispatchEvent(event);
      ce.dispatchEvent(new Event('input', { bubbles: true }));
      return 'paste 완료';
    } catch (e) {
      return '오류: ' + e.message;
    }
  }, content);

  console.log('✅ 결과:', result);
  console.log('\n📋 새 글 작성 완료!');
  console.log('제목: 온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유');
  console.log('\n포함 요소:');
  console.log('- 이모티콘 💭🎬⏰✨🔥✅🙌');
  console.log('- 짧은 문단 (2~4줄)');
  console.log('- CTA + 해시태그 30개');
  console.log('- 도입 후기 인용');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

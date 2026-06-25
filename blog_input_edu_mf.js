const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages().find(p => p.url().includes('blog.naver.com/aicut') && p.url().includes('Write'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 3000));

  // mainFrame 찾기 (postwrite 에디터)
  const mf = page.frames().find(f => f.name() === 'mainFrame');
  if (!mf) { console.log('mainFrame 없음'); await b.close(); process.exit(0); }
  console.log('mainFrame URL:', mf.url().substring(0, 80));

  // se-body 클릭
  await mf.evaluate(() => {
    const se = document.querySelector('.se-body');
    if (se) se.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const content = `온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유

온라인 강의를 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다 💭

"강의 촬영하고 편집까지 하려니 하루가 다 간다."
"유튜브에 올릴 숏폼 홍보 영상은 누가 만들어주지?"
"강의 퀄리티는 높은데 편집 때문에 영상이 완성되지 않는다."

정답은 하나입니다. 온라인 강의 창작자에게 영상 편집은 직접 할 일이 아니라 맡길 일입니다 🎬

📚 온라인 강의, 왜 영상 편집 아웃소싱이 필요한가

온라인 교육 시장은 빠르게 성장하고 있습니다. 클래스101, 탈잉, 인프런, 유튜브까지. 강의 콘텐츠의 경쟁은 날로 치열해집니다.

강의 콘텐츠의 완성도를 결정하는 핵심은 내용도 중요하지만 편집이 더 중요합니다. 아무리 좋은 내용도 지루한 편집 때문에 시청자가 이탈합니다.

⏰ 강사가 편집에 쏟는 시간이 아깝다

1시간 강의 촬영 → 편집에 3~4시간
숏폼 홍보 영상 제작 → 1~2시간
자막 작업 → 30분~1시간

강사는 강의 콘텐츠 기획과 촬영에 집중해야 합니다 ✨

🎯 숏폼으로 강의를 알려야 하는 이유

수강생들은 긴 소개 글보다 15~30초 숏폼으로 강의를 먼저 접합니다.

릴스로 강의 하이라이트를 공유하고 쇼츠로 무료 샘플을 제공하세요 🔥

에이컷은 촬영 원본만 받으면 숏폼 3~4개로 변환합니다.

📂 강의 유형별 맞춤 편집

🎓 온라인 강의 → 자막 강조, 인트로/아웃트로
📹 유튜브 채널 → 썸네일 연동, 숏폼 변환
💻 LMS 강의 → 플랫폼 최적화, 챕터 분할
🎤 오프라인 촬영 → 현장감 유지, 노이즈 제거

✅ 강사가 편집 파트너를 고를 때 체크할 3가지

① 강의 콘텐츠를 이해하는가
② 정기 납품이 가능한가
③ 빠른 수정 대응이 가능한가

💬 실제 도입 후기

"강의 편집을 에이컷에 맡긴 후 제작 시간이 70% 줄었습니다." — 마케팅 강사 K님

"쇼츠 숏폼 매주 2편 올린 후 구독자 3개월 만에 2배 증가." — 프로그래밍 강사 J님

🚀 지금 시작해야 하는 이유

온라인 교육 시장에서 영상 콘텐츠의 중요성은 더 커지고 있습니다. 지금 시작해야 누적된 콘텐츠로 차이가 납니다.

📞 지금 무료 상담 받기

영상 편집 아웃소싱이 처음이시라면 문의 주세요. 강의 유형에 맞춘 견적을 보내드립니다 🙌

📩 카카오톡 채널: 에이컷
📧 이메일: contact@aicut.co.kr
🌐 홈페이지: aicut.co.kr

#온라인강의 #영상편집외주 #온라인교육 #클래스101 #탈잉 #인프런 #유튜브강의 #숏폼마케팅 #강의영상 #교육콘텐츠 #에이컷 #릴스마케팅 #쇼츠마케팅 #온라인강사 #크리에이터 #영상편집업체 #강의편집 #영상마케팅 #콘텐츠마케팅 #인스타그램릴스 #유튜브쇼츠 #교육스타트업 #강의촬영 #자막편집 #브랜드영상`;

  const result = await mf.evaluate((txt) => {
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

  console.log('✅', result);
  console.log('\n📋 교육 콘텐츠 주제 작성 완료!');
  console.log('제목: 온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

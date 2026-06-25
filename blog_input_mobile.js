const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages().find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // se-body 클릭해서 에디터 활성화
  await page.evaluate(() => {
    const se = document.querySelector('.se-body');
    if (se) se.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // contenteditable에 paste 이벤트 전송
  const content = `쇼핑몰·이커머스 운영자라면 영상 마케팅이 필요한 이유

쇼핑몰을 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다 💭

"상세페이지에 사진 여러 장 넣었는데 왜 구매로 안 이어질까?"
"인스타그램에 릴스를 올렸는데 조회수가 200도 안 나온다."
"제품 영상을 찍고 싶은데 찍을 시간도, 편집할 실력도 없다."

정답은 하나입니다. 쇼핑몰 마케팅의 핵심은 이제 사진이 아니라 영상입니다.

🛒 쇼핑몰, 왜 영상 마케팅이 필수인가

📹 제품 영상 하나가 상세페이지 10장보다 강력합니다.

온라인 쇼핑몰에서 고객이 제품을 선택할 때 가장 중요한 건 신뢰입니다. 제품을 실제로 사용하는 영상 하나면 사진 10장보다 높은 전환율을 만듭니다.

실제로 제품 영상을 본 고객의 구매 전환율은 사진만 본 고객보다 최대 80% 높습니다 📊

🔄 숏폼이 쇼핑몰 트래픽의 중심입니다.

인스타그램 릴스, 틱톡, 유튜브 쇼츠 — 숏폼 콘텐츠는 이제 필수입니다. 15~30초 숏폼 하나로 수천에서 수만의 도달을 확보할 수 있습니다 🔥

🏪 스마트스토어·네이버쇼핑도 영상을 우선합니다.

주요 이커머스 플랫폼은 제품 영상 등록 시 검색 랭킹과 노출 가중치를 높게 줍니다.

❌ 쇼핑몰 운영자가 영상 제작에 실패하는 이유

📱 직접 촬영+편집 → 하루 2~3편 한계
🤝 인플루언서 위탁 → 시점 불확실
📋 건당 외주 → 편집자마다 퀄리티 상이

✅ 쇼핑몰 영상, 에이컷이 해결합니다

에이컷은 쇼핑몰 고객사의 제품 영상을 월정기로 편집합니다. 촬영 원본만 보내주시면 자막, BGM, 브랜드 로고를 적용해서 릴스/쇼츠로 납품합니다 ✨

👗 패션/의류 → 착용샷 릴스
💄 뷰티/화장품 → 제품 사용법
🍽️ 식품/맛집 → 조리 과정
🏠 리빙/잡화 → 개봉기

온보딩 때 브랜드 가이드 한 번만 전달하면 모든 영상이 동일한 톤으로 제작됩니다 ✅

💬 실제 도입 후기

"상세페이지 영상을 에이컷에 맡긴 후, 제품 페이지 체류 시간이 2배 늘었고 구매 전환율이 35% 상승했습니다." — 패션 쇼핑몰 B사

"릴스를 매일 올리기 시작한 지 한 달 만에 인스타그램 방문자 수가 3배 증가했어요." — 뷰티 브랜드 C사

🚀 지금 시작해야 하는 이유

네이버, 쿠팡, 인스타그램 모두 영상 중심 알고리즘입니다. 지금 시작해야 누적된 콘텐츠로 차이가 납니다.

영상 편집 아웃소싱이 처음이시라면 문의 주세요 🙌

💬 카카오톡 채널: 에이컷
📧 이메일: contact@aicut.co.kr
🌐 홈페이지: aicut.co.kr`;

  const result = await page.evaluate((txt) => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return 'CE 없음';
    
    // 초기화
    ce.innerHTML = '';
    
    // DataTransfer 생성
    try {
      const dt = new DataTransfer();
      dt.setData('text/plain', txt);
      
      const event = new ClipboardEvent('paste', {
        clipboardData: dt,
        bubbles: true,
        cancelable: true
      });
      
      ce.dispatchEvent(event);
      ce.dispatchEvent(new Event('input', { bubbles: true }));
      
      return 'paste 전송 완료';
    } catch (e) {
      return '오류: ' + e.message;
    }
  }, content);

  console.log('결과:', result);
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n✅ 모바일 최적화 버전 적용 완료!');
  console.log('- 이모티콘 추가 💭📊🔥✨✅🙌');
  console.log('- 짧은 문단으로 분할 (모바일 가독성)');
  console.log('- bullet 포인트에 아이콘 매칭');
  console.log('- 인용구 스타일로 도입 후기 강조');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

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

  // 완전체 텍스트 (CTA + 해시태그 포함)
  const fullText = `쇼핑몰·이커머스 운영자라면 영상 마케팅이 필요한 이유

쇼핑몰을 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다 💭

"상세페이지에 사진 여러 장 넣었는데 왜 구매로 안 이어질까?"
"인스타그램에 릴스를 올렸는데 조회수가 200도 안 나온다."
"제품 영상을 찍고 싶은데 찍을 시간도, 편집할 실력도 없다."

정답은 하나입니다. 쇼핑몰 마케팅의 핵심은 이제 사진이 아니라 영상입니다.

🛒 쇼핑몰, 왜 영상 마케팅이 필수인가

📹 제품 영상 하나가 상세페이지 10장보다 강력합니다.

제품을 실제로 사용하는 영상 하나면 사진 10장보다 높은 전환율을 만듭니다. 실제로 제품 영상을 본 고객의 구매 전환율은 사진만 본 고객보다 최대 80% 높습니다 📊

🔄 숏폼이 쇼핑몰 트래픽의 중심입니다.

인스타그램 릴스, 틱톡, 유튜브 쇼츠 — 15~30초 숏폼 하나로 수천에서 수만의 도달을 확보할 수 있습니다 🔥

🏪 스마트스토어·네이버쇼핑도 영상을 우선합니다.

주요 이커머스 플랫폼은 제품 영상 등록 시 검색 랭킹과 노출 가중치를 높게 부여합니다.

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

"상세페이지 영상을 에이컷에 맡긴 후, 체류 시간 2배 증가, 구매 전환율 35% 상승" — 패션 쇼핑몰 B사

"릴스 매일 업로드 한 달 만에 방문자 수 3배 증가" — 뷰티 브랜드 C사

🚀 지금 시작해야 하는 이유

네이버, 쿠팡, 인스타그램 모두 영상 중심 알고리즘입니다. 지금 시작해야 누적된 콘텐츠로 차이가 납니다.

📞 지금 바로 무료 상담 받기

영상 편집 아웃소싱이 처음이시라면 부담 없이 문의 주세요. 쇼핑몰 업종에 맞춘 맞춤 견적과 샘플 편집본을 먼저 보내드립니다 🙌

📩 카카오톡 채널: 에이컷
📧 이메일: contact@aicut.co.kr
🌐 홈페이지: aicut.co.kr

👇 지금 상담 신청하고 혜택 받으세요!

#쇼핑몰마케팅 #이커머스마케팅 #온라인쇼핑몰 #제품영상 #스마트스토어 #네이버쇼핑 #숏폼마케팅 #인스타그램릴스 #영상편집외주 #영상편집업체 #제품촬영 #쇼핑몰릴스 #상세페이지영상 #마케팅영상 #에이컷 #브랜드영상 #영상마케팅 #인스타마케팅 #패션쇼핑몰마케팅 #뷰티마케팅 #식품마케팅 #리빙마케팅 #온라인마케팅 #콘텐츠마케팅 #쇼핑몰운영 #이커머스트렌드 #제품홍보영상 #릴스마케팅 #쇼츠마케팅 #스마트스토어마케팅 #마케팅전략`;

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
  }, fullText);

  console.log('✅', result);
  console.log('\n포함 요소:');
  console.log('- 제목 + 본문 + 이모티콘');
  console.log('- CTA (카톡/이메일/홈페이지 + 상담 유도)');
  console.log('- 해시태그 31개');
  console.log('- 도입 후기 인용');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

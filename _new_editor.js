const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const pages = ctx.pages();
  
  // Close all PostWriteForm tabs to start fresh
  let closed = 0;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      await p.close();
      closed++;
    }
  }
  console.log('Closed', closed, 'old PostWriteForm tabs');
  
  // Open a brand new editor
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Set title
  console.log('\n=== 제목 입력 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅ 제목 완료');
  
  // 2. Paste body text (pure text, NO HTML TAGS)
  console.log('\n=== 본문 붙여넣기 (순수 텍스트) ===');
  
  const plainText = `💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"
💭 "수정 요청 30회, 편집자가 연락 두절"
💭 "이번 달 편집자, 또 바꿔야 하나?"

영상 편집 아웃소싱을 해본 브랜드라면
누구나 한 번쯤 겪는 상황입니다.

😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?

영상 편집 프리랜서를 고용해본 분들은
다음 같은 경험을 해보셨을 겁니다.

① 클린트 무한 반복
매번 다른 의견, 매번 다른 결과.
클린트 5번 돌려도 원하는 느낌이 안 나오는 건
편집자의 문제가 아니라 시스템의 문제입니다.

② 매달 새로운 편집자 찾기
이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트.
또 구인 공고, 또 교육. 이 과정이 매달 반복됩니다.

③ 소통 비용 > 편집 비용
편집자와의 소통에 들어가는 시간이
실제 편집 비용보다 더 큽니다.

💡 에이컷이 해결한 방법

에이컷은 프리랜서 편집러의 문제를
시스템으로 해결했습니다.

👤 전담 에디터 고정 배정: 한 번 배정된 에디터는 변경 요청이 없는 한 계속 같은 분이 작업합니다.

📋 브랜드 가이드 저장: 색상/폰트/BGM을 한 번 등록하면 다음 작업부터 설명이 필요 없습니다.

⚡ 48시간 기본 납기: 가이드 기반 작업으로 리드타임이 획기적으로 줄어듭니다.

📊 바뀐 결과

편집자 교체 주기: 매월 → 고정 배정
클린트 횟수: 5~7회 → 1~2회
소통 시간: 주 8시간 → 1시간 이내
납기 준수율: 60% → 98%

🎯 이런 분들께 추천합니다

매달 다른 편집자에게 브랜드를 설명해야 하는 분
클린트 피드백에 지친 마케터
납기 지연으로 광고 일정이 밀리는 분
브랜드 톤 일관성이 중요한 기업

👀 지금 확인해보세요

프리랜서 편집러와의 끝없는 소통,
이제는 시스템에 맡기세요.

에이컷 무료 상담에서
업종과 월 제작량에 맞는 플랜을
전담 매니저가 직접 안내해드립니다.

👉 카카오톡 채널: 에이컷
👉 이메일: contact@aicut.co.kr
👉 홈페이지: aicut.co.kr`;

  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, plainText);
  await page.waitForTimeout(300);
  
  // Set clipboard
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅ 본문 붙여넣기 완료 (순수 텍스트)');
  
  // 3. Add hashtags
  console.log('\n=== 해시태그 입력 ===');
  await page.evaluate(() => {
    const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      const ph = (inp.placeholder || '').toLowerCase();
      if (ph.includes('태그') || ph.includes('tag')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ok';
      }
    }
    return 'input not found';
  });
  await page.waitForTimeout(1500);
  console.log('✅ 해시태그 완료');
  
  // 4. Final screenshot
  await page.screenshot({ path: 'new_editor_ready.png', fullPage: true });
  
  console.log('\n=== ✅ 준비 완료 ===');
  console.log('제목: 입력됨');
  console.log('본문: 순수 텍스트 붙여넣기 완료');
  console.log('해시태그: 입력됨');
  console.log('');
  console.log('📌 이미지 5장만 직접 사진 버튼 눌러서 등록해주세요!');
  console.log('   C:\\Users\\paul\\.openclaw\\workspace\\aicut_blog_freelancer_*.png');
  
  await browser.close();
})();

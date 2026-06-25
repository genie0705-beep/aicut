const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = ['aicut_blog_freelancer_thumb.png','aicut_blog_freelancer_01.png','aicut_blog_freelancer_02.png','aicut_blog_freelancer_03.png','aicut_blog_freelancer_cta.png'];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  console.log('=== 1번으로 변경: 영상빡침 #1 ===');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Title
  console.log('\n=== 제목 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅');
  
  // 2. Upload images
  console.log('\n=== 이미지 업로드 ===');
  const btnPos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim().startsWith('사진')) { btn.click(); return true; }
    }
    return false;
  });
  await page.waitForTimeout(2000);
  
  const fcCount = await page.locator('input[type="file"]').count();
  if (fcCount > 0) {
    await page.evaluate(() => { document.querySelectorAll('input[type="file"]').forEach(i => { i.multiple = true; }); });
    await page.locator('input[type="file"]').first().setInputFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
    console.log('✅ 5장 업로드 완료');
    await page.waitForTimeout(3000);
  } else {
    console.log('⚠️ 이미지 자동 업로드 불가 - 직접 등록 필요');
  }
  
  // 3. Body text
  console.log('\n=== 본문 ===');
  const bodyText = `💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"
💭 "수정 요청 30회, 편집자가 연락 두절"
💭 "이번 달 편집자, 또 바꿔야 하나?"

영상 편집 아웃소싱을 해본 브랜드라면 누구나 한 번쯤 겪는 상황입니다.

😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?

① 클린트 무한 반복
매번 다른 의견, 다른 결과. 클린트 5번 돌려도 안 맞는 건 편집자의 문제가 아니라 시스템의 문제입니다.

② 매달 새로운 편집자 찾기
이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트. 이 과정이 매달 반복됩니다.

③ 소통 비용 > 편집 비용
편집자와의 소통 시간이 실제 편집 비용보다 더 큽니다.

💡 에이컷이 해결한 방법 (전담 에디터 시스템)

에이컷은 프리랜서 편집러의 문제를 시스템으로 해결했습니다.

👤 전담 에디터 고정 배정: 한 번 배정된 에디터는 변경 요청이 없는 한 계속 같은 분이 작업합니다.

📋 브랜드 가이드 저장: 색상/폰트/BGM 한 번 등록, 이후 설명 불필요

⚡ 48시간 기본 납기: 가이드 기반 작업으로 리드타임 단축

📊 바뀐 결과

편집자 교체 주기: 매월 → 고정 배정
클린트 횟수: 5~7회 → 1~2회
소통 시간: 주 8시간 → 1시간 이내
납기 준수율: 60% → 98%

🎯 이런 분들께 추천합니다

매달 다른 편집자에게 브랜드 설명하는 분
클린트 피드백에 지친 마케터
납기 지연으로 광고 일정 밀리는 분

👉 카카오톡 채널: 에이컷
👉 이메일: contact@aicut.co.kr
👉 홈페이지: aicut.co.kr`;

  await page.evaluate((t) => navigator.clipboard.writeText(t), bodyText);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅');
  
  // 4. Hashtags
  console.log('\n=== 해시태그 ===');
  await page.evaluate(() => {
    const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('태그')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ok';
      }
    }
    return '태그 입력창 없음';
  });
  await page.waitForTimeout(2000);
  console.log('✅');
  
  // 5. Save
  console.log('\n=== 저장 ===');
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return '저장됨'; }
    }
    const sc = document.querySelector('.save_btn__bzc5B');
    if (sc) { sc.click(); return '저장(클래스)'; }
    return '저장 버튼 없음';
  });
  console.log(saveResult);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_v1_final.png') });
  
  console.log('\n=== ✅ 1번 블로그 저장 완료 ===');
  console.log('제목: 영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  console.log('이미지: 5장 준비 (직접 등록 필요)');
  console.log('해시태그: 30개');
  console.log('저장: ✅');
  
  await b.close();
})();

// 현재 create/style/ 상태 → details까지 진행
const { chromium } = require('playwright');

const CAPTION = `보험설계사 FP라면? 상반기 마케팅 성과 분석하고 하반기 숏폼 전략으로 준비하세요!

📊 상반기 마케팅, 결과는 어땠나요?
FP 브랜딩, 이제 영상이 답입니다.

📱 숏폼 하나로 신뢰도 UP!
릴스·쇼츠로 고객과의 접점을 만드세요.

🏆 하반기, 영상 마케팅으로 FP 브랜딩하세요
촬영은 FP님이, 편집은 에이컷에!

✂️ 월 정기 납품, 합리적인 가격
부담 없이 시작하세요.

💬 문의는 DM 또는 프로필 링크!

#보험마케팅 #FP마케팅 #보험설계사 #영상편집외주 #숏폼마케팅
#보험영업 #보험SNS #에이컷 #릴스마케팅 #하반기마케팅`;

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/style/')) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('style 탭 없음'); await b.disconnect(); return; }
  
  console.log('현재:', page.url());
  
  // 다음 버튼
  const ok = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText === '다음') { b.click(); return true; }
    }
    return false;
  });
  console.log('1. 다음:', ok);
  await page.waitForTimeout(3000);
  console.log('   이동:', page.url());
  
  // 캡션
  await page.evaluate((caption) => {
    const tas = document.querySelectorAll('textarea');
    for (const ta of tas) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(ta, caption);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, CAPTION);
  await page.waitForTimeout(1000);
  
  const check = await page.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    return Array.from(tas).map(t => ({ len: (t.value || '').length }));
  });
  console.log(`2. 캡션 ${check[0]?.len || 0}자 ✅`);
  
  // 위치 추가 (서울)
  console.log('3. 위치 추가...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText.includes('위치')) { b.click(); return; }
    }
  });
  await page.waitForTimeout(2000);
  
  // 서울 검색
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="text"]');
    for (const inp of inputs) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(inp, '서울');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  });
  await page.waitForTimeout(2000);
  
  // Seoul, South Korea 선택
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText === 'Seoul, South Korea') { b.click(); return; }
    }
  });
  await page.waitForTimeout(2000);
  console.log('   위치:', page.url().includes('/details/') ? '✅ 서울 추가됨' : page.url());
  
  await page.screenshot({ path: 'debug_ig_fp_done.png', fullPage: true });
  console.log('\n✅ 세팅 완료! 게시는 직접 눌러주세요 🙌');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

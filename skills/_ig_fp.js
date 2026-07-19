// 보험사 IG 캐러셀 — 이미지 5장 한번에 업로드
const { chromium } = require('playwright');
const path = require('path');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const FILES = [
  path.join(W, 'aicut_blog_fp_main.png'),
  path.join(W, 'aicut_blog_fp_card1.png'),
  path.join(W, 'aicut_blog_fp_card2.png'),
  path.join(W, 'aicut_blog_fp_card3.png'),
  path.join(W, 'aicut_blog_fp_cta.png'),
];

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
  const p = await ctx.newPage();
  
  await p.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(2000);
  
  // 만들기
  const links = await p.$$('a');
  for (const l of links) {
    if ((await l.innerText()).trim() === '만들기') { await l.click(); break; }
  }
  await p.waitForTimeout(1500);
  
  // 게시물
  const all = await p.$$('a, button, [role="button"], span');
  for (const el of all) {
    try { if ((await el.innerText()).trim() === '게시물') { await el.click(); break; } } catch(e) {}
  }
  await p.waitForTimeout(1500);
  
  // 파일 업로드 — 여러 장
  const inputs = await p.$$('input[type="file"]');
  if (inputs.length) {
    await inputs[0].setInputFiles(FILES);
    console.log(`1. 이미지 ${FILES.length}장 업로드 ✅`);
  }
  await p.waitForTimeout(5000);
  
  // 다음 2번
  for (let i = 0; i < 2; i++) {
    const ok = await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText === '다음') { b.click(); return true; }
      }
      return false;
    });
    console.log(`   다음${i+1}: ${ok}`);
    await p.waitForTimeout(3000);
  }
  
  console.log('   URL:', p.url());
  
  // 캡션
  await p.evaluate((caption) => {
    const tas = document.querySelectorAll('textarea');
    for (const ta of tas) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(ta, caption);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }, CAPTION);
  await p.waitForTimeout(1000);
  
  const check = await p.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    return Array.from(tas).map(t => ({ len: (t.value || '').length }));
  });
  console.log(`2. 캡션 입력 ✅ (${check[0]?.len || 0}자)`);
  
  await p.screenshot({ path: 'debug_ig_fp_ready.png', fullPage: true });
  console.log('\n✅ 보험사 IG 세팅 완료! 공유는 안 했습니다.');
  console.log('브라우저에서 확인하시고 "공유"만 클릭하세요.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

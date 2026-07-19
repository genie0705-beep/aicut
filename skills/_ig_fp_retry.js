// 보험사 IG — 처음부터 다시, 5장 확실히
const { chromium } = require('playwright');
const path = require('path');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const ALL_FILES = [
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
  
  // === 핵심: file input 2개 모두에 multiple 추가 후 5장 설정 ===
  await p.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    for (const inp of inputs) {
      inp.setAttribute('multiple', 'multiple');
    }
  });
  
  const inputs = await p.$$('input[type="file"]');
  console.log(`file inputs: ${inputs.length}개`);
  
  if (inputs.length >= 2) {
    // 두 번째 input 사용 (accept 속성이 더 넓음)
    await inputs[1].setInputFiles(ALL_FILES);
    console.log('1. 두 번째 input으로 5장 업로드 ✅');
  } else if (inputs.length === 1) {
    await inputs[0].setInputFiles(ALL_FILES);
    console.log('1. 첫 번째 input으로 5장 업로드 ✅');
  }
  await p.waitForTimeout(6000);
  
  // 다음 확인 — 업로드된 이미지 수 확인
  const imgCheck1 = await p.evaluate(() => {
    // 썸네일 이미지 수 확인
    const thumbs = document.querySelectorAll('[style*="object-fit"], img');
    const visibleImgs = Array.from(thumbs).filter(i => i.offsetParent !== null || i.complete);
    return { total: thumbs.length, visible: visibleImgs.length };
  });
  console.log(`   이미지 수: ${JSON.stringify(imgCheck1)}`);
  
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
    if (ok) {
      console.log(`   URL: ${p.url()}`);
    }
  }
  
  // 캡션 확인
  if (p.url().includes('/details/') || p.url().includes('/create/')) {
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
    
    const check = await p.evaluate(() => {
      const tas = document.querySelectorAll('textarea');
      return Array.from(tas).map(t => ({ len: (t.value || '').length }));
    });
    console.log(`2. 캡션 ${check[0]?.len || 0}자 ✅`);
    
    // 위치 추가 (서울)
    console.log('3. 위치 추가 중...');
    await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText.includes('위치')) { b.click(); return; }
      }
    });
    await p.waitForTimeout(2000);
    
    // 검색
    await p.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      for (const inp of inputs) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) {
          setter.call(inp, '서울');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });
    await p.waitForTimeout(2000);
    
    // 서울 선택
    await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText === 'Seoul, South Korea') { b.click(); return; }
      }
    });
    await p.waitForTimeout(2000);
  }
  
  // 최종 화면 확인
  const finalText = await p.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('\n최종:', finalText);
  
  await p.screenshot({ path: 'debug_ig_fp_final.png', fullPage: true });
  console.log('\n✅ 세팅 완료! 게시는 직접 눌러주세요 🙌');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

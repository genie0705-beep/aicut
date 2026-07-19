// 인스타그램 — 한 장씩 순차 추가 (select 화면)
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
  
  // === 1장만 업로드 ===
  const inputs = await p.$$('input[type="file"]');
  if (inputs.length) {
    await inputs[0].setInputFiles([ALL_FILES[0]]);
    console.log('1. 1장 업로드 ✅');
  }
  await p.waitForTimeout(5000);
  console.log('   URL:', p.url());
  
  // === 한 장씩 추가 (select/ 페이지에서) ===
  // URL이 create/style/ 이면 create/select/으로 가기 위해 뒤로 갈 필요 없음
  // create/style/에서 추가 버튼이 있는지 확인
  
  for (let i = 1; i < ALL_FILES.length; i++) {
    console.log(`\n2-${i}. ${i+1}번째 이미지 추가...`);
    
    // + 버튼 찾기 (하단 썸네일 영역)
    const fcPromise = p.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    
    const addResult = await p.evaluate(() => {
      // 1) button > svg (plus 아이콘)
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const svg = b.querySelector('svg');
        if (svg) {
          const label = svg.getAttribute('aria-label') || '';
          if (label.includes('추가') || label.includes('Add') || label.includes('plus') || label.includes('Plus')) {
            b.click();
            return 'svg 버튼: ' + label;
          }
        }
      }
      
      // 2) aria-label에 Add/plus 포함된 요소
      const all = document.querySelectorAll('[aria-label]');
      for (const el of all) {
        const label = el.getAttribute('aria-label') || '';
        if (label.includes('추가') || label.includes('Add') || label.includes('plus')) {
          el.click();
          return 'aria-label: ' + label;
        }
      }
      
      // 3) file input 직접 접근
      const inputs = document.querySelectorAll('input[type="file"]');
      if (inputs.length > 0) {
        // 새로운 파일 추가
        return 'file input exists: ' + inputs.length;
      }
      
      return '추가 버튼 없음';
    });
    console.log(`   ${addResult}`);
    
    await p.waitForTimeout(1500);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles([ALL_FILES[i]]);
      console.log(`   ✅ ${i+1}번째 이미지 추가됨`);
      await p.waitForTimeout(3000);
    } else {
      // input 직접 접근
      const currentInputs = await p.$$('input[type="file"]');
      if (currentInputs.length > 0) {
        try {
          await currentInputs[0].setInputFiles([...Array(i).fill(ALL_FILES[0]), ALL_FILES[i]]);
          console.log('   ⚠️ setInputFiles 시도');
          await p.waitForTimeout(3000);
        } catch(e) {
          console.log(`   ❌ 실패: ${e.message}`);
          break;
        }
      } else {
        console.log('   ❌ 더 이상 추가 불가');
        break;
      }
    }
  }
  
  // 이미지 수 확인
  const imgCount = await p.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    return Array.from(imgs).filter(i => i.offsetParent !== null && i.width > 100).length;
  });
  console.log(`\n3. 화면 내 이미지: 약 ${imgCount}개`);
  
  await p.screenshot({ path: 'debug_ig_fp_sequential.png', fullPage: true });
  console.log('\n✅ 완료!');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

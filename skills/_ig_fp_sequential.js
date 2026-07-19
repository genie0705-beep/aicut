// 보험사 IG — 한 장씩 순차 업로드
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

async function clickCreatePost(page) {
  // 1. 만들기
  const links = await page.$$('a');
  for (const l of links) {
    if ((await l.innerText()).trim() === '만들기') { await l.click(); return '만들기'; }
  }
  return null;
}

async function clickMenuItem(page, text) {
  const all = await page.$$('a, button, [role="button"], span, div[tabindex]');
  for (const el of all) {
    try {
      if ((await el.innerText()).trim() === text) { await el.click(); return true; }
    } catch(e) {}
  }
  return false;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(3000);
  
  // 만들기
  let r = await clickCreatePost(p);
  console.log('1. 만들기:', r);
  await p.waitForTimeout(2000);
  
  // 게시물
  r = await clickMenuItem(p, '게시물');
  console.log('2. 게시물:', r);
  await p.waitForTimeout(2000);
  
  // 파일 1장 업로드 (첫 번째)
  const inputs = await p.$$('input[type="file"]');
  if (inputs.length) {
    await inputs[0].setInputFiles([FILES[0]]);
    console.log('3. 1장 업로드 ✅');
  }
  await p.waitForTimeout(5000);
  
  console.log('   URL:', p.url());
  
  // 이미지가 crop 화면이면 + 버튼으로 추가
  for (let i = 1; i < FILES.length; i++) {
    console.log(`\n4-${i}. ${i+1}번째 이미지 추가 중...`);
    
    // + 버튼 찾기 (하단 이미지 썸네일 영역)
    const clicked = await p.evaluate(() => {
      // 모든 button 중 + 아이콘 찾기
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const svg = b.querySelector('svg');
        if (svg) {
          const label = svg.getAttribute('aria-label') || '';
          if (label.includes('추가') || label.includes('Add') || label.includes('plus')) {
            b.click();
            return 'svg aria-label: ' + label;
          }
        }
        // 텍스트에 "+" 포함
        if (b.innerText.includes('+') || b.innerText.includes('추가')) {
          b.click();
          return '텍스트: ' + b.innerText.slice(0,20);
        }
      }
      
      // file input 직접 찾기
      const inputs = document.querySelectorAll('input[type="file"]');
      for (const inp of inputs) {
        if (inp.getAttribute('multiple') !== null || inp.hasAttribute('multiple')) {
          return '이미 multiple input 있음';
        }
      }
      return '추가 버튼 없음';
    });
    console.log(`   ${clicked}`);
    
    await p.waitForTimeout(1500);
    
    // file chooser나 input으로 추가
    const fcPromise = p.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
    const currentInputs = await p.$$('input[type="file"]');
    
    let uploaded = false;
    if (currentInputs.length > 0) {
      // 이미 파일이 설정된 input이 있으면 새로운 input을 찾거나
      await currentInputs[0].setInputFiles([...currentInputs.length > 0 ? [FILES[0]] : [], FILES[i]]);
      // 위 방식은 안 됨. 파일 추가가 아니라 교체됨
    }
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles([FILES[i]]);
      uploaded = true;
      console.log(`   ✅ ${i+1}번째 이미지 추가됨`);
    } else {
      console.log(`   ❌ 파일 추가 실패`);
      break;
    }
    
    await p.waitForTimeout(3000);
  }
  
  await p.waitForTimeout(3000);
  
  // 이미지 개수 확인
  const imgCount = await p.evaluate(() => {
    // 썸네일 이미지 수 (하단 filmstrip)
    const imgs = document.querySelectorAll('[role="list"] img, img[alt*="썸네일"], img[style*="thumbnail"]');
    return imgs.length;
  });
  console.log(`\n5. 총 이미지: ${imgCount}장`);
  
  console.log('   URL:', p.url());
  
  await p.screenshot({ path: 'debug_ig_fp_step.png', fullPage: true });
  
  await b.disconnect();
  console.log('\n✅ 현재 상태 확인 완료');
}

main().catch(e => console.error('❌', e.message));

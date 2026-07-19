// 보험사 IG — 새롭게, 확실하게 5장
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
  await p.waitForTimeout(2000);
  
  // === file input 확실하게 multiple로 만들기 ===
  await p.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    for (const inp of inputs) {
      // property + attribute 모두 설정
      inp.multiple = true;
      inp.setAttribute('multiple', '');
      
      // React가 감지하도록 속성 변경 이벤트 발생
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'multiple'
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(inp, true);
      }
      
      // dataset에도 표시
      inp.dataset.multiple = 'true';
    }
  });
  
  // file chooser로 5장 업로드 (file chooser 이벤트 활용)
  const fcPromise = p.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
  
  // file input이 이미 있으므로 직접 click() 트리거
  const inputs = await p.$$('input[type="file"]');
  console.log(`file inputs: ${inputs.length}개`);
  
  if (inputs.length > 0) {
    // file input이 보이지 않아도 click 가능하도록 JavaScript로 클릭
    await p.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="file"]');
      // 두 번째 input 사용 (확장된 accept)
      const target = inputs.length > 1 ? inputs[1] : inputs[0];
      target.click();
    });
    
    await p.waitForTimeout(2000);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(ALL_FILES);
      console.log(`✅ file chooser로 ${ALL_FILES.length}장 설정`);
    } else {
      // fallback: 직접 setInputFiles
      if (inputs.length > 1) {
        await inputs[1].setInputFiles(ALL_FILES);
      } else {
        await inputs[0].setInputFiles(ALL_FILES);
      }
      console.log(`✅ setInputFiles로 ${ALL_FILES.length}장 설정`);
    }
  }
  
  await p.waitForTimeout(6000);
  
  // URL 확인
  console.log('URL:', p.url());
  
  // 이미지 썸네일 수 확인
  const thumbCheck = await p.evaluate(() => {
    // 하단 filmstrip 영역 확인
    const filmstrip = document.querySelector('[role="list"], [role="listbox"], [class*="filmstrip"]');
    const thumbs = document.querySelectorAll('img[style*="object-fit"], img[alt*="썸네일"], img[src*="blob"]');
    return {
      filmstripExists: !!filmstrip,
      filmstripChildren: filmstrip ? filmstrip.children.length : 0,
      thumbImages: thumbs.length,
      visibleImages: Array.from(document.querySelectorAll('img')).filter(i => i.offsetParent !== null && i.width > 50).length,
    };
  });
  console.log('썸네일:', JSON.stringify(thumbCheck));
  
  // 화면에 "다음" 있으면 → details로 진행
  if (p.url().includes('/create/style/') || p.url().includes('/create/select/')) {
    // "다음" 버튼
    const nextOk = await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText === '다음') { b.click(); return true; }
      }
      return false;
    });
    console.log('다음:', nextOk);
    await p.waitForTimeout(3000);
  }
  
  console.log('URL:', p.url());
  
  // details 화면이면 캡션 + 위치
  if (p.url().includes('/details/')) {
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
    console.log('캡션 입력 ✅');
    await p.waitForTimeout(1000);
    
    // 위치
    await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText.includes('위치')) { b.click(); return; }
      }
    });
    await p.waitForTimeout(1500);
    
    await p.evaluate(() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      for (const inp of inputs) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) { setter.call(inp, '서울'); inp.dispatchEvent(new Event('input', { bubbles: true })); }
      }
    });
    await p.waitForTimeout(1500);
    
    await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText === 'Seoul, South Korea') {
          b.click(); return;
        }
        // "서울 - Seoul"도 시도
        if (b.innerText === '서울 - Seoul') {
          b.click(); return;
        }
      }
    });
    await p.waitForTimeout(1500);
  }
  
  await p.screenshot({ path: 'debug_ig_fp_fresh.png', fullPage: true });
  
  const finalText = await p.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('\n최종:', finalText);
  
  console.log('\n✅ 새로 작성 완료! 게시는 직접 눌러주세요 🙌');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

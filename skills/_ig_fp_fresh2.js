// create URL 직접 이동 방식
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
  
  // create URL로 직접 이동
  await p.goto('https://www.instagram.com/create/select/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(3000);
  
  console.log('직접 접속:', p.url());
  
  // 리다이렉트되었는지 확인
  if (p.url().includes('/aicut.official/') || p.url().includes('instagram.com/') && !p.url().includes('/create/')) {
    console.log('→ 로그인 페이지로 리다이렉트됨. 프로필에서 다시 시도');
    // 프로필 페이지에서 만들기 → 게시물
    await p.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(2000);
    
    // 만들기 버튼 (nav 링크)
    const navLinks = await p.$$('nav a, header a, [role="navigation"] a');
    for (const l of navLinks) {
      try {
        const text = await l.innerText();
        if (text.trim() === '만들기') { 
          await l.click(); 
          console.log('만들기 클릭');
          break; 
        }
      } catch(e) {}
    }
    await p.waitForTimeout(2000);
    
    // 게시물 — 모든 span, div, button 검색
    console.log('게시물 검색...');
    await p.evaluate(() => {
      // span 태그 중 "게시물" 텍스트 가진 것 찾기
      const spans = document.querySelectorAll('span');
      for (const s of spans) {
        if (s.innerText === '게시물') {
          const parent = s.closest('a, button, [role="button"], div[tabindex]');
          if (parent) { parent.click(); return; }
          s.click(); return;
        }
      }
      // div 전체 검색
      const all = document.querySelectorAll('a, button, [role="button"]');
      for (const el of all) {
        if (el.innerText?.trim() === '게시물') { el.click(); return; }
      }
    });
    
    await p.waitForTimeout(2000);
    console.log('URL:', p.url());
  }
  
  // file input 확인
  const inputInfo = await p.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    return inputs.length > 0 ? `${inputs.length}개 발견` : '없음';
  });
  console.log('file input:', inputInfo);
  
  // file input에 multiple 확실히 설정
  await p.evaluate(() => {
    const inputs = document.querySelectorAll('input[type="file"]');
    for (const inp of inputs) {
      inp.multiple = true;
      inp.setAttribute('multiple', 'multiple');
    }
  });
  
  // file chooser로 업로드
  const fcPromise = p.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
  
  // file input click
  const inputs = await p.$$('input[type="file"]');
  if (inputs.length > 0) {
    // 두 번째 input (확장된 accept)
    const target = inputs.length > 1 ? inputs[1] : inputs[0];
    await target.evaluate(el => el.click());
    await p.waitForTimeout(2000);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(ALL_FILES);
      console.log(`✅ ${ALL_FILES.length}장 업로드!`);
    } else {
      console.log('⚠️ file chooser 없음, 직접 설정');
      await target.setInputFiles(ALL_FILES);
    }
  }
  
  await p.waitForTimeout(6000);
  console.log('결과 URL:', p.url());
  
  const screenText = await p.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('화면:', screenText);
  
  // create/style/ 이면 → "다음"
  if (p.url().includes('/create/style/') || p.url().includes('/create/select/')) {
    const nextOk = await p.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText === '다음') { b.click(); return true; }
      }
      return false;
    });
    console.log('다음:', nextOk);
    await p.waitForTimeout(3000);
    console.log('이동:', p.url());
    
    // details면 캡션 + 위치
    if (p.url().includes('/details/')) {
      await p.evaluate((c) => {
        const tas = document.querySelectorAll('textarea');
        for (const ta of tas) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
          if (setter) { setter.call(ta, c); ta.dispatchEvent(new Event('input', { bubbles: true })); }
        }
      }, CAPTION);
      console.log('캡션 ✅');
      await p.waitForTimeout(1000);
      
      // 위치
      await p.evaluate(() => {
        document.querySelectorAll('button').forEach(b => { if (b.innerText.includes('위치')) b.click(); });
      });
      await p.waitForTimeout(1500);
      await p.evaluate(() => {
        document.querySelectorAll('input[type="text"]').forEach(inp => {
          const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (s) { s.call(inp, '서울'); inp.dispatchEvent(new Event('input', { bubbles: true })); }
        });
      });
      await p.waitForTimeout(1500);
      await p.evaluate(() => {
        document.querySelectorAll('button').forEach(b => { if (b.innerText === 'Seoul, South Korea') b.click(); });
      });
      await p.waitForTimeout(1500);
      console.log('위치 ✅');
    }
  }
  
  await p.screenshot({ path: 'debug_ig_fp_fresh2.png', fullPage: true });
  console.log('\n✅ 새로 작성 완료! 게시는 직접 눌러주세요 🙌');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

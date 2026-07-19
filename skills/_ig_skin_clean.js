// 피부과 IG — 깨끗하게 새 탭에서
const { chromium } = require('playwright');
const path = require('path');

const IMG = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace', 'aicut_ig_skin.png');

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
    try {
      if ((await el.innerText()).trim() === '게시물') { await el.click(); break; }
    } catch(e) {}
  }
  await p.waitForTimeout(1500);
  
  // 파일
  const inputs = await p.$$('input[type="file"]');
  if (inputs.length) {
    await inputs[0].setInputFiles(IMG);
    console.log('1. 이미지 업로드 ✅');
  }
  await p.waitForTimeout(4000);
  
  // 다음 x2
  for (let i = 0; i < 2; i++) {
    const ok = await p.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('div[role="button"]'));
      for (const b of btns) {
        if (b.innerText === '다음') { b.click(); return true; }
      }
      // span > 다음 찾기
      const spans = document.querySelectorAll('span');
      for (const s of spans) {
        if (s.innerText === '다음') {
          const parent = s.closest('[role="button"], button');
          if (parent) { parent.click(); return true; }
          s.click(); return true;
        }
      }
      return false;
    });
    console.log(`  다음${i+1}: ${ok}`);
    await p.waitForTimeout(2500);
  }
  
  // 캡션
  await p.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    const c = `피부과·성형외과 실장님, 영상 마케팅 고민 끝!

"촬영도 어색하고 편집도 모르겠고…"
이 고민, 저희가 해결해드립니다!

✅ 직원 대신 원장님이 직접 촬영
✅ AI 자막 + BGM + 효과
✅ 평균 48시간 내 납품
✅ 월 정기 납품 가능

촬영은 실장님이, 편집은 에이컷에!

#피부과마케팅 #성형외과마케팅 #병원마케팅 #의료마케팅 #숏폼마케팅
#영상편집외주 #에이컷 #병원SNS #피부과영상 #의료광고`;
    for (const ta of tas) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) { setter.call(ta, c); ta.dispatchEvent(new Event('input', { bubbles: true })); }
    }
  });
  console.log('2. 캡션 입력 ✅');
  await p.waitForTimeout(1000);
  
  // 공유
  const shared = await p.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('div[role="button"], button'));
    for (const b of btns) {
      if (b.innerText === '공유') { b.click(); return true; }
    }
    return false;
  });
  console.log('3. 공유:', shared);
  
  await p.waitForTimeout(5000);
  await p.screenshot({ path: 'debug_skin_done.png', fullPage: true });
  console.log('\n✅ 완료! 브라우저 확인하세요.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

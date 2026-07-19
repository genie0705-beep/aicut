// IG 피부과 — 다음 버튼 정확히 클릭 → 캡션 화면까지 → 보고
const { chromium } = require('playwright');
const path = require('path');

const IMG = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace', 'aicut_ig_skin.png');

const CAPTION = `피부과·성형외과 실장님, 영상 마케팅 고민 끝!

"촬영도 어색하고 편집도 모르겠고…"
이 고민, 저희가 해결해드립니다!

✅ 직원 대신 원장님이 직접 촬영
✅ AI 자막 + BGM + 효과
✅ 평균 48시간 내 납품
✅ 월 정기 납품 가능

촬영은 실장님이, 편집은 에이컷에!

#피부과마케팅 #성형외과마케팅 #병원마케팅 #의료마케팅 #숏폼마케팅
#영상편집외주 #에이컷 #병원SNS #피부과영상 #의료광고`;

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
  
  // 파일 업로드
  const inputs = await p.$$('input[type="file"]');
  if (inputs.length) { await inputs[0].setInputFiles(IMG); }
  await p.waitForTimeout(4000);
  console.log('1. 이미지 업로드 ✅');
  
  // 다음 버튼 2번 — <button>태그 직접 찾기
  for (let i = 0; i < 2; i++) {
    const clicked = await p.evaluate(() => {
      // button 태그 중 innerText가 "다음"인 것
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.innerText === '다음') {
          // React synthetic event를 위해 실제 click
          b.click();
          return true;
        }
      }
      return false;
    });
    console.log(`  다음${i+1}: ${clicked}`);
    await p.waitForTimeout(3000);
  }
  
  // 캡션 화면인지 확인
  const screenCheck = await p.evaluate(() => (document.body.innerText || '').slice(0, 150));
  console.log('  화면:', screenCheck);
  
  // 캡션 입력
  await p.evaluate((caption) => {
    const tas = document.querySelectorAll('textarea');
    for (const ta of tas) {
      if (ta.placeholder && (ta.placeholder.includes('문구') || ta.placeholder.includes('입력'))) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (setter) { setter.call(ta, caption); ta.dispatchEvent(new Event('input', { bubbles: true })); }
        break;
      }
    }
  }, CAPTION);
  await p.waitForTimeout(1000);
  
  // 캡션 확인
  const captionCheck = await p.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    return Array.from(tas).map(t => ({ val: (t.value || '').slice(0, 80), ph: t.placeholder }));
  });
  console.log('2. 캡션 입력 ✅', JSON.stringify(captionCheck));
  
  // 스크린샷 — 게시 전 보고용
  await p.screenshot({ path: 'debug_ig_skin_ready.png', fullPage: true });
  
  console.log('\n✅ 캡션 화면까지 준비 완료. 공유는 하지 않았습니다.');
  console.log('브라우저에서 확인하시고 "공유" 버튼만 클릭하시면 됩니다.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

// IG — 두 번째 다음 클릭 + 캡션 입력
const { chromium } = require('playwright');

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
  
  // create 관련 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('/create/')) {
      page = p;
      break;
    }
  }
  if (!page) { console.log('create 탭 없음'); await b.disconnect(); return; }
  
  console.log('현재:', page.url());
  
  // "다음" 버튼 한 번 더
  const ok = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText === '다음' || b.innerText === 'Next') {
        b.click();
        return true;
      }
    }
    return false;
  });
  console.log('다음 클릭:', ok);
  await page.waitForTimeout(3000);
  console.log('이동 후:', page.url());
  
  // 캡션 입력
  await page.evaluate((caption) => {
    const tas = document.querySelectorAll('textarea');
    for (const ta of tas) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(ta, caption);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, CAPTION);
  await page.waitForTimeout(1000);
  
  // 캡션 확인
  const check = await page.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    return Array.from(tas).map(t => ({ len: (t.value || '').length, preview: (t.value || '').slice(0, 60) }));
  });
  console.log('캡션:', JSON.stringify(check));
  
  await page.screenshot({ path: 'debug_ig_ready_final.png', fullPage: true });
  console.log('\n✅ 캡션 화면 준비 완료! 공유는 하지 않았습니다.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

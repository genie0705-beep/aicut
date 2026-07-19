// IG 피부과 — 다음 버튼 상세 진단 + 캡션 화면까지
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
  
  // 새 탭
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
  
  // 다음 버튼 DEBUG — 모든 버튼/클릭 가능 요소 출력
  console.log('\n=== 화면 내 모든 버튼/클릭가능 요소 분석 ===');
  const btnInfo = await p.evaluate(() => {
    const result = [];
    
    // 모든 요소 중 상호작용 가능한 것들
    document.querySelectorAll('button, a, [role="button"], [onclick], div[tabindex], span[role="link"]').forEach(el => {
      const tag = el.tagName;
      const text = (el.innerText || '').trim().slice(0, 30);
      const role = el.getAttribute('role') || '';
      const cls = (typeof el.className === 'string' ? el.className : '').slice(0, 50);
      const aria = el.getAttribute('aria-label') || '';
      const type = el.getAttribute('type') || '';
      
      if (text || aria) {
        result.push({ tag, text, role, cls, aria: aria.slice(0, 30), type });
      }
    });
    
    return result.slice(0, 40);
  });
  
  btnInfo.forEach(b => console.log(`  ${b.tag} | "${b.text}" | role=${b.role} | aria=${b.aria} | type=${b.type} | cls=${b.cls}`));
  
  // SVG 확인
  console.log('\n=== SVG aria-label 탐색 ===');
  const svgInfo = await p.evaluate(() => {
    return Array.from(document.querySelectorAll('svg[aria-label]')).map(s => ({
      label: s.getAttribute('aria-label'),
      parentTag: s.parentElement?.tagName,
      parentRole: s.parentElement?.getAttribute('role'),
    }));
  });
  svgInfo.forEach(s => console.log(`  svg aria="${s.label}" parent=${s.parentTag} role=${s.parentRole}`));
  
  await p.screenshot({ path: 'debug_ig_next_debug.png', fullPage: true });
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

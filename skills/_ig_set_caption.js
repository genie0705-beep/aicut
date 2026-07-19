// 캡션 화면에서 textarea 찾아 입력
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
  
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com/create')) {
      page = p;
      console.log('create 탭 발견:', p.url());
      break;
    }
  }
  if (!page) {
    console.log('create 탭 없음');
    await b.disconnect();
    return;
  }
  
  // 모든 textarea/입력 필드 진단
  const inputInfo = await page.evaluate(() => {
    const result = [];
    // 모든 textarea
    document.querySelectorAll('textarea').forEach(el => {
      result.push({
        tag: 'textarea',
        id: el.id,
        placeholder: el.getAttribute('placeholder') || '(none)',
        'aria-label': el.getAttribute('aria-label') || '(none)',
        valueLen: (el.value || '').length,
        rows: el.getAttribute('rows'),
        cls: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
      });
    });
    // 모든 contenteditable
    document.querySelectorAll('[contenteditable]').forEach(el => {
      result.push({
        tag: el.tagName,
        id: el.id,
        placeholder: el.getAttribute('placeholder') || '(none)',
        'aria-label': el.getAttribute('aria-label') || '(none)',
        text: (el.innerText || '').slice(0, 40),
        role: el.getAttribute('role'),
      });
    });
    // 모든 input[type="text"]
    document.querySelectorAll('input[type="text"]').forEach(el => {
      result.push({
        tag: 'input',
        id: el.id,
        placeholder: el.getAttribute('placeholder') || '(none)',
        'aria-label': el.getAttribute('aria-label') || '(none)',
        value: (el.value || '').slice(0, 40),
      });
    });
    return result;
  });
  
  console.log('=== 입력 필드 ===');
  inputInfo.forEach(i => console.log(`  ${i.tag} | placeholder="${i.placeholder}" | aria="${i['aria-label']}" | valLen=${i.valueLen}`));
  
  // 캡션 입력 시도
  for (const info of inputInfo) {
    if (info.tag === 'textarea' && info.valueLen === 0) {
      console.log('\n→ textarea 발견, 캡션 입력');
      await page.evaluate((caption) => {
        const tas = document.querySelectorAll('textarea');
        for (const ta of tas) {
          if (!ta.value || ta.value.length === 0) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
            if (setter && setter.set) {
              setter.set.call(ta, caption);
              ta.dispatchEvent(new Event('input', { bubbles: true }));
              ta.dispatchEvent(new Event('change', { bubbles: true }));
            }
            break;
          }
        }
      }, CAPTION);
      await page.waitForTimeout(1000);
      break;
    }
  }
  
  // 캡션 확인
  const check = await page.evaluate(() => {
    const tas = document.querySelectorAll('textarea');
    return Array.from(tas).map(t => ({ valLen: (t.value || '').length, preview: (t.value || '').slice(0, 50) }));
  });
  console.log('캡션 결과:', JSON.stringify(check));
  
  await page.screenshot({ path: 'debug_ig_caption_ready.png', fullPage: true });
  console.log('\n✅ 준비 완료. 브라우저 확인 바랍니다.');
  
  await b.disconnect();
}

main().catch(e => console.error('❌', e.message));

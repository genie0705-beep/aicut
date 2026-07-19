// 인스타그램 업로드 — 전체 플로우 완성
const { chromium } = require('playwright');
const path = require('path');

const WORKSPACE = path.join('C:', 'Users', 'paul', '.openclaw', 'workspace');
const IMG_FILE = path.join(WORKSPACE, 'aicut_blog_realestate_main.png');

const CAPTION = `부동산 중개사무소, 매물 영상 하나로 계약률이 달라집니다!

🏢 요즘 사진만 올리면 문의가 안 온다는 말,
공감하시는 분들 많으시죠?

고객들은 이제 영상을 원합니다.
매물 영상을 올린 중개사무소는
문의량이 평균 2~3배 증가했다고 해요.

📱 릴스·쇼츠 하나로 문의량 3배!
숏폼 마케팅, 더 이상 선택이 아닌 필수입니다.

🏗️ 하반기 분양 시즌, 지금부터 영상으로 준비하세요

✂️ 촬영은 직접 하고, 편집은 에이컷에 맡기세요
월 정기 납품, 합리적인 가격

💬 문의는 DM 또는 프로필 링크 클릭!

#부동산마케팅 #부동산영상 #공인중개사 #매물영상 #숏폼마케팅
#영상편집외주 #에이컷 #부동산SNS #릴스마케팅 #분양마케팅`;

async function clickButton(page, text) {
  const btns = await page.$$('button, div[role="button"], a, span');
  for (const btn of btns) {
    try {
      const t = (await btn.innerText()).trim();
      if (t === text) {
        await btn.click();
        return true;
      }
    } catch (e) {}
  }
  return false;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Instagram 탭 (이미 프로필 페이지)
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com') && !p.url().includes('/create/')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  
  console.log('1️⃣ 만들기 → 게시물 → 이미지 선택');
  
  // 만들기 버튼
  const links = await page.$$('a');
  for (const link of links) {
    const t = await link.innerText();
    if (t.trim() === '만들기') { await link.click(); break; }
  }
  await page.waitForTimeout(1500);
  
  // 게시물 선택
  await clickButton(page, '게시물');
  await page.waitForTimeout(1500);
  
  // hidden input으로 파일 설정
  const fileInputs = await page.$$('input[type="file"]');
  if (fileInputs.length > 0) {
    await fileInputs[0].setInputFiles(IMG_FILE);
    console.log('  ✅ 이미지 업로드됨');
  }
  await page.waitForTimeout(4000);
  
  console.log('2️⃣ 다음(자르기 스킵)');
  // "다음" 버튼 2번 클릭 (자르기 + 필터)
  for (let i = 0; i < 2; i++) {
    const nextBtns = await page.$$('div[role="button"]');
    let clicked = false;
    for (const btn of nextBtns) {
      const t = await btn.innerText();
      if (t.trim() === '다음') {
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // fallback: 모든 button 태그 검색
      await clickButton(page, '다음');
    }
    await page.waitForTimeout(2000);
  }
  
  console.log('3️⃣ 캡션 입력');
  await page.waitForTimeout(1000);
  
  // 캡션 텍스트 입력
  await page.evaluate((caption) => {
    // Instagram의 캡션 입력 영역
    const textareas = document.querySelectorAll('textarea, div[role="textbox"], [contenteditable]');
    for (const ta of textareas) {
      const placeholder = ta.getAttribute('placeholder') || '';
      if (placeholder.includes('문구') || placeholder.includes('입력') || !ta.value?.length) {
        // React controlled input → value + events
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;
        if (nativeInputValueSetter && ta.tagName === 'TEXTAREA') {
          nativeInputValueSetter.call(ta, caption);
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          ta.focus();
          // execCommand 사용
          document.execCommand('insertText', false, caption);
        }
        return;
      }
    }
  }, CAPTION);
  
  console.log('  ✅ 캡션 입력됨');
  await page.waitForTimeout(2000);
  
  console.log('4️⃣ 위치 설정 (서울)');
  // 위치 추가 버튼 찾기
  const allElements = await page.$$('div[role="button"], button, span');
  for (const el of allElements) {
    const t = await el.innerText();
    if (t.includes('위치') || t.includes('Location')) {
      await el.click();
      console.log('  ✅ 위치 버튼 클릭');
      break;
    }
  }
  await page.waitForTimeout(2000);
  
  // 위치 검색 input
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if (inp.type === 'text' || inp.type === 'search') {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set;
        if (nativeSetter) {
          nativeSetter.call(inp, '서울');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }
    }
  });
  await page.waitForTimeout(2000);
  
  // 검색 결과에서 "서울, 대한민국" 선택
  const locationItems = await page.$$('div[role="button"], div[role="option"]');
  for (const item of locationItems) {
    const t = await item.innerText();
    if (t.includes('서울') && t.includes('대한민국')) {
      await item.click();
      console.log('  ✅ 서울 선택');
      break;
    }
  }
  await page.waitForTimeout(1000);
  
  console.log('5️⃣ 공유');
  // "공유" 버튼 찾기
  const shareBtns = await page.$$('div[role="button"]');
  let shared = false;
  for (const btn of shareBtns) {
    const t = await btn.innerText();
    if (t.trim() === '공유') {
      await btn.click();
      shared = true;
      console.log('  ✅ 공유 클릭!');
      break;
    }
  }
  if (!shared) {
    // button 태그도 검색
    shared = await clickButton(page, '공유');
    if (shared) console.log('  ✅ 공유 버튼 클릭 (fallback)');
  }
  
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'debug_ig_done.png', fullPage: true });
  
  // 최종 결과 확인
  const finalText = await page.evaluate(() => (document.body.innerText || '').slice(0, 200));
  console.log('\n최종 화면:', finalText);
  
  await b.disconnect();
  console.log('\n✅ 인스타그램 업로드 프로세스 완료!');
}

main().catch(e => console.error('❌', e.message));

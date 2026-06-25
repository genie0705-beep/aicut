const { chromium } = require('playwright');
const path = require('path');

const CDP_PORT = 9224;
const IMG_PATH = path.join(__dirname, 'insta_h2_thumb.png');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

const CAPTION = `📅 하반기 마케팅, 지금 준비하세요

"릴스 조회수는 괜찮은데 문의가 안 늘어요"
"AI 영상 툴 써봤는데 오히려 시간만 더 갔어요"
"하반기 예산 짜야 하는데 영상은 어떻게 할지..."

6월, 상반기가 끝나가고 있어요.
지금이 영상 편집 외주사를 정할 가장 완벽한 타이밍입니다 🎯

✅ 하반기 물량 선점 — 7~8월 성수기 대비
✅ 꾸준함이 경쟁력 — 릴스 알고리즘은 꾸준함에 가중치
✅ 시행착오 줄일 시간 — 7월 전에 워크플로우 안정화

👉 블로그에서 자세한 내용 확인하세요 (프로필 링크)

#하반기마케팅 #영상편집외주 #숏폼마케팅 #릴스알고리즘
#AI영상편집 #영상마케팅 #에이컷 #AICUT #콘텐츠마케팅
#인스타마케팅 #SNS마케팅 #마케팅전략 #하반기준비`;

(async () => {
  console.log('=== 인스타그램 포스팅 시작 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 인스타그램 페이지 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('instagram.com') && !p.url().includes('accounts')) {
      page = p;
      break;
    }
  }

  if (!page) {
    console.log('❌ 인스타그램 페이지 없음. 새로 엽니다.');
    page = await ctx.newPage();
    await page.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(3000);
  } else {
    console.log('✅ 기존 인스타그램 페이지 사용:', page.url().substring(0, 60));
  }

  await page.bringToFront();
  await sleep(2000);

  // 알림창 처리
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  // 1. 인스타 홈으로 이동
  console.log('1. 인스타 홈으로 이동...');
  try {
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch(e) {}
  await sleep(3000);

  // 2. 새 게시물 만들기
  console.log('2. 새 게시물 만들기 버튼 클릭...');
  const createClicked = await page.evaluate(() => {
    // SVG title "새로운 게시물" 찾기
    for (const svg of document.querySelectorAll('svg')) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
        const btn = svg.closest('a') || svg.closest('button') || svg.closest('[role="button"]');
        if (btn) { btn.click(); return true; }
      }
    }
    // plus 아이콘 찾기
    const plusIcon = document.querySelector('svg[aria-label="새로운 게시물"], svg[aria-label="New post"]');
    if (plusIcon) {
      const btn = plusIcon.closest('a') || plusIcon.closest('button') || plusIcon.closest('[role="button"]');
      if (btn) { btn.click(); return true; }
    }
    return false;
  });
  console.log('   만들기:', createClicked ? '✅' : '❌');
  
  if (!createClicked) {
    console.log('   만들기 버튼을 찾을 수 없습니다. 인스타그램 UI가 변경되었을 수 있습니다.');
    await b.close();
    return;
  }
  await sleep(2000);

  // 3. "게시물" 옵션 선택
  console.log('3. 게시물 옵션 선택...');
  const postOpt = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('button, [role="button"], a, span, div[role="menuitem"]'));
    const item = items.find(el => {
      const t = el.innerText?.trim();
      return t === '게시물' || t === 'Post';
    });
    if (item) { item.click(); return true; }
    return false;
  });
  console.log('   게시물 옵션:', postOpt ? '✅' : '❌');
  await sleep(2000);

  // 4. 이미지 업로드
  console.log('4. 이미지 업로드...');
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) {
    console.log('   ❌ file input 없음');
    await b.close();
    return;
  }
  await fileInput.setInputFiles(IMG_PATH);
  console.log('   ✅ 이미지 업로드 완료');
  await sleep(3000);

  // 5. "다음" 버튼 여러번
  console.log('5. 다음 단계 진행...');
  for (let step = 0; step < 3; step++) {
    const nextBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => {
        const t = b.innerText?.trim();
        return t === '다음' || t === 'Next';
      });
      if (btn && !btn.disabled) { btn.click(); return true; }
      return false;
    });
    if (nextBtn) {
      console.log(`   다음 (${step+1}/3) ✅`);
      await sleep(2500);
    } else {
      console.log(`   다음 (${step+1}/3) ❌`);
      break;
    }
  }

  // 6. 캡션 입력
  console.log('6. 캡션 입력...');
  let captionDone = false;

  // 방법1: textarea
  const captionInput = await page.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea[placeholder*="문구"]');
  if (captionInput) {
    await captionInput.click({ force: true });
    await sleep(500);
    await page.keyboard.type(CAPTION, { delay: 15 });
    captionDone = true;
    console.log('   ✅ textarea');
  }

  if (!captionDone) {
    // 방법2: contenteditable
    const editor = await page.$('[contenteditable="true"][role="textbox"]');
    if (editor) {
      await editor.click({ force: true });
      await sleep(500);
      await page.keyboard.type(CAPTION, { delay: 15 });
      captionDone = true;
      console.log('   ✅ editor');
    }
  }

  if (!captionDone) {
    console.log('   ❌ 캡션 입력창 없음');
  }
  await sleep(2000);

  // 7. 위치 선택 (서울)
  console.log('7. 위치 선택...');
  const locationClicked = await page.evaluate(() => {
    // 위치 추가 버튼
    const btns = Array.from(document.querySelectorAll('button, [role="button"], div[role="combobox"]'));
    const btn = btns.find(b => {
      const t = b.innerText?.trim();
      return t.includes('위치') || t.includes('Location') || b.getAttribute('aria-label')?.includes('위치');
    });
    if (btn) { btn.click(); return true; }

    // placeholder 검색
    const locInput = document.querySelector('[placeholder*="위치"], [placeholder*="location"], [placeholder*="Location"]');
    if (locInput) { locInput.click(); return 'input_exists'; }
    return false;
  });
  console.log('   위치 선택:', locationClicked);
  await sleep(2000);

  if (locationClicked === true) {
    // 위치 검색어 입력
    const locInput = await page.$('[placeholder*="위치"], [placeholder*="location"], [placeholder*="Location"]');
    if (locInput) {
      await locInput.click();
      await sleep(500);
      await page.keyboard.type('서울', { delay: 50 });
      await sleep(2000);

      // 검색 결과에서 서울 선택
      const seoulClicked = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('button, div[role="option"], span'));
        const item = items.find(el => el.innerText?.trim() === '서울');
        if (item) { item.click(); return true; }
        return false;
      });
      console.log('   서울 선택:', seoulClicked ? '✅' : '❌');
      await sleep(1500);
    }
  }

  // 8. 공유하기
  console.log('8. 공유하기...');
  await sleep(1000);
  let shareDone = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    shareDone = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
      const btn = btns.find(b => {
        const t = b.innerText?.trim();
        return t === '공유하기' || t === 'Share';
      });
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    });
    if (shareDone) break;
    await sleep(1500);
  }
  console.log('   공유하기:', shareDone ? '✅' : '❌');

  if (shareDone) {
    await sleep(5000);
    console.log('\n✅ 포스팅 완료!');
  } else {
    console.log('\n❌ 공유하기 실패');
  }

  await b.close();
})();

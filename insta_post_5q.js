const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const CARD = {
  image: 'C:/Users/paul/.openclaw/workspace/insta_cards/card_5q_checklist.png',
  caption: `영상 편집 외주, 처음이라면 꼭 물어봐야 할 5가지 📋

외주사 비교할 때 이 5가지만 확인하면 실패할 확률이 크게 줄어듭니다.

① "우리 브랜드를 이해하고 있나요?"
② "수정 범위와 횟수는 어떻게 되나요?"
③ "납품 일정이 정해져 있나요?"
④ "저작권과 소유권은 어떻게 되나요?"
⑤ "우리 업종 사례가 있나요?"

에이컷은 위 5가지를 모두 계약서에 명시하여 투명하게 운영 중입니다.
48시간 숏폼 영상 편집, 지금 바로 시작하세요.

👉 프로필 링크에서 무료 상담 신청

#영상편집외주 #영상편집 #숏폼마케팅 #영상제작 #에이컷 #AICUT
#릴스제작 #쇼츠제작 #틱톡마케팅 #영상마케팅 #편집외주
#AI영상편집 #숏폼영상 #48시간편집 #영상에이전시
#브랜드영상 #병원마케팅 #부동산마케팅 #스타트업마케팅
#콘텐츠마케팅 #SNS마케팅 #영상제작업체 #영상구독` };

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Find Instagram page
  let page = null;
  for (const p of pages) {
    if (p.url().includes('instagram.com')) { page = p; break; }
  }
  
  if (!page) {
    console.log('NO INSTAGRAM TAB');
    b.close(); return;
  }
  
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  await page.bringToFront();
  await sleep(2000);
  
  // Navigate to Instagram homepage
  try { await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await sleep(3000);
  
  // Click create (+) button via SVG title
  console.log('1. 새 게시물 만들기 버튼 찾기...');
  const createClicked = await page.evaluate(() => {
    // Try various selectors for create button
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
        const btn = svg.closest('[role="button"]') || svg.closest('a') || svg.closest('button');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  });
  console.log('   결과:', createClicked ? '✅' : '❌');
  
  if (!createClicked) {
    // Try alternative: find the + icon
    const plusClicked = await page.evaluate(() => {
      const plus = document.querySelector('[aria-label="새로운 게시물"], [aria-label="New post"]');
      if (plus) { plus.click(); return true; }
      return false;
    });
    console.log('   aria-label 시도:', plusClicked ? '✅' : '❌');
    if (!plusClicked) { b.close(); return; }
  }
  await sleep(2000);
  
  // Select "Post" option
  console.log('2. 게시물 옵션 선택...');
  const postOpt = await page.evaluate(() => {
    const items = document.querySelectorAll('[role="menuitem"], button, [role="button"]');
    for (const item of items) {
      const t = item.innerText?.trim();
      if (t === '게시물' || t === 'Post') {
        item.click(); return true;
      }
    }
    return false;
  });
  console.log('   결과:', postOpt ? '✅' : '❌');
  await sleep(2000);
  
  // Upload image via file input
  console.log('3. 이미지 업로드...');
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) {
    console.log('   ❌ 파일 입력창 없음');
    // Try clicking the image area to trigger file input
    const uploadArea = await page.$('[role="button"][tabindex="0"]');
    if (uploadArea) {
      await uploadArea.click();
      await sleep(2000);
    }
    b.close(); return;
  }
  
  await fileInput.setInputFiles(CARD.image);
  console.log('   ✅ 이미지 업로드 완료');
  await sleep(4000);
  
  // Click "Next" buttons through the flow
  console.log('4. 진행 단계...');
  for (let step = 0; step < 3; step++) {
    const nextClicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, [role="button"]');
      for (const btn of btns) {
        const t = btn.innerText?.trim();
        if (t === '다음' || t === 'Next') {
          if (!btn.disabled) { btn.click(); return true; }
        }
      }
      return false;
    });
    if (nextClicked) {
      console.log(`   다음 (${step+1}/${3}) ✅`);
      await sleep(3000);
    } else {
      console.log(`   다음 (${step+1}/${3}) ❌ (버튼 없음)`);
      break;
    }
  }
  
  // Type caption
  console.log('5. 캡션 입력...');
  const captionTyped = await page.evaluate((text) => {
    // Try contenteditable
    const editor = document.querySelector('[contenteditable="true"][role="textbox"]');
    if (editor) {
      editor.focus();
      editor.innerText = '';
      // Use execCommand for reliable input
      document.execCommand('insertText', false, text);
      return 'contenteditable';
    }
    // Try textarea
    const ta = document.querySelector('textarea');
    if (ta) {
      ta.focus();
      ta.value = text;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      return 'textarea';
    }
    return 'none';
  }, CARD.caption);
  console.log('   방식:', captionTyped);
  
  if (captionTyped === 'contenteditable') {
    // Type remaining for React to register
    await page.keyboard.type(' ', { delay: 10 });
  }
  await sleep(2000);
  
  // Click Share
  console.log('6. 공유하기...');
  const shareClicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, [role="button"]');
    for (const btn of btns) {
      const t = btn.innerText?.trim();
      if ((t === '공유하기' || t === 'Share') && !btn.disabled) {
        btn.click(); return true;
      }
    }
    return false;
  });
  console.log('   결과:', shareClicked ? '✅' : '❌');
  
  if (shareClicked) {
    await sleep(8000);
    console.log('\n✅ 인스타그램 포스팅 완료!');
  }
  
  b.close();
})().catch(e => console.error('Fatal:', e.message.substring(0, 200)));

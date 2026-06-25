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
  let page = null;
  for (const p of pages) { if (p.url().includes('instagram.com')) { page = p; break; } }
  if (!page) { console.log('NO INSTA TAB'); b.close(); return; }
  
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  await page.bringToFront();
  await sleep(2000);
  
  // Go to Instagram home
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  
  // Click the "새로운 게시물" SVG parent container
  console.log('1. 새 게시물 만들기...');
  const createResult = await page.evaluate(() => {
    // Find SVG with title "새로운 게시물"
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const title = svg.querySelector('title');
      if (title && title.textContent === '새로운 게시물') {
        // Go up to find clickable parent
        let el = svg.parentElement;
        while (el && el.tagName !== 'A' && el.tagName !== 'BUTTON' && !el.getAttribute('role')?.includes('button')) {
          el = el.parentElement;
        }
        if (el) { el.click(); return true; }
        // Fallback: click the SVG itself
        svg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        return 'svg_clicked';
      }
    }
    // Try aria-label approach
    const ariaEl = document.querySelector('[aria-label="새로운 게시물"]');
    if (ariaEl) {
      ariaEl.closest('a, button, [role="button"]')?.click() || ariaEl.click();
      return 'aria_clicked';
    }
    return false;
  });
  console.log('   결과:', createResult);
  await sleep(3000);
  
  // Check for modal/dialog and click "게시물" or "Post"
  console.log('2. 게시물 옵션 선택...');
  const postResult = await page.evaluate(() => {
    // Look for visible menu items
    const items = document.querySelectorAll('a, button, [role="button"], [role="menuitem"], span[dir]');
    for (const item of items) {
      if (item.offsetParent === null) continue;
      const t = item.innerText?.trim();
      if (t === '게시물' || t === 'Post' || t === 'Feed post' || t === '게시글') {
        item.click(); return true;
      }
    }
    return false;
  });
  console.log('   결과:', postResult);
  await sleep(3000);
  
  // Upload image
  console.log('3. 파일 업로드...');
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) {
    console.log('   ❌ 파일 입력 없음');
    // Try: maybe the upload area appeared, click it to trigger file dialog
    const uploadArea = await page.$('[role="button"][tabindex]');
    if (uploadArea) {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
        uploadArea.click()
      ]);
      if (fc) {
        await fc.setFiles(CARD.image);
        console.log('   ✅ 파일 설정됨 (filechooser)');
        await sleep(5000);
      }
    }
    b.close(); return;
  }
  
  await fileInput.setInputFiles(CARD.image);
  console.log('   ✅ 이미지 업로드');
  await sleep(4000);
  
  // Click Next through editing steps
  console.log('4. 다음 단계...');
  for (let step = 0; step < 3; step++) {
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.offsetParent === null || btn.disabled) continue;
        const t = btn.innerText?.trim();
        if (t === '다음' || t === 'Next') { btn.click(); return true; }
      }
      return false;
    });
    if (clicked) {
      console.log(`   ${step+1}/3 ✅`);
      await sleep(3000);
    } else { break; }
  }
  
  // Caption
  console.log('5. 캡션...');
  await page.evaluate((text) => {
    const editor = document.querySelector('[contenteditable="true"][role="textbox"]');
    if (editor) { editor.focus(); }
  }, CARD.caption);
  await sleep(500);
  
  // Type caption in chunks
  for (let i = 0; i < CARD.caption.length; i += 50) {
    const chunk = CARD.caption.substring(i, i + 50);
    await page.keyboard.type(chunk, { delay: 5 });
    await sleep(50);
  }
  console.log('   ✅ 캡션 입력');
  await sleep(2000);
  
  // Share
  console.log('6. 공유하기...');
  const shareResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.offsetParent === null || btn.disabled) continue;
      const t = btn.innerText?.trim();
      if (t === '공유하기' || t === 'Share') { btn.click(); return true; }
    }
    return false;
  });
  console.log('   결과:', shareResult ? '✅' : '❌');
  
  if (shareResult) {
    await sleep(10000);
    console.log('\n✅ 인스타그램 포스팅 완료!');
  } else {
    console.log('❌ 공유 버튼을 찾을 수 없음');
    await page.screenshot({ path: 'insta_share_fail.png' });
  }
  
  b.close();
})().catch(e => console.error('Fatal:', e.message.substring(0, 200)));

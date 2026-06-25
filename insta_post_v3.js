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
  if (!page) { console.log('NO INSTA'); b.close(); return; }
  
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  await page.bringToFront();
  await sleep(2000);
  
  // Step 1: Navigate to home
  console.log('=== 인스타 피드 포스팅 ===');
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await sleep(4000);
  
  // Step 2: Click create button
  console.log('1. 새 게시물 클릭...');
  await page.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    for (const svg of svgs) {
      const title = svg.querySelector('title');
      if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
        // Find clickable parent (usually a[href] or button)
        let el = svg.parentElement;
        while (el && el.tagName !== 'A' && el.tagName !== 'BUTTON' && !['button','link'].some(r => (el.getAttribute('role')||'').includes(r))) {
          el = el.parentElement;
        }
        if (el) { el.click(); return; }
      }
    }
    // Fallback: click by aria-label
    const aria = document.querySelector('[aria-label="새로운 게시물"]');
    if (aria) {
      aria.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  await sleep(3000);
  
  // Step 3: Click "게시물" option
  console.log('2. 게시물 옵션...');
  await page.evaluate(() => {
    const items = document.querySelectorAll('span, div, a, button');
    for (const item of items) {
      if (item.offsetParent === null) continue;
      const t = item.innerText?.trim();
      if (t === '게시물' || t === 'Post' || t === 'Feed post') {
        item.click(); return;
      }
    }
  });
  await sleep(3000);
  
  // Step 4: Find file input and upload
  console.log('3. 이미지 업로드...');
  let fileInput = await page.$('input[type="file"]');
  
  if (!fileInput) {
    // Click the upload area to create the file input
    const uploadArea = await page.$('div[role="button"]');
    if (uploadArea) {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
        uploadArea.click()
      ]);
      if (fc) {
        await fc.setFiles(CARD.image);
        console.log('   ✅ filechooser 방식');
      }
    }
  } else {
    await fileInput.setInputFiles(CARD.image);
    console.log('   ✅ input 방식');
  }
  await sleep(5000);
  
  // Step 5: Click Next through cropping/editing
  console.log('4. 다음 버튼...');
  for (let step = 0; step < 5; step++) {
    await sleep(1000);
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.offsetParent === null || btn.disabled) continue;
        const t = btn.innerText?.trim();
        if (t === '다음' || t === 'Next') { btn.click(); return true; }
      }
      return false;
    });
    if (!clicked) { console.log(`   ${step}번 클릭 후 종료`); break; }
    console.log(`   ${step+1}차 다음 ✅`);
    await sleep(3000);
  }
  
  // Step 6: Check current page state
  const state = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
      .filter(b => b.offsetParent !== null && !b.disabled)
      .map(b => ({ t: (b.innerText || '').trim().substring(0, 20) }));
    const editor = !!document.querySelector('[contenteditable="true"][role="textbox"]');
    return { buttons: btns, hasEditor: editor, url: location.href.substring(0, 80) };
  });
  console.log('   현재 상태:', JSON.stringify(state, null, 2));
  
  // Step 7: Type caption
  if (state.hasEditor) {
    console.log('5. 캡션 입력...');
    const editor = await page.$('[contenteditable="true"][role="textbox"]');
    if (editor) {
      await editor.click();
      await sleep(500);
      
      // Type in chunks for reliability
      for (let i = 0; i < CARD.caption.length; i += 30) {
        const chunk = CARD.caption.substring(i, i + 30);
        await page.keyboard.type(chunk, { delay: 3 });
        await sleep(10);
      }
      console.log('   ✅');
      await sleep(2000);
    }
  }
  
  // Step 8: Find and click share button
  console.log('6. 공유/게시 버튼 찾기...');
  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.offsetParent === null || btn.disabled) continue;
        const t = (btn.innerText || '').trim();
        if (t === '공유하기' || t === 'Share' || t === '게시') {
          btn.click(); return t;
        }
      }
      return false;
    });
    if (result) { console.log(`   ✅ "${result}" 클릭됨`); break; }
    console.log(`   시도 ${attempt+1}: 버튼 없음, 2초 대기`);
    await sleep(2000);
  }
  await sleep(10000);
  
  const finalUrl = page.url();
  console.log('\n✅ 최종 URL:', finalUrl.substring(0, 100));
  
  // Check if we're back on feed (post was shared)
  if (finalUrl === 'https://www.instagram.com/' || finalUrl.includes('/p/')) {
    console.log('✅ 인스타그램 포스팅 완료!');
  } else {
    console.log('⚠️ 확인 필요 - 현재 페이지:', finalUrl);
    await page.screenshot({ path: 'insta_final.png' });
  }
  
  b.close();
})().catch(e => console.error('ERR:', e.message.substring(0, 200)));

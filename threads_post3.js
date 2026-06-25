const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const tp = ctx.pages().find(p => p.url().includes('threads.com'));
  if (!tp) { console.log('Threads 탭 없음'); await b.close(); process.exit(0); }

  // 홈 피드
  await tp.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  // 새 글 작성 버튼 찾기 (우측 하단 + 버튼)
  // 다양한 선택자 시도
  const btnClicked = await tp.evaluate(() => {
    // 1. SVG 가 있는 버튼 찾기
    const btns = document.querySelectorAll('div[role="button"], a, button');
    for (const b of btns) {
      const svg = b.querySelector('svg');
      if (svg) {
        const path = svg.innerHTML || '';
        // path가 plus 모양(새 글)인지 확인
        if (path.includes('M12') && (path.includes('M5') || path.includes('M19'))) {
          const r = b.getBoundingClientRect();
          if (r.width > 20 && r.width < 80 && r.x > 0) {
            b.click();
            return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
          }
        }
      }
    }
    // 2. 모든 버튼 클릭 (우측 하단 영역)
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const r = el.getBoundingClientRect();
      // 화면 우측 하단의 작은 버튼 (60x60 근처)
      if (r.width > 40 && r.width < 80 && r.height > 40 && r.height < 80 && r.x < 100 && r.y > 400) {
        if (el.getAttribute('role') === 'button' || el.tagName === 'A' || el.tagName === 'DIV') {
          el.click();
          return { x: Math.round(r.x), y: Math.round(r.y) };
        }
      }
    }
    return null;
  });

  console.log('버튼 클릭:', btnClicked);
  await new Promise(r => setTimeout(r, 4000));

  // 1초 추가 대기 후 다시 검색
  await new Promise(r => setTimeout(r, 2000));

  // 입력창 검색
  const inputFound = await tp.evaluate(() => {
    const results = [];
    // role="textbox"
    const textboxes = document.querySelectorAll('[role="textbox"]');
    textboxes.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      results.push(`textbox[${i}]: ${Math.round(r.w)}x${Math.round(r.h)} @(${Math.round(r.x)},${Math.round(r.y)})`);
    });
    // contenteditable
    const ces = document.querySelectorAll('[contenteditable]');
    ces.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      results.push(`ce[${i}]: ${Math.round(r.width)}x${Math.round(r.height)} @(${Math.round(r.x)},${Math.round(r.y)})`);
    });
    // textarea
    const tas = document.querySelectorAll('textarea');
    tas.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      results.push(`textarea[${i}]: ${Math.round(r.width)}x${Math.round(r.height)} @(${Math.round(r.x)},${Math.round(r.y)})`);
    });
    // 전체 body text (모달 확인)
    const bodyText = document.body.innerText.substring(0, 500);
    return { elements: results, bodyText: bodyText.substring(0, 300) };
  });

  console.log('\n입력창 검색 결과:');
  inputFound.elements.forEach(e => console.log(' ', e));
  console.log('\n본문:', inputFound.bodyText.substring(0, 200));

  // 입력창 있으면 글 작성
  const targetInput = inputFound.elements.find(e => e.includes('textbox') || e.includes('ce['));
  if (targetInput) {
    console.log('\n입력창 발견, 글 작성 시도...');
    
    // 첫 번째 textbox 또는 contenteditable 클릭
    await tp.evaluate(() => {
      const el = document.querySelector('[role="textbox"], [contenteditable]');
      if (el) {
        el.focus();
        el.click();
      }
    });
    await new Promise(r => setTimeout(r, 500));

    const postText = '릴스 하나로 쇼핑몰 트래픽이 달라집니다 🛒\n\n제품 영상 하나면 사진 10장보다 강력한 전환율을 만듭니다.\n촬영 원본만 보내주세요. 에이컷이 편집 다 해드립니다 ✨\n\naicut.co.kr';

    await tp.keyboard.type(postText, { delay: 8 });
    await new Promise(r => setTimeout(r, 1000));

    // 게시 버튼
    const postBtn = await tp.evaluate(() => {
      const btns = document.querySelectorAll('div[role="button"], button');
      for (const b of btns) {
        const t = (b.innerText || '').trim();
        if (t === '게시' || t === 'Post' || t.includes('Post')) {
          b.click();
          return t;
        }
      }
      return null;
    });

    if (postBtn) {
      console.log('✅ 게시:', postBtn);
    } else {
      // Enter 시도
      await tp.keyboard.press('Enter');
      console.log('Enter 시도');
    }
    await new Promise(r => setTimeout(r, 3000));
    console.log('✅ 글 작성 완료!');
  } else if (inputFound.bodyText.includes('새로운') || inputFound.bodyText.includes('스레드') || inputFound.bodyText.includes('댓글')) {
    console.log('\n모달은 열렸으나 입력창 검색 실패');
  } else {
    console.log('\n모달이 열리지 않음');
    // 직접 intent URL 시도
    console.log('intent URL 시도...');
    await tp.goto('https://www.threads.com/intent/post', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 4000));
    
    const intentText = await tp.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('intent 페이지:', intentText.substring(0, 200));
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

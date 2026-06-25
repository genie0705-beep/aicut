const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const tp = ctx.pages().find(p => p.url().includes('threads.com'));
  if (!tp) { console.log('Threads 탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 2000));

  // 로그인 상태 확인
  const loginCheck = await tp.evaluate(() => document.body.innerText.includes('Instagram으로 계속하기'));
  if (loginCheck) {
    console.log('로그인 필요 - Instagram 로그인 시도');
    await tp.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    await tp.evaluate(() => {
      const all = document.querySelectorAll('a, button, div[role="button"], span');
      for (const el of all) {
        const t = (el.innerText || '').trim();
        if (t.includes('Instagram') && t.includes('계속')) { el.click(); return; }
      }
    });
    await new Promise(r => setTimeout(r, 5000));
  }
  console.log('로그인 확인 완료');

  // 사이드바 하단 버튼들 분석 (새 글 버튼 = + 아이콘)
  const sidebarBtns = await tp.evaluate(() => {
    const btns = document.querySelectorAll('[role="button"]');
    const list = [];
    btns.forEach((b, i) => {
      const r = b.getBoundingClientRect();
      if (r.width >= 40 && r.width <= 80 && r.x < 100) {
        const svg = b.querySelector('svg');
        const svgHTML = svg ? svg.innerHTML.substring(0, 100) : '';
        list.push({ i, y: Math.round(r.y), svg: svgHTML.substring(0, 40) });
      }
    });
    return list.sort((a, b) => a.y - b.y);
  });

  console.log('\n사이드바 버튼들:');
  sidebarBtns.forEach((b, i) => console.log(` [${i}] y=${b.y} svg=${b.svg}`));

  // 마지막 버튼이 새 글 작성 버튼일 가능성 높음 (하단에 위치)
  // 또는 두 번째로 마지막
  let targetBtn = sidebarBtns[sidebarBtns.length - 1]; // 가장 아래
  if (targetBtn) {
    console.log(`\n새 글 버튼 시도: y=${targetBtn.y}`);
    
    // JavaScript click
    await tp.evaluate(() => {
      const btns = document.querySelectorAll('[role="button"]');
      for (const b of btns) {
        const r = b.getBoundingClientRect();
        if (r.width >= 40 && r.width <= 80 && r.x < 100) {
          // SVG가 + 모양인지 확인
          const svg = b.querySelector('svg');
          if (svg) {
            const path = svg.innerHTML || '';
            // + 모양 SVG path 특성
            if (path.includes('M12') || path.includes('M5') || path.includes('M19')) {
              b.click();
              return { y: Math.round(r.y) };
            }
          }
        }
      }
      // fallback: 가장 아래 버튼
      const allBtns = document.querySelectorAll('[role="button"]');
      let lastBtn = null;
      let lastY = -1;
      allBtns.forEach(b => {
        const r = b.getBoundingClientRect();
        if (r.width >= 40 && r.width <= 80 && r.x < 100 && r.y > lastY) {
          lastBtn = b;
          lastY = r.y;
        }
      });
      if (lastBtn) { lastBtn.click(); return { y: Math.round(lastY) }; }
      return null;
    });

    await new Promise(r => setTimeout(r, 3000));

    // 모달 입력창 검색
    const modalResult = await tp.evaluate(() => {
      const el = document.querySelector('[role="textbox"], [contenteditable]');
      if (el) {
        const r = el.getBoundingClientRect();
        el.focus();
        return { found: true, w: Math.round(r.width), h: Math.round(r.height) };
      }
      return { found: false };
    });

    if (modalResult.found) {
      console.log('입력창 발견! 글 작성 시작...');
      
      const postText = '릴스 하나로 쇼핑몰 트래픽이 달라집니다 🛒\n\n제품 영상 하나면 사진 10장보다 강력한 전환율을 만듭니다.\n촬영 원본만 보내주세요. 에이컷이 편집 다 해드립니다 ✨\n\naicut.co.kr';
      
      // keyboard 타입
      await tp.keyboard.type(postText, { delay: 5 });
      await new Promise(r => setTimeout(r, 1000));

      // 게시 버튼
      const posted = await tp.evaluate(() => {
        const btns = document.querySelectorAll('[role="button"]');
        for (const b of btns) {
          const t = (b.innerText || '').trim();
          if (t === '게시' || t === 'Post' || t.includes('Post')) {
            b.click();
            return t;
          }
        }
        return null;
      });

      if (posted) {
        console.log('✅ 게시:', posted);
        await new Promise(r => setTimeout(r, 3000));
        console.log('✅ Threads 새 글 발행 완료!');
      } else {
        console.log('게시 버튼 없음, Enter 시도');
        await tp.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 3000));
        console.log('✅ Enter 전송 완료');
      }
    } else {
      console.log('모달 입력창 없음');
    }
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

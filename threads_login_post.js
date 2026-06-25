const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const tp = ctx.pages().find(p => p.url().includes('threads.com'));
  if (!tp) { console.log('Threads 탭 없음'); await b.close(); process.exit(0); }

  // 1. Threads 홈 (로그인 안 됨)
  await tp.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  // 2. "Instagram으로 계속하기" 버튼 찾기
  const loginBtn = await tp.evaluate(() => {
    const all = document.querySelectorAll('a, button, div[role="button"], span');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t.includes('Instagram') && (t.includes('계속') || t.includes('로그인'))) {
        const r = el.getBoundingClientRect();
        if (r.width > 0) {
          el.click();
          return { text: t.substring(0, 20), x: r.x, y: r.y };
        }
      }
    }
    return null;
  });

  if (loginBtn) {
    console.log('로그인 버튼 클릭:', loginBtn.text);
    await new Promise(r => setTimeout(r, 5000));

    // 로그인 후 URL 확인
    console.log('로그인 후 URL:', tp.url().substring(0, 100));

    // 로그인 성공 확인
    const afterLogin = await tp.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasProfile: text.includes('aicut.official') || text.includes('프로필'),
        hasLoginPrompt: text.includes('Instagram으로 계속하기'),
        url: window.location.href.substring(0, 80)
      };
    });
    console.log('로그인 상태:', JSON.stringify(afterLogin));

    if (afterLogin.hasProfile) {
      console.log('✅ Threads 로그인 성공!');

      // 새 글 작성 버튼 찾기 (로그인 후에는 보임)
      await new Promise(r => setTimeout(r, 2000));

      // N 키 누르기 (Threads 단축키 - 새 글)
      await tp.keyboard.press('KeyN');
      await new Promise(r => setTimeout(r, 2000));

      // 입력창 찾기
      const inputCheck = await tp.evaluate(() => {
        const textboxes = document.querySelectorAll('[role="textbox"], [contenteditable], textarea');
        const found = [];
        textboxes.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          if (r.width > 50 && r.height > 20) {
            found.push(`[${i}] ${el.tagName} ${Math.round(r.w)}x${Math.round(r.h)} @(${Math.round(r.x)},${Math.round(r.y)})`);
          }
        });
        return found;
      });

      if (inputCheck.length > 0) {
        console.log('입력창 발견!');
        inputCheck.forEach(c => console.log(' ', c));

        // 텍스트 입력
        await tp.evaluate(() => {
          const el = document.querySelector('[role="textbox"], [contenteditable]');
          if (el) el.focus();
        });
        await new Promise(r => setTimeout(r, 500));

        const postText = '릴스 하나로 쇼핑몰 트래픽이 달라집니다 🛒\n\n제품 영상 하나면 사진 10장보다 강력합니다.\n촬영 원본만 보내주세요. 에이컷이 편집 다 해드립니다 ✨\n\naicut.co.kr';
        await tp.keyboard.type(postText, { delay: 8 });
        await new Promise(r => setTimeout(r, 1000));

        // 게시
        await tp.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 1000));
        await tp.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 2000));

        console.log('✅ Threads 글 작성 완료!');
      } else {
        console.log('N 키로 모달 안 열림, 버튼 찾기');
        // 좌측 사이드바 아이콘들 중 새 글 버튼 찾기
        const newPostBtn = await tp.evaluate(() => {
          const btns = document.querySelectorAll('[role="button"]');
          for (const b of btns) {
            const r = b.getBoundingClientRect();
            if (r.width >= 40 && r.width <= 80 && r.x < 100 && r.y > 400 && r.y < 900) {
              // 하단으로 갈수록 새 글 버튼일 가능성
              if (r.y > 700) {
                b.click();
                return { x: Math.round(r.x), y: Math.round(r.y) };
              }
            }
          }
          return null;
        });

        if (newPostBtn) {
          console.log('새 글 버튼 클릭:', newPostBtn.x, newPostBtn.y);
          await new Promise(r => setTimeout(r, 3000));

          // 모달에서 입력창 찾기
          const modalInput = await tp.evaluate(() => {
            const el = document.querySelector('[role="textbox"], [contenteditable]');
            if (el) {
              const r = el.getBoundingClientRect();
              el.focus();
              return { w: Math.round(r.width), h: Math.round(r.height) };
            }
            return null;
          });

          if (modalInput) {
            const postText2 = '릴스 하나로 쇼핑몰 트래픽이 달라집니다 🛒\n\n제품 영상 하나면 사진 10장보다 강력합니다.\n촬영 원본만 보내주세요. 에이컷이 편집 다 해드립니다 ✨\n\naicut.co.kr';
            await tp.keyboard.type(postText2, { delay: 8 });
            await new Promise(r => setTimeout(r, 1000));
            
            // 게시 버튼
            const postBtn2 = await tp.evaluate(() => {
              const btns = document.querySelectorAll('[role="button"]');
              for (const b of btns) {
                const t = (b.innerText || '').trim();
                if (t === '게시' || t === 'Post') { b.click(); return t; }
              }
              return null;
            });
            if (postBtn2) console.log('게시:', postBtn2);
            else await tp.keyboard.press('Enter');
            
            await new Promise(r => setTimeout(r, 3000));
            console.log('✅ Threads 글 작성 완료!');
          }
        }
      }
    } else {
      console.log('Threads 로그인 실패');
    }
  } else {
    console.log('로그인 버튼 못 찾음');
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

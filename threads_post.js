const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  const tp = pages.find(p => p.url().includes('threads.com') || p.url().includes('threads.net'));
  if (!tp) { console.log('Threads 탭 없음'); await b.close(); process.exit(0); }

  console.log('Threads URL:', tp.url().substring(0, 80));

  // 홈 피드로 이동
  await tp.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));

  // 페이지 DOM 분석 - 새 글 작성 버튼 찾기
  const btnInfo = await tp.evaluate(() => {
    const btns = document.querySelectorAll('div[role="button"], a, button, span');
    const found = [];
    btns.forEach((b, i) => {
      const t = (b.innerText || '').trim();
      const cls = (typeof b.className === 'string') ? b.className.substring(0, 40) : '';
      const r = b.getBoundingClientRect();
      if (r.width > 0 && r.width < 100 && r.height < 100 && (t === '' || t.length < 5)) {
        found.push({ i, tag: b.tagName, cls, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), text: t.substring(0, 10) });
      }
    });
    return found.slice(0, 20);
  });

  console.log('작은 버튼들:');
  btnInfo.forEach(b => console.log(` [${b.i}] ${b.tag} ${b.cls} ${b.w}x${b.h} @(${b.x},${b.y}) text="${b.text}"`));

  // 새 글 작성 버튼 (일반적으로 하단에 + 버튼)
  const newPostBtn = await tp.evaluate(() => {
    // SVG가 포함된 버튼 중 + 모양
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const html = el.innerHTML || '';
      const cls = (typeof el.className === 'string') ? el.className : '';
      // 새 글 작성 버튼 특징: role="button", 특정 아이콘 포함
      if (el.getAttribute('role') === 'button' || el.tagName === 'BUTTON') {
        const r = el.getBoundingClientRect();
        if (r.width > 20 && r.width < 80 && r.height > 20 && r.height < 80 && r.x > 0) {
          // + 아이콘(새 글) 찾기 - SVG path에 plus 모양
          const svg = el.querySelector('svg');
          if (svg) return { x: r.x + r.width/2, y: r.y + r.height/2, tag: el.tagName, cls: cls.substring(0, 30) };
        }
      }
    }
    return null;
  });

  if (newPostBtn) {
    console.log('\n새 글 작성 버튼:', newPostBtn.x, newPostBtn.y, newPostBtn.tag, newPostBtn.cls);
    await tp.mouse.click(newPostBtn.x, newPostBtn.y);
    await new Promise(r => setTimeout(r, 3000));
    
    // 입력창 찾기
    const inputArea = await tp.evaluate(() => {
      const divs = document.querySelectorAll('div[contenteditable="true"], [role="textbox"]');
      for (const el of divs) {
        const r = el.getBoundingClientRect();
        if (r.width > 100 && r.height > 50) return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
      return null;
    });

    if (inputArea) {
      console.log('입력창:', inputArea.x, inputArea.y);
      await tp.mouse.click(inputArea.x, inputArea.y);
      await new Promise(r => setTimeout(r, 500));

      const postText = '릴스 하나로 쇼핑몰 트래픽이 달라집니다 🛒\n\n제품 영상 하나면 사진 10장보다 강력한 전환율을 만듭니다.\n\n촬영? 편집? 부담 갖지 마세요.\n원본만 보내주시면 에이컷이 다 해드립니다 ✨\n\n👉 aicut.co.kr';
      await tp.keyboard.type(postText, { delay: 10 });
      await new Promise(r => setTimeout(r, 1000));

      // 게시 버튼
      const postBtn = await tp.evaluate(() => {
        const btns = document.querySelectorAll('div[role="button"], button');
        for (const b of btns) {
          const t = (b.innerText || '').trim();
          if (t === '게시' || t === 'Post' || t === '보내기') {
            const r = b.getBoundingClientRect();
            if (r.width > 0) { b.click(); return { text: t }; }
          }
        }
        return null;
      });

      if (postBtn) {
        console.log('게시 버튼:', postBtn.text);
        await new Promise(r => setTimeout(r, 3000));
        console.log('✅ Threads 새 글 발행 완료!');
      } else {
        console.log('게시 버튼 못 찾음, Enter 시도');
        await tp.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 3000));
      }
    } else {
      console.log('입력창 못 찾음');
    }
  } else {
    console.log('새 글 버튼 못 찾음');
    
    // 대체: 페이지 구조 분석
    const pageInfo = await tp.evaluate(() => {
      return {
        bodyText: document.body.innerText.substring(0, 300),
        ceCount: document.querySelectorAll('[contenteditable]').length,
        roles: Array.from(document.querySelectorAll('[role]')).map(el => el.getAttribute('role')).filter(Boolean).slice(0, 10)
      };
    });
    console.log('페이지 정보:', JSON.stringify(pageInfo));
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

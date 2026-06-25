const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const tp = ctx.pages().find(p => p.url().includes('threads.com') || p.url().includes('threads.net'));
  if (!tp) { console.log('Threads 탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 2000));

  // contenteditable/입력창 다시 검색
  const inputInfo = await tp.evaluate(() => {
    const divs = document.querySelectorAll('div[contenteditable="true"], [role="textbox"], textarea, input');
    const found = [];
    divs.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.width > 50 && r.height > 20) {
        found.push({ i, tag: el.tagName, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), placeholder: el.getAttribute('placeholder') || '' });
      }
    });
    return found;
  });

  if (inputInfo.length > 0) {
    console.log('입력창 발견:');
    inputInfo.forEach(inp => console.log(` [${inp.i}] ${inp.tag} ${inp.w}x${inp.h} @(${inp.x},${inp.y}) ph="${inp.placeholder}"`));

    // 첫 번째 입력창 사용
    const target = inputInfo[0];
    await tp.mouse.click(target.x + 5, target.y + 5);
    await new Promise(r => setTimeout(r, 500));

    const text = '릴스 하나로 쇼핑몰 트래픽이 달라집니다 🛒\n\n제품 영상 하나면 사진 10장보다 강력합니다.\n촬영 원본만 보내주세요. 에이컷이 편집 다 해드립니다 ✨\n\naicut.co.kr';
    
    // insertText 방식
    await tp.evaluate((txt) => {
      const divs = document.querySelectorAll('div[contenteditable="true"], [role="textbox"]');
      for (const el of divs) {
        const r = el.getBoundingClientRect();
        if (r.width > 50 && r.height > 20) {
          el.focus();
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('insertText', false, txt);
          return;
        }
      }
    }, text);

    await new Promise(r => setTimeout(r, 1000));

    // 게시 버튼
    const posted = await tp.evaluate(() => {
      const btns = document.querySelectorAll('div[role="button"], button');
      for (const b of btns) {
        const t = (b.innerText || '').trim();
        if (t === '게시' || t === 'Post' || t.includes('게시') || t.includes('Post')) {
          b.click();
          return t;
        }
      }
      return null;
    });

    if (posted) {
      console.log('✅ 게시 버튼 클릭:', posted);
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.log('게시 버튼 못 찾음');
    }
  } else {
    console.log('입력창 못 찾음');
    // 페이지 상태 확인
    const state = await tp.evaluate(() => ({
      bodyText: document.body.innerText.substring(0, 400),
      editable: document.querySelectorAll('[contenteditable]').length,
      textarea: document.querySelectorAll('textarea').length
    }));
    console.log('상태:', JSON.stringify(state));
  }

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

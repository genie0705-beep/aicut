const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const tp = ctx.pages().find(p => p.url().includes('threads.com'));
  if (!tp) { console.log('Threads 탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // "새로운 소식이 있나요?" 클릭
  const clickResult = await tp.evaluate(() => {
    // "새로운 소식이 있나요?" 텍스트를 포함한 요소 찾기
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t.includes('새로운 소식') || t.includes('무슨 일') || t.includes('What\'s')) {
        const r = el.getBoundingClientRect();
        if (r.width > 50 && r.height > 20) {
          el.click();
          return { text: t.substring(0, 20), x: Math.round(r.x), y: Math.round(r.y) };
        }
      }
    }
    // 입력 영역 찾기 (contenteditable, textbox)
    const textboxes = document.querySelectorAll('[role="textbox"], [contenteditable]');
    for (const tb of textboxes) {
      const r = tb.getBoundingClientRect();
      if (r.width > 50) {
        tb.click();
        return { text: 'textbox', x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) };
      }
    }
    return null;
  });

  console.log('클릭:', JSON.stringify(clickResult));
  await new Promise(r => setTimeout(r, 1000));

  // 텍스트 입력
  const postText = '릴스 하나로 쇼핑몰 트래픽이 달라집니다 🛒\n\n제품 영상 하나면 사진 10장보다 강력한 전환율을 만듭니다.\n촬영 원본만 보내주세요. 에이컷이 편집 다 해드립니다 ✨\n\naicut.co.kr';
  await tp.keyboard.type(postText, { delay: 5 });
  await new Promise(r => setTimeout(r, 1000));

  // 게시 버튼 찾아서 클릭
  const posted = await tp.evaluate(() => {
    const btns = document.querySelectorAll('[role="button"], button');
    for (const b of btns) {
      const t = (b.innerText || '').trim();
      if (t === '게시' || t === 'Post') {
        const r = b.getBoundingClientRect();
        if (r.width > 0) {
          b.click();
          return { text: t, x: Math.round(r.x), y: Math.round(r.y) };
        }
      }
    }
    return null;
  });

  if (posted) {
    console.log('✅ 게시 버튼 클릭:', posted.text);
    await new Promise(r => setTimeout(r, 3000));
    console.log('✅ Threads 글 발행 완료!');
  } else {
    console.log('게시 버튼 못 찾음, Enter 시도');
    await tp.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
  }

  // 게시 후 페이지 확인
  const afterText = await tp.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('게시 후:', afterText.substring(0, 200));

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

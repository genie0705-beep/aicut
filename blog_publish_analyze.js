const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages().find(p => p.url().includes('Write'));
  if (!page) { console.log('Write 탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 2000));

  // 1. mainFrame 찾기 (postwrite)
  const mf = page.frames().find(f => f.url().includes('postwrite'));
  if (!mf) { console.log('mainFrame 없음'); await b.close(); process.exit(0); }

  console.log('mainFrame 접근 완료:', mf.url().substring(0, 80));

  // 2. se-body 클릭해서 에디터 활성화
  await mf.evaluate(() => {
    const se = document.querySelector('.se-body');
    if (se) se.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 3. contenteditable 내용 확인
  const ceText = await mf.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    return ce ? (ce.innerText || '').substring(0, 50) : 'CE 없음';
  });
  console.log('contenteditable 내용:', ceText);

  // 4. mainFrame 내 "발행" 버튼 찾기
  const pubBtn = await mf.evaluate(() => {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '발행') {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          cls: (typeof el.className === 'string' ? el.className.substring(0, 40) : ''),
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
          disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
          pageX: r.x + r.width/2,
          pageY: r.y + r.height/2
        };
      }
    }
    return null;
  });

  if (pubBtn) {
    console.log('mainFrame 발행 버튼:', JSON.stringify(pubBtn, null, 2));
    
    // 5. JavaScript click()으로 직접 클릭
    const clicked = await mf.evaluate(() => {
      const all = document.querySelectorAll('*');
      for (const el of all) {
        if ((el.innerText || '').trim() === '발행') {
          el.click();
          return true;
        }
      }
      return false;
    });
    console.log('JS click 결과:', clicked);
    await new Promise(r => setTimeout(r, 3000));
  }

  // 6. 발행 후 변화 확인
  const afterText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('발행 후 페이지:', afterText.substring(0, 200));

  // 7. "발행하기" 모달 확인 버튼
  const confirmBtn = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '발행하기' || t === '확인' || t === '게시') {
        const r = el.getBoundingClientRect();
        if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: t };
      }
    }
    return null;
  });

  if (confirmBtn) {
    console.log('확인 버튼:', confirmBtn.text);
    await page.mouse.click(confirmBtn.x, confirmBtn.y);
    await new Promise(r => setTimeout(r, 3000));
  }

  // 8. 블로그 확인
  const cp = await ctx.newPage();
  await cp.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));
  
  const blogText = await cp.evaluate(() => document.body.innerText);
  const hasEdu = blogText.includes('온라인 강의') || blogText.includes('교육 콘텐츠');
  const lines = blogText.split('\n');
  let latestTitle = '(찾을 수 없음)';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('AICUT') && lines[i].includes('・')) {
      latestTitle = (lines[i-1] || '(제목없음)').substring(0, 50);
      break;
    }
  }
  
  console.log('\n✅ 발행 결과:', hasEdu ? '성공!' : '실패');
  console.log('최신 포스팅:', latestTitle);
  
  await cp.close();
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

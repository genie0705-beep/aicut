const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  const page = pages[5]; // Redirect=Write

  await new Promise(r => setTimeout(r, 2000));

  // 1. 저장 버튼 먼저 클릭 (내용 저장)
  const saveBtn = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '저장') {
        const r = el.getBoundingClientRect();
        if (r.width > 0) return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });

  if (saveBtn) {
    console.log('저장 버튼 클릭');
    await page.mouse.click(saveBtn.x, saveBtn.y);
    await new Promise(r => setTimeout(r, 2000));
  }

  // 2. 발행 버튼 찾아서 클릭 (좌표 직접 사용)
  console.log('발행 버튼 클릭 (좌표: 1852, 22)');
  await page.mouse.click(1852, 22);
  await new Promise(r => setTimeout(r, 3000));

  // 3. 발행 모달 확인
  const modalText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('모달/화면:', modalText.substring(0, 300));

  // 4. "발행하기" 또는 확인 버튼 찾기
  const confirmBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button, [role="button"], a, span, div');
    for (const el of btns) {
      const t = (el.innerText || '').trim();
      if (t === '발행하기' || t === '확인' || t === '게시' || t.includes('등록') || t === '발행') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.x > 0) return { x: r.x + r.width/2, y: r.y + r.height/2, text: t.substring(0, 10) };
      }
    }
    return null;
  });

  if (confirmBtn) {
    console.log('확인 버튼:', confirmBtn.text);
    await page.mouse.click(confirmBtn.x, confirmBtn.y);
    await new Promise(r => setTimeout(r, 3000));
    console.log('확인 클릭 완료');
  } else {
    console.log('추가 확인 버튼 없음');
  }

  // 5. 발행 완료 확인 - 블로그 메인 페이지로 이동
  const url = page.url();
  console.log('현재 URL:', url.substring(0, 100));

  // 6. 블로그 확인
  const checkPage = await ctx.newPage();
  await checkPage.goto('https://blog.naver.com/PostList.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 4000));
  
  const text = await checkPage.evaluate(() => document.body.innerText);
  const hasEdu = text.includes('온라인 강의') || text.includes('교육 콘텐츠');
  console.log('\n온라인 강의 포스팅 발행:', hasEdu ? '✅ 성공!' : '❌ 실패');

  // 최신 포스팅 제목
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('AICUT') && lines[i].includes('・')) {
      const title = lines[i - 1] || '(제목없음)';
      const date = lines[i];
      console.log('최신:', title.substring(0, 50), date.substring(0, 30));
      break;
    }
  }

  await checkPage.close();
  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

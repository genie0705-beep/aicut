const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];
  page.on('dialog', async d => d.dismiss().catch(() => {}));

  const testText = `에이컷 Threads 첫 번째 마케팅 게시글 테스트 🎬

영상 콘텐츠 제작 고민이시라면 에이컷을 찾아주세요.
월정액 전담팀 정기납품 서비스입니다.

👉 aicut.co.kr

#영상제작 #마케팅 #에이컷`;

  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await new Promise(r => setTimeout(r, 3000));

  // 1. 입력창 클릭
  const inputBox = await page.$('[contenteditable="true"][aria-placeholder="새로운 소식이 있나요?"]');
  console.log('입력창 found:', !!inputBox);
  if (!inputBox) {
    // 새로운 스레드 버튼 먼저
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, [role="button"]')).find(b => b.innerText?.trim() === '새로운 스레드');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
  }

  const box = await page.$('[contenteditable="true"]');
  console.log('box found:', !!box);
  if (!box) { console.log('입력창 없음'); await b.close(); return; }

  await box.click();
  await new Promise(r => setTimeout(r, 300));

  // 2. 텍스트 입력
  const lines = testText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    await page.keyboard.type(lines[i], { delay: 20 });
    if (i < lines.length - 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
  }
  await new Promise(r => setTimeout(r, 500));

  // 3. 입력창 내용 확인
  const inputContent = await page.evaluate(() => {
    const el = document.querySelector('[contenteditable="true"]');
    return el ? el.innerText : 'NOT FOUND';
  });
  console.log('입력된 내용:', inputContent.substring(0, 60));

  // 4. 게시 버튼 상태 확인 (활성화?)
  const btnState = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '게시');
    return btn ? { found: true, disabled: btn.disabled, ariaDisabled: btn.getAttribute('aria-disabled') } : { found: false };
  });
  console.log('게시 버튼 상태:', JSON.stringify(btnState));

  // 5. 게시 클릭
  const posted = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText?.trim() === '게시');
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('게시 클릭:', posted);
  await new Promise(r => setTimeout(r, 4000));

  // 확인
  const url = page.url();
  console.log('게시 후 URL:', url);

  await b.close();
})().catch(e => console.error('ERR:', e.message));

const { chromium } = require('playwright');

const POST_TEXT = `부동산 유튜브 하려는 분들께 🏠

처음엔 다들 "주 2회 업로드!" 다짐하죠.
3개월 후엔 대부분 멈춰 있어요.

에이컷 쓰시면 전담팀이 매달 고정 납품 —
업로드 걱정 없이 콘텐츠에만 집중!

👉 aicut.co.kr

#부동산유튜브 #부동산마케팅 #영상편집`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  console.log('=== 5번 포스팅 (좌표 클릭 방식) ===');

  // "새로운 소식이 있나요?" 좌표 클릭으로 작성창 열기
  await page.mouse.click(860, 96);
  console.log('작성창 클릭 (좌표)');
  await sleep(2500);

  // 현재 상태 확인
  const state = await page.evaluate(() => {
    const editors = Array.from(document.querySelectorAll('[contenteditable="true"]'));
    const modal = document.querySelector('[role="dialog"]');
    return {
      editorCount: editors.length,
      hasModal: !!modal,
      url: location.href
    };
  });
  console.log('상태:', JSON.stringify(state));

  // 입력창 찾기
  const editorSelector = '[contenteditable="true"]';
  let editorExists = false;
  try {
    await page.waitForSelector(editorSelector, { timeout: 5000 });
    editorExists = true;
  } catch(e) {}

  if (!editorExists) {
    // 모달이 없으면 좌클릭 다른 방법으로 열기
    console.log('입력창 없음 - 새 스레드 버튼(15,122) 시도');
    await page.mouse.click(15 + 50, 122 + 10);
    await sleep(2000);
  }

  // 입력창 클릭 후 포커스
  await page.mouse.click(860, 96);
  await sleep(500);

  const editorEl = await page.$(editorSelector);
  if (!editorEl) {
    console.log('❌ 입력창 여전히 없음');
    await b.close(); return;
  }
  await editorEl.click({ force: true });
  await sleep(300);

  // 텍스트 입력
  const lines = POST_TEXT.split('\n');
  for (let j = 0; j < lines.length; j++) {
    if (lines[j]) await page.keyboard.type(lines[j], { delay: 25 });
    if (j < lines.length - 1) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
      await sleep(25);
    }
  }
  await sleep(1500);

  const len = await page.evaluate(() => {
    const el = document.querySelector('[contenteditable="true"]');
    return el ? el.innerText.trim().length : 0;
  });
  console.log('입력 글자수:', len);

  if (len < 5) {
    console.log('❌ 입력 실패');
    await b.close(); return;
  }

  // 게시 버튼 좌표 재확인
  const postBtnCoord = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText && b.innerText.trim() === '게시');
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    if (rect.width === 0) return null;
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, disabled: btn.disabled };
  });
  console.log('게시버튼 좌표:', JSON.stringify(postBtnCoord));

  if (!postBtnCoord) {
    console.log('❌ 게시버튼 없음');
    await b.close(); return;
  }

  // 좌표로 게시버튼 클릭
  await page.mouse.click(postBtnCoord.x, postBtnCoord.y);
  console.log('게시버튼 좌표 클릭!');
  await sleep(6000);

  // 결과 확인
  const afterUrl = page.url();
  console.log('게시 후 URL:', afterUrl);

  // 프로필 확인
  try {
    await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {}
  await sleep(3000);

  const profileText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  const found = profileText.includes('부동산');
  console.log('게시 확인:', found ? '✅ 성공!' : '❌ 미확인');
  if (found) {
    // 해당 부분 추출
    const idx = profileText.indexOf('부동산');
    console.log('내용 확인:', profileText.substring(Math.max(0, idx - 20), idx + 100));
  }

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

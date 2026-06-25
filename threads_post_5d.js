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

  console.log('=== 5번 포스팅 ===');

  // 홈 이동
  try { await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 20000 }); } catch(e) {}
  await sleep(3000);

  // 작성창 열기 - 좌표 클릭
  await page.mouse.click(860, 96);
  await sleep(2500);

  // 모달 안 게시 버튼 목록 확인
  const modalBtns = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return { modal: false };
    const btns = Array.from(modal.querySelectorAll('button, [role="button"]'));
    return {
      modal: true,
      buttons: btns.map(b => {
        const rect = b.getBoundingClientRect();
        return {
          text: b.innerText?.trim().substring(0, 30),
          disabled: b.disabled,
          ariaDisabled: b.getAttribute('aria-disabled'),
          visible: rect.width > 0 && rect.height > 0,
          x: Math.round(rect.x + rect.width / 2),
          y: Math.round(rect.y + rect.height / 2)
        };
      }).filter(b => b.visible)
    };
  });
  console.log('모달 버튼:', JSON.stringify(modalBtns, null, 2));

  // 모달 입력창 클릭
  const editorEl = await page.$('[role="dialog"] [contenteditable="true"]') || await page.$('[contenteditable="true"]');
  if (!editorEl) { console.log('❌ 입력창 없음'); await b.close(); return; }
  await editorEl.click({ force: true });
  await sleep(500);

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
    const el = document.querySelector('[role="dialog"] [contenteditable="true"]') || document.querySelector('[contenteditable="true"]');
    return el ? el.innerText.trim().length : 0;
  });
  console.log('입력 글자수:', len);

  // 모달 안 "게시" 버튼 찾기
  const postCoord = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    const container = modal || document;
    const btns = Array.from(container.querySelectorAll('button, [role="button"]'));
    const postBtns = btns.filter(b => b.innerText && b.innerText.trim() === '게시');
    return postBtns.map(b => {
      const rect = b.getBoundingClientRect();
      return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        disabled: b.disabled || b.getAttribute('aria-disabled') === 'true',
        y_raw: rect.y
      };
    });
  });
  console.log('게시버튼 전체:', JSON.stringify(postCoord));

  // y가 200 이상인 버튼 (모달 내부 버튼) 선택
  const modalPostBtn = postCoord.find(b => !b.disabled && b.y_raw > 200) || postCoord.find(b => !b.disabled);
  if (!modalPostBtn) { console.log('❌ 게시버튼 없음'); await b.close(); return; }

  console.log('클릭할 게시버튼:', JSON.stringify(modalPostBtn));
  await page.mouse.click(modalPostBtn.x, modalPostBtn.y);
  console.log('게시버튼 클릭!');
  await sleep(6000);

  // 프로필 확인
  try { await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await sleep(3000);

  const profileText = await page.evaluate(() => document.body.innerText.substring(0, 1200));
  const found = profileText.includes('부동산');
  console.log('\n게시 결과:', found ? '✅ 성공!' : '❌ 미확인');
  if (found) {
    const idx = profileText.indexOf('부동산');
    console.log(profileText.substring(Math.max(0, idx - 30), idx + 120));
  } else {
    console.log(profileText.substring(0, 500));
  }

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

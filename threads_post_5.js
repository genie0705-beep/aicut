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

  console.log('=== 5번 포스팅 시작: 부동산 유튜브 ===');

  // 홈 이동
  try {
    await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch(e) {}
  await sleep(3000);
  console.log('URL:', page.url());

  // 작성 버튼 - Playwright locator로 클릭 (React 이벤트 정상 트리거)
  const writeBtn = page.getByText('새로운 소식이 있나요?', { exact: true });
  const writeBtnCount = await writeBtn.count();
  console.log('작성버튼 개수:', writeBtnCount);

  if (writeBtnCount > 0) {
    await writeBtn.first().click();
    console.log('작성버튼 클릭 (locator)');
  } else {
    // 폴백: role=button으로 찾기
    const fallback = page.locator('button, [role="button"]').filter({ hasText: '새로운 소식' });
    if (await fallback.count() > 0) {
      await fallback.first().click();
      console.log('작성버튼 클릭 (fallback)');
    } else {
      console.log('❌ 작성버튼 없음');
      await b.close(); return;
    }
  }
  await sleep(2500);

  // 입력창 대기
  const editor = page.locator('[contenteditable="true"]').first();
  await editor.waitFor({ timeout: 8000 });
  await editor.click();
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

  const len = await editor.evaluate(el => el.innerText.trim().length);
  console.log('입력 글자수:', len);

  if (len < 5) {
    console.log('❌ 입력 실패');
    await b.close(); return;
  }

  // 게시 버튼 - Playwright locator로 클릭
  const postBtn = page.locator('button, [role="button"]').filter({ hasText: /^게시$/ });
  const postBtnCount = await postBtn.count();
  console.log('게시버튼 개수:', postBtnCount);

  if (postBtnCount === 0) {
    console.log('❌ 게시버튼 없음');
    await b.close(); return;
  }

  // 비활성화 여부 확인
  const isDisabled = await postBtn.first().evaluate(el =>
    el.disabled || el.getAttribute('aria-disabled') === 'true'
  );
  console.log('게시버튼 비활성화:', isDisabled);

  if (isDisabled) {
    console.log('❌ 게시버튼 비활성화');
    await b.close(); return;
  }

  // 실제 클릭 (Playwright native - React 이벤트 정상 동작)
  await postBtn.first().click();
  console.log('게시버튼 클릭!');

  // 게시 완료 대기 (모달 닫힘 또는 피드로 복귀)
  await sleep(6000);

  // 프로필 확인
  try {
    await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {}
  await sleep(3000);

  const profileText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  const found = profileText.includes('부동산');
  console.log('\n프로필에서 부동산 포스팅 확인:', found ? '✅ 발견!' : '❌ 없음');
  if (!found) {
    console.log('--- 프로필 최신 내용 (앞 400자) ---');
    console.log(profileText.substring(0, 400));
  }

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

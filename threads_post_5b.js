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

  console.log('=== 5번 포스팅 시작 ===');

  try {
    await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch(e) {}
  await sleep(3000);
  console.log('URL:', page.url());

  // 작성 버튼 클릭
  const writeBtn = page.getByText('새로운 소식이 있나요?', { exact: true });
  await writeBtn.first().click();
  console.log('작성버튼 클릭');
  await sleep(2500);

  // 입력창
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

  // 게시 버튼 모두 찾아서 정보 출력
  const allPostBtns = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    return btns
      .filter(b => b.innerText && b.innerText.trim() === '게시')
      .map((b, i) => {
        const rect = b.getBoundingClientRect();
        return {
          index: i,
          disabled: b.disabled,
          ariaDisabled: b.getAttribute('aria-disabled'),
          visible: rect.width > 0 && rect.height > 0,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height)
        };
      });
  });
  console.log('게시버튼 목록:', JSON.stringify(allPostBtns, null, 2));

  // 클릭 가능하고 보이는 버튼 중 마지막 것 (모달 안의 게시 버튼)
  const clickable = allPostBtns.filter(b => !b.disabled && b.ariaDisabled !== 'true' && b.visible && b.y > 100);
  console.log('클릭 가능한 버튼:', JSON.stringify(clickable));

  if (clickable.length === 0) {
    console.log('❌ 클릭 가능한 게시버튼 없음');
    await b.close(); return;
  }

  // 좌표로 직접 클릭
  const target = clickable[clickable.length - 1];
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  console.log(`게시버튼 좌표 클릭: (${cx}, ${cy})`);
  await page.mouse.click(cx, cy);
  console.log('클릭 완료!');

  await sleep(6000);

  // 프로필 확인
  try {
    await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {}
  await sleep(3000);

  const profileText = await page.evaluate(() => document.body.innerText.substring(0, 800));
  const found = profileText.includes('부동산');
  console.log('\n부동산 포스팅 확인:', found ? '✅ 성공!' : '❌ 미확인');
  console.log(profileText.substring(0, 400));

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

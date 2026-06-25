const { chromium } = require('playwright');

const POST_TEXT = `병원 마케팅에서 영상이 중요한 이유 🏥

진료과 소개, 의료진 인터뷰, 시술 과정 —
이런 영상을 매달 꾸준히 올려야 효과가 나요.

에이컷은 병원·의원 영상 전문으로도 제작합니다 💊

#병원마케팅 #의원홍보 #브랜드영상`;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const page = ctx.pages()[0];

  // 다이얼로그 무시 (에러 없이)
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  try {
    await page.goto('https://www.threads.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch(e) {}
  await sleep(3000);
  console.log('URL:', page.url());

  // 새 스레드 작성 버튼
  const opened = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText && b.innerText.trim().includes('새로운 소식'));
    if (btn) { btn.click(); return true; }
    return false;
  });
  console.log('작성창 열기:', opened);
  if (!opened) { console.log('❌ 버튼 없음'); await b.close(); return; }
  await sleep(2500);

  // 입력창 클릭
  await page.evaluate(() => {
    const el = document.querySelector('[contenteditable="true"]');
    if (el) { el.focus(); el.click(); }
  });
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
    const el = document.querySelector('[contenteditable="true"]');
    return el ? el.innerText.trim().length : 0;
  });
  console.log('입력 글자수:', len);
  if (len < 5) { console.log('❌ 입력 실패'); await b.close(); return; }

  // 게시 버튼 클릭
  const result = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, [role="button"]'));
    const btn = btns.find(b => b.innerText && b.innerText.trim() === '게시');
    if (!btn) return 'no_btn';
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return 'disabled';
    btn.click();
    return 'clicked';
  });
  console.log('게시 버튼:', result);
  await sleep(5000);

  // 게시 후 프로필에서 최신 글 확인
  try {
    await page.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch(e) {}
  await sleep(3000);

  const latest = await page.evaluate(() => {
    return document.body.innerText.substring(0, 600);
  });
  console.log('\n--- 프로필 최신 내용 ---');
  console.log(latest);

  await b.close();
})().catch(e => console.error('Fatal:', e.message.split('\n')[0]));

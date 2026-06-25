// 힉스필드 릴스 생성 - 직접 실행
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let p = null;
  for (const page of ctx.pages()) {
    if (page.url().includes('higgsfield')) { p = page; break; }
  }
  if (!p) { console.log('힉스필드 탭 없음'); process.exit(1); }

  // 1) AVATAR 탭 먼저 확인
  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel', {
    waitUntil: 'domcontentloaded', timeout: 20000
  }).catch(() => {});
  await p.waitForTimeout(4000);

  // AVATAR 탭 클릭
  const btns = await p.$$('button, a, span, div');
  for (const btn of btns) {
    const txt = await btn.innerText().catch(() => '');
    if (txt.trim() === 'AVATAR' || txt.trim() === 'Avatar') {
      const vis = await btn.isVisible().catch(() => false);
      if (vis) {
        console.log('AVATAR 탭 클릭');
        await btn.click({ force: true });
        await p.waitForTimeout(3000);
        break;
      }
    }
  }

  // AVATAR 페이지 내용 확인
  const body = await p.evaluate(() => document.body.innerText.substring(0, 2000)).catch(() => '');
  console.log('AVATAR 페이지:', body);

  // 입력창에 프롬프트 입력
  const textarea = await p.$('textarea');
  if (textarea) {
    const promptText = `A Korean woman in her 30s, professional office look, standing in a real estate office with monitors and documents on desk. She looks at the camera and speaks naturally in Korean. Bright professional lighting. Realistic style.`;
    
    await textarea.click({ force: true });
    await p.waitForTimeout(500);
    await textarea.fill(promptText);
    await p.waitForTimeout(500);
    console.log('✅ 프롬프트 입력 완료');
  }

  try { await b.close(); } catch(e) {}
})();

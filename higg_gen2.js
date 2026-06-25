// 힉스필드 - JS로 직접 Generate 클릭
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel').catch(() => {});
  await p.waitForTimeout(4000);

  // Instagram Reels 버튼 클릭
  await p.evaluate(() => {
    const all = document.querySelectorAll('button, a, span, div');
    for (const el of all) {
      if (el.innerText && el.innerText.trim() === 'Instagram Reels') {
        el.click();
        return;
      }
    }
  });
  await p.waitForTimeout(1000);

  // 프롬프트 입력
  const ta = await p.$('textarea');
  if (ta) {
    await ta.evaluate(el => {
      el.value = '';
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(el, 'A Korean woman in her early 30s, professional business look, standing in a modern real estate office. She smiles and speaks to the camera in Korean. Warm lighting, photorealistic, cinematic. Instagram Reels vertical.');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    console.log('✅ 프롬프트 입력');
  }

  await p.waitForTimeout(1000);

  // Generate 버튼 JS로 클릭
  const clicked = await p.evaluate(() => {
    const all = document.querySelectorAll('button');
    for (const el of all) {
      if (el.innerText && el.innerText.trim() === 'Generate') {
        el.click();
        return 'clicked';
      }
    }
    // span으로 시도
    const all2 = document.querySelectorAll('span, div, a');
    for (const el of all2) {
      if (el.innerText && el.innerText.trim() === 'Generate') {
        el.click();
        return 'span clicked';
      }
    }
    return 'not found';
  });
  console.log('Generate:', clicked);

  await p.waitForTimeout(5000);

  // 생성 진행 상태 확인
  const body = await p.evaluate(() => document.body.innerText.substring(0, 800)).catch(() => '');
  console.log('상태:', body);

  try { await b.close(); } catch (e) {}
})();

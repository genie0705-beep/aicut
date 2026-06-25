// 최종: 프롬프트 입력 + Generate
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel').catch(() => {});
  await p.waitForTimeout(4000);

  // 프롬프트 입력
  const prompt = `A professional Korean woman in her early 30s with natural makeup, neat business hairstyle, wearing a white blouse, sitting in a bright modern office. She looks directly at the camera with a warm smile and speaks naturally with gentle hand gestures. Clean minimal background with soft natural window lighting. Warm color tone, shallow depth of field, cinematic quality, photorealistic. No screens, no monitors, no phones, no text. Instagram Reels 9:16 vertical format.`;

  const ta = await p.$('textarea');
  if (ta) {
    await ta.evaluate((el, t) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      s.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      s.call(el, t);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, prompt);
    console.log('✅ 프롬프트 입력 완료');
  }

  await p.waitForTimeout(500);

  // Generate 클릭
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await p.evaluate(() => {
      const all = document.querySelectorAll('button, span, a, div');
      for (const el of all) {
        if (el.innerText && el.innerText.trim() === 'Generate') {
          el.click();
          return 'clicked';
        }
      }
      return 'not found';
    });
    if (r === 'clicked') {
      console.log('✅ Generate 버튼 클릭 성공!');
      break;
    }
    await p.waitForTimeout(1000);
  }

  console.log('\n🎬 영상 생성이 시작되었습니다!');
  console.log('브라우저에서 생성 진행 상황을 확인해보세요.');

  try { await b.close(); } catch (e) {}
})();

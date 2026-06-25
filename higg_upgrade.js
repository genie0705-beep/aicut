// 힉스필드 - 업그레이드 프롬프트 입력 + Generate
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel').catch(() => {});
  await p.waitForTimeout(4000);

  const prompt = `Cinematic close-up shot of a professional Korean woman in her early 30s with natural dewy makeup, neatly styled dark brown hair, wearing a crisp white silk blouse and a thin gold necklace. She is seated in a softly lit modern office space. She looks directly into the camera lens with confident and warm eye contact, speaking naturally as if having a one-on-one consultation. She uses subtle hand gestures while speaking. The background is clean and minimal with blurred out office elements, creating a shallow depth of field effect. Lighting is soft natural window light coming from the left side, with warm color tones. Skin texture is realistic with natural details. Cinematic color grading. Ultra realistic, 4K resolution, professional film look. No screens, no monitors, no phones, no text, no logos. Shot on professional cinema camera. Instagram Reels 9:16 vertical aspect ratio.`;

  const ta = await p.$('textarea');
  if (ta) {
    await ta.evaluate((el, t) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      s.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      s.call(el, t);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, prompt);
    console.log('✅ 업그레이드 프롬프트 입력 완료!');
    console.log('길이: ' + prompt.length + '자 (더 디테일하게)');
  }

  await p.waitForTimeout(500);

  // Generate
  await p.evaluate(() => {
    const all = document.querySelectorAll('button, span, a, div');
    for (const el of all) {
      if (el.innerText && el.innerText.trim() === 'Generate') {
        el.click();
        return;
      }
    }
  });
  console.log('✅ Generate 실행!');

  try { await b.close(); } catch (e) {}
})();

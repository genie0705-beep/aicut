// 힉스필드 최종 프롬프트 - 모니터/핸드폰/한글 모두 제외
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel').catch(() => {});
  await p.waitForTimeout(4000);

  // 모니터/핸드폰/한글 제외, 한국인 여성만 집중
  const prompt = `A professional Korean woman in her early 30s with natural makeup, neat business hairstyle, wearing a white blouse, sitting in a bright modern office. She looks directly at the camera with a warm smile and speaks naturally with gentle hand gestures. Clean minimal background with soft natural window lighting. Warm color tone, shallow depth of field, cinematic quality, photorealistic. No screens, no monitors, no phones, no text. Just the woman speaking naturally. Instagram Reels 9:16 vertical format.`;

  const ta = await p.$('textarea');
  if (ta) {
    await ta.evaluate((el, t) => {
      const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      s.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      s.call(el, t);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, prompt);
    console.log('✅ 최종 프롬프트 업데이트 완료!');
    console.log('');
    console.log('제외된 요소:');
    console.log('  ❌ 모니터 화면 (부자연스러움)');
    console.log('  ❌ 핸드폰 화면 (부자연스러움)');
    console.log('  ❌ 한글 텍스트 (변형됨)');
    console.log('  ❌ 로고 이미지 (AI 생성 한계)');
    console.log('');
    console.log('집중한 요소:');
    console.log('  ✅ 한국인 여성 30대, 자연스러운 비주얼');
    console.log('  ✅ 중간 클로즈업, 카메라 응시');
    console.log('  ✅ 부드러운 자연광, 깔끔한 배경');
    console.log('  ✅ 시네마틱 + 포토리얼리스틱');
    console.log('  ✅ No screens, no text, just the person');
  }

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
  console.log('\n🎬 Generate 실행!');
  console.log('생성 완료 후 편집기에서 로고+텍스트+TTS 추가하세요.');

  try { await b.close(); } catch (e) {}
})();

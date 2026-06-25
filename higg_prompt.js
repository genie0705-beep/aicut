// 힉스필드 프롬프트 업그레이드
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  let p = null;
  for (const pg of ctx.pages()) { if (pg.url().includes('higgsfield')) { p = pg; break; } }

  await p.goto('https://higgsfield.ai/sora-trends/instagram-reel').catch(() => {});
  await p.waitForTimeout(4000);

  const prompt = `A professional Korean woman in her early 30s with natural makeup and neat business hairstyle, wearing a clean white blouse, standing in a bright modern real estate office with large windows showing city view. Monitors and documents on desk behind her. She smiles warmly and speaks directly to the camera with natural hand gestures, as if giving a friendly business consultation. Soft natural window lighting, warm color tone, photorealistic quality. Professional cinematography, shallow depth of field. Instagram Reels 9:16 vertical format. Korean female presenter style. Cinematic, realistic, ultra HD.`;

  const ta = await p.$('textarea');
  if (ta) {
    await ta.evaluate((el, t) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      setter.call(el, t);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, prompt);
    console.log('✅ 업그레이드된 프롬프트 입력!');
    console.log('포함된 디테일:');
    console.log('  ① 한국인 여성 30대, 자연스러운 메이크업');
    console.log('  ② 비즈니스 룩 (화이트 블라우스)');
    console.log('  ③ 밝은 부동산 사무실, 대형 창문 + 도시뷰');
    console.log('  ④ 자연스러운 손동작, 카메라 응시');
    console.log('  ⑤ 창문을 통한 부드러운 자연광');
    console.log('  ⑥ 시네마틱, 얕은 심도, 포토리얼리스틱');
  }

  // Generate 버튼 찾아서 JS 클릭
  await p.evaluate(() => {
    const all = document.querySelectorAll('button, span, a');
    for (const el of all) {
      if (el.innerText && el.innerText.trim() === 'Generate') {
        el.click();
        console.log('Generate clicked');
        return;
      }
    }
  });

  console.log('\n🎬 생성 시작! 브라우저에서 결과를 확인해보세요.');
  console.log('    (생성에 1~3분 정도 소요될 수 있습니다)');

  try { await b.close(); } catch (e) {}
})();

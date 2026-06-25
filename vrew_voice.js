// Vrew - AI 목소리 대본 입력
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let vrew = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('vrew')) { vrew = p; break; }
  }
  if (!vrew) { console.log('Vrew 탭 없음'); process.exit(1); }

  // AI 목소리 버튼 클릭
  const allEls = await vrew.$$('button, a, span, div');
  for (const el of allEls) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === 'AI 목소리') {
      await el.click({ force: true });
      await vrew.waitForTimeout(2000);
      console.log('✅ AI 목소리 클릭');
      break;
    }
  }

  // AI 목소리 패널 확인
  const body = await vrew.evaluate(() => document.body.innerText.substring(0, 2000)).catch(() => '');
  console.log('AI 목소리 패널:', body);

  // 대본 입력창 찾기 (textarea)
  const textareas = await vrew.$$('textarea, [contenteditable="true"], input[type="text"]');
  console.log(`입력창: ${textareas.length}개`);
  for (const ta of textareas) {
    const ph = await ta.getAttribute('placeholder').catch(() => '');
    const vis = await ta.isVisible().catch(() => false);
    if (vis) console.log(`  visible="${ph?.substring(0, 40)}"`);
  }

  // 생성 버튼 찾기
  for (const el of await vrew.$$('button, a, span, div')) {
    const txt = await el.innerText().catch(() => '');
    if (txt.includes('생성') || txt.includes('Generate') || txt.includes('적용') || txt.includes('완료')) {
      const vis = await el.isVisible().catch(() => false);
      if (vis) console.log(`  버튼: "${txt.trim().substring(0, 30)}" vis=${vis}`);
    }
  }

  try { await b.close(); } catch (e) {}
})();

// Vrew 새 프로젝트 + 영상 불러오기
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  let vrew = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('vrew')) { vrew = p; break; }
  }
  if (!vrew) { console.log('Vrew 탭 없음'); process.exit(1); }

  // 새 프로젝트 시작하기
  const all1 = await vrew.$$('button, a, span, div');
  for (const el of all1) {
    const txt = await el.innerText().catch(() => '');
    if (txt.trim() === '새 프로젝트 시작하기') {
      await el.click({ force: true });
      await vrew.waitForTimeout(3000);
      console.log('✅ 새 프로젝트 시작');
      break;
    }
  }

  // 편집기 화면 확인
  const body = await vrew.evaluate(() => document.body.innerText.substring(0, 800)).catch(() => '');
  console.log('편집기:', body);

  // 비디오 가져오기 버튼 찾기
  const all2 = await vrew.$$('button, a, span, div');
  for (const el of all2) {
    const txt = await el.innerText().catch(() => '');
    if (txt.includes('가져오기') || txt.includes('Import') || txt.includes('영상') || txt.includes('파일')) {
      console.log('찾음:', txt.trim().substring(0, 30));
    }
  }

  // AI 목소리 찾기
  for (const el of await vrew.$$('button, a, span, div')) {
    const txt = await el.innerText().catch(() => '');
    if (txt.includes('AI 목소리') || txt.includes('TTS') || txt.includes('Voice')) {
      console.log('AI 목소리:', txt.trim().substring(0, 30));
    }
  }

  try { await b.close(); } catch (e) {}
})();

const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // 장맛비 탭 찾기 (두 번째 PostWriteForm)
  let targetTab = null;
  let idx = 0;
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;
    if (idx === 1) { targetTab = p; break; }
    idx++;
  }

  if (!targetTab) { console.log('장맛비 탭 없음'); b.close(); return; }

  await targetTab.bringToFront();
  await sleep(2000);
  const f = targetTab.frames().find(ff => ff.url().includes('PostWriteForm'));

  console.log('=== 🌧 장맛비 CTA 이메일 추가 + H2/Strong 보완 ===\n');

  // 1. CTA 이메일 추가 타이핑
  console.log('[1/3] CTA 이메일 추가...');
  await f.evaluate(() => document.body.click());
  await sleep(500);

  // 에디터 끝으로 이동 (맨 아래로)
  await targetTab.keyboard.press('Control+End');
  await sleep(500);
  await targetTab.keyboard.press('Enter');
  await sleep(200);

  // CTA 이메일 문장 타이핑
  const ctaEmail = '📧 이메일: master@aicut.co.kr';
  await targetTab.keyboard.type(ctaEmail, { delay: 15 });
  await targetTab.keyboard.press('Enter');

  // CTA 카카오톡도 확인차 추가
  const ctaKakao = '💬 카카오톡: https://pf.kakao.com/_GIesX/chat';
  await targetTab.keyboard.type(ctaKakao, { delay: 15 });
  await targetTab.keyboard.press('Enter');

  // 홈페이지도
  const ctaWeb = '🌐 홈페이지: https://aicut.co.kr';
  await targetTab.keyboard.type(ctaWeb, { delay: 15 });
  console.log('  ✅ CTA 3종 추가 완료');
  await sleep(1000);

  // 2. 프로야구 탭에도 CTA 확인 (첫 번째 탭)
  console.log('\n[2/3] ⚾ 프로야구 CTA 확인...');
  let baseballTab = null;
  idx = 0;
  for (const p of ctx.pages()) {
    const f2 = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f2) continue;
    if (idx === 0) { baseballTab = p; break; }
    idx++;
  }

  if (baseballTab) {
    await baseballTab.bringToFront();
    await sleep(1500);
    const f2 = baseballTab.frames().find(ff => ff.url().includes('PostWriteForm'));

    // CTA 확인
    const hasEmail = await f2.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      return JSON.stringify(data).includes('master@aicut.co.kr');
    });

    if (!hasEmail) {
      await f2.evaluate(() => document.body.click());
      await sleep(300);
      await baseballTab.keyboard.press('Control+End');
      await sleep(500);
      await baseballTab.keyboard.press('Enter');
      await baseballTab.keyboard.type('📧 이메일: master@aicut.co.kr', { delay: 15 });
      await baseballTab.keyboard.press('Enter');
      console.log('  ✅ CTA 이메일 추가 완료');
    } else {
      console.log('  ✅ CTA 이메일 이미 있음');
    }
  }

  // 3. 두 탭 모두 저장
  console.log('\n[3/3] 저장...');
  for (const p of ctx.pages()) {
    const ff = p.frames().find(fff => fff.url().includes('PostWriteForm'));
    if (!ff) continue;
    await p.bringToFront();
    await sleep(1000);
    await ff.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim() === '저장') { b.click(); return; }
      }
    });
    await sleep(2000);
  }

  console.log('  ✅ 두 포스팅 저장 완료');

  // 최종 검증
  console.log('\n━━━ 📋 최종 검증 ━━━');
  const labels = ['⚾ 프로야구', '🌧 장맛비'];
  idx = 0;
  for (const p of ctx.pages()) {
    const ff = p.frames().find(fff => fff.url().includes('PostWriteForm'));
    if (!ff) continue;
    const info = await ff.evaluate(() => {
      const data = SmartEditor._editors.blogpc001._documentService.getDocumentData();
      const str = JSON.stringify(data);
      return {
        len: str.length,
        hasEmail: str.includes('master@aicut.co.kr'),
        hasKakao: str.includes('pf.kakao.com'),
        hasWeb: str.includes('aicut.co.kr'),
        hashCount: (str.match(/#/g) || []).length
      };
    });
    console.log(`${labels[idx]}:`);
    console.log(`  본문: ${(info.len/1024).toFixed(0)}KB | CTA: ${info.hasEmail ? '✅' : '❌'}이메일 ${info.hasKakao ? '✅' : '❌'}카톡 ${info.hasWeb ? '✅' : '❌'}홈페이지`);
    console.log(`  해시태그: ${info.hashCount}개`);
    idx++;
  }

  console.log('\n✅ 수정 완료');
  console.log('  (H2/Strong 서식은 SmartEditor 툴바에서 직접 적용 필요)');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

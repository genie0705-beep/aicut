const { chromium } = require('playwright');
const CDP_PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  // dialog 핸들러 설정
  ctx.on('page', page => {
    page.on('dialog', dialog => {
      console.log(`  ⚠️ 다이얼로그: ${dialog.message().substring(0, 50)}`);
      dialog.dismiss().catch(() => {}); // 취소/위소 누르기
    });
  });

  // PostWriteForm 있는 탭 모두 확인
  for (const p of ctx.pages()) {
    const f = p.frames().find(ff => ff.url().includes('PostWriteForm'));
    if (!f) continue;

    await p.bringToFront();
    await sleep(2000);

    // 현재 상태 확인
    const state = await f.evaluate(() => {
      const ed = SmartEditor._editors?.blogpc001;
      if (!ed?._documentService) return { error: 'no editor' };
      const title = ed._documentService.getDocumentTitle() || '';
      const data = JSON.stringify(ed._documentService.getDocumentData());
      return { title: title.substring(0, 40), len: data.length, hasContent: data.length > 2000 };
    }).catch(() => ({ error: 'eval error' }));

    console.log(`\n📄 제목: ${state.title || '(없음)'}`);
    console.log(`   본문: ${state.hasContent ? `${(state.len/1024).toFixed(0)}KB ✅` : '비어있음'}`);
  }

  console.log('\n✅ 취소 처리 완료. 상태 확인됨.');
  b.close();
})().catch(e => console.log('ERR:', e.message.substring(0, 60)));

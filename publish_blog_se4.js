const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const bp = await ctx.newPage();
  await bp.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await bp.waitForTimeout(3000);

  const ef = bp.frames().find(f => f.url().includes('PostWriteForm'));
  if (!ef) return console.log('no editor frame');

  // Set title
  await ef.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상 편집 외주, 처음이라면 꼭 물어봐야 할 5가지');
  });
  console.log('Title set');

  // Simple text-only content for the body (works better with SE4)
  const content = '"영상 편집 외주, 한 번 맡겨볼까?"\n\n마케팅을 담당하게 되면 한 번쯤 하는 고민입니다. 외주를 처음 맡길 때 꼭 체크해야 할 5가지를 정리했습니다.\n\n1. 우리 스타일을 이해하고 있나요?\n브랜드 컬러, 폰트, 톤앤매너, 레퍼런스를 공유하세요.\n\n2. 수정 범위와 횟수는?\n기본 수정 횟수, 추가 비용, 오탈자 수정 여부를 확인하세요.\n\n3. 납품 일정은?\n원본 전송 후 며칠? 긴급 건 가능 여부를 물어보세요.\n\n4. 저작권과 소유권은?\n결과물 소유권, BGM/폰트 라이선스를 확인하세요.\n\n5. 우리 업종 사례가 있나요?\n우리 업종 경험이 있는 외주사가 훨씬 빠릅니다.\n\n외주사 선택 5가지 체크리스트\n① 브랜드 이해도 → ② 수정 범위 → ③ 납품 일정 → ④ 저작권 → ⑤ 포트폴리오\n\n에이컷 — 48시간 숏폼 영상 편집 구독 서비스\n📬 pf.kakao.com/_GIesX/chat | master@aicut.co.kr | aicut.co.kr';

  // Method 1: Try _editingService.write
  const r1 = await ef.evaluate((text) => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (ed._editingService && ed._editingService.write) {
        ed._editingService.write(text);
        return 'write OK';
      }
      // Try alternate methods
      if (ed._documentService && ed._documentService.setContents) {
        ed._documentService.setContents(text);
        return 'setContents OK';
      }
      // Try pasteHtml
      if (ed._editingService && ed._editingService.pasteHtml) {
        ed._editingService.pasteHtml(text);
        return 'pasteHtml OK';
      }
      return 'no method found';
    } catch (e) { return 'error: ' + e.message; }
  }, content);
  console.log('Method1:', r1);

  await ef.waitForTimeout(1000);

  // Save
  await ef.evaluate(() => {
    try { SmartEditor._editors['blogpc001'].saveDraft(); } catch (e) {}
  });
  console.log('Draft saved');

  // Verify content was set by reading it back
  const verify = await ef.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      if (ed._editingService && ed._editingService.getContents) {
        return ed._editingService.getContents().substring(0, 200);
      }
      return 'cannot verify';
    } catch (e) { return 'verify error'; }
  });
  console.log('Content after save:', verify);
  console.log('DONE');
})();

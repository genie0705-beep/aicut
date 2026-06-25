const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const bp = ctx.pages().find(x => x.url().includes('blog.naver'));
  if (!bp) return console.log('no blog tab');

  const frames = bp.frames();
  const ef = frames.find(f => f.url().includes('PostWriteForm'));
  if (!ef) return console.log('no editor frame');

  // Set title
  await ef.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상 편집 외주, 처음이라면 꼭 물어봐야 할 5가지');
  });
  console.log('Title set');

  // Copy content to clipboard in the main page context
  const htmlContent = `<div style="text-align:center;">
<p><b>"영상 편집 외주, 한 번 맡겨볼까?"</b></p>
<p>외주를 처음 맡길 때 꼭 체크해야 할 <b>5가지</b>를 정리했습니다.</p>
</div>
<h2 style="text-align:center;">1. 우리 스타일을 이해하고 있나요?</h2>
<div style="text-align:center;"><p>브랜드 컬러, 폰트, 톤앤매너, 레퍼런스를 공유하세요.</p></div>
<h2 style="text-align:center;">2. 수정 범위와 횟수는?</h2>
<div style="text-align:center;"><p>기본 수정 횟수, 추가 비용, 오탈자 수정 여부를 확인하세요.</p></div>
<h2 style="text-align:center;">3. 납품 일정은?</h2>
<div style="text-align:center;"><p>원본 전송 후 며칠? 긴급 건 가능 여부를 물어보세요.</p></div>
<h2 style="text-align:center;">4. 저작권과 소유권은?</h2>
<div style="text-align:center;"><p>결과물 소유권, BGM/폰트 라이선스를 확인하세요.</p></div>
<h2 style="text-align:center;">5. 우리 업종 사례가 있나요?</h2>
<div style="text-align:center;"><p>우리 업종 경험이 있는 외주사가 훨씬 빠릅니다.</p></div>
<div style="text-align:center;background:#F5F6FA;padding:20px;border-radius:12px;margin:16px 0;">
<p style="font-size:16px;font-weight:700;color:#5C3DE8;">외주사 선택 5가지 체크리스트</p>
<p>① 브랜드 이해도 → ② 수정 범위 → ③ 납품 일정 → ④ 저작권 → ⑤ 포트폴리오</p>
</div>
<div style="text-align:center;font-size:12px;color:#999;">
<p>에이컷 — 48시간 숏폼 영상 편집 구독 서비스</p>
<p>📬 pf.kakao.com/_GIesX/chat | master@aicut.co.kr | aicut.co.kr</p>
</div>`;

  // Use evaluate to write to clipboard
  await bp.evaluate((html) => {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
      })
    ]);
  }, htmlContent);
  console.log('Clipboard written');
  await bp.waitForTimeout(500);

  // Paste into editor iframe
  await ef.evaluate(() => {
    const editorBody = document.querySelector('#smartEditorBody') || document.querySelector('[contenteditable]');
    if (editorBody) {
      editorBody.focus();
      editorBody.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true }));
    }
  });
  console.log('Paste event sent');
  await ef.waitForTimeout(1000);

  // Save draft
  await ef.evaluate(() => {
    try { SmartEditor._editors['blogpc001'].saveDraft(); } catch(e) {}
  });
  console.log('Draft saved');
  console.log('DONE');
})();

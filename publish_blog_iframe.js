const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const bp = ctx.pages().find(x => x.url().includes('blog.naver.com/aicut'));
  if (!bp) return console.log('no blog');

  await bp.bringToFront();
  await bp.waitForTimeout(1000);

  // Get the iframe frame
  const frames = bp.frames();
  const editorFrame = frames.find(f => f.url().includes('PostWriteForm'));
  if (!editorFrame) return console.log('no editor frame');

  console.log('Editor frame URL:', editorFrame.url().substring(0, 100));

  // Wait for SmartEditor in iframe
  await editorFrame.waitForTimeout(2000);

  const hasEditor = await editorFrame.evaluate(() => typeof SmartEditor !== 'undefined');
  console.log('Has SmartEditor in iframe:', hasEditor);

  if (hasEditor) {
    // Set title
    await editorFrame.evaluate(() => {
      SmartEditor._editors['blogpc001'].setDocumentTitle('영상 편집 외주, 처음이라면 꼭 물어봐야 할 5가지');
    });
    console.log('Title set');

    // Set content
    const content = `<div style="text-align:center;">
<p><b>"영상 편집 외주, 한 번 맡겨볼까?"</b></p>
<p>마케팅을 담당하게 되면 한 번쯤 하는 고민입니다. 하지만 외주를 처음 맡길 때는 뭘 물어봐야 할지 막막합니다. 이 글에서는 <b>반드시 체크해야 할 5가지</b>를 정리했습니다.</p>
</div>
<h2 style="text-align:center;">1. 우리 스타일을 이해하고 있나요?</h2>
<div style="text-align:center;"><p>브랜드 컬러, 폰트, 톤앤매너, 레퍼런스를 공유하면 결과물 퀄리티가 올라갑니다.</p></div>
<h2 style="text-align:center;">2. 수정 범위와 횟수는 어떻게 되나요?</h2>
<div style="text-align:center;"><p>기본 수정 횟수, 추가 비용, 오탈자 수정 가능 여부를 계약 전에 확인하세요.</p></div>
<h2 style="text-align:center;">3. 납품 일정은 어떻게 되나요?</h2>
<div style="text-align:center;"><p>원본 전송 후 결과물까지平均 며칠? 긴급 건 가능 여부? 납품 형식도 확인하세요.</p></div>
<h2 style="text-align:center;">4. 저작권과 소유권은 어떻게 되나요?</h2>
<div style="text-align:center;"><p>결과물 소유권, BGM/폰트 라이선스, 포트폴리오 사용 동의 여부를 확인하세요.</p></div>
<h2 style="text-align:center;">5. 우리 업종 사례가 있나요?</h2>
<div style="text-align:center;"><p>우리 업종 경험이 있는 외주사가 훨씬 빠르고 정확합니다. 포트폴리오를 요청하세요.</p></div>
<div style="text-align:center;background:#F5F6FA;padding:20px;border-radius:12px;margin:16px 0;">
<p style="font-size:16px;font-weight:700;color:#5C3DE8;">외주사 선택 5가지 체크리스트</p>
<p>① 브랜드 이해도 → ② 수정 범위 → ③ 납품 일정 → ④ 저작권 → ⑤ 포트폴리오</p>
</div>
<div style="text-align:center;font-size:12px;color:#999;">
<p>에이컷 — 48시간 숏폼 영상 편집 구독 서비스</p>
<p>📬 pf.kakao.com/_GIesX/chat | master@aicut.co.kr | aicut.co.kr</p>
</div>`;

    await editorFrame.evaluate((html) => {
      try {
        SmartEditor._editors['blogpc001'].setDocumentData(html);
        console.log('Content set successfully');
      } catch(e) {
        console.log('setDocumentData error:', e.message);
        // Clipboard fallback
        navigator.clipboard.writeText(html).then(() => {
          document.querySelector('#smarteditor').focus();
          document.execCommand('paste');
        });
      }
    }, content);

    // Save draft
    await editorFrame.evaluate(() => {
      try {
        SmartEditor._editors['blogpc001'].saveDraft();
        console.log('Draft saved');
      } catch(e) {
        console.log('Save error:', e.message);
      }
    });
    console.log('DONE');
  } else {
    console.log('SmartEditor still not found in iframe');
    const text = await editorFrame.evaluate(() => document.body.innerText.substring(0, 300).replace(/\n/g, ' ').trim());
    console.log('Iframe text:', text);
  }
})();

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = ctx.pages().find(x => x.url().includes('blog.naver.com/aicut'));
  if (!p) return console.log('no blog tab');

  await p.bringToFront();
  await p.waitForTimeout(3000);

  // Check if SmartEditor is loaded
  const hasEditor = await p.evaluate(() => typeof SmartEditor !== 'undefined');
  console.log('SmartEditor:', hasEditor);

  if (hasEditor) {
    // Set title
    await p.evaluate(() => {
      SmartEditor._editors['blogpc001'].setDocumentTitle('영상 편집 외주, 처음이라면 꼭 물어봐야 할 5가지');
    });
    console.log('Title set');

    // Set content HTML
    const content = `<div style="text-align:center;">
<p><b>"영상 편집 외주, 한 번 맡겨볼까?"</b></p>
<p>마케팅을 담당하게 되면 한 번쯤 하는 고민입니다. 하지만 외주를 처음 맡길 때는 뭘 물어봐야 할지 막막하기 마련입니다.</p>
</div>
<h2 style="text-align:center;">1. "우리 스타일을 이해하고 있나요?"</h2>
<div style="text-align:center;">
<p>가장 중요하면서도 가장 간과하기 쉬운 질문입니다. <b>브랜드 가이드라인</b>을 공유하면 결과물의 퀄리티가 올라갑니다.</p>
</div>
<h2 style="text-align:center;">2. "수정 범위와 횟수는 어떻게 되나요?"</h2>
<div style="text-align:center;">
<p>계약 전에 반드시 확인하세요. 기본 수정 횟수, 추가 비용, 오탈자 수정 가능 여부를 미리 확인해야 합니다.</p>
</div>
<h2 style="text-align:center;">3. "납품 일정은 어떻게 되나요?"</h2>
<div style="text-align:center;">
<p>에이컷은 <b>48시간 이내 1차 결과물</b>을 원칙으로 합니다. 원본이 준비되었을 때의 일정과 긴급 건 가능 여부를 확인하세요.</p>
</div>
<h2 style="text-align:center;">4. "저작권과 소유권은 어떻게 되나요?"</h2>
<div style="text-align:center;">
<p>에이컷은 모든 결과물의 저작권을 고객사에 양도합니다. BGM, 폰트, 이미지의 라이선스도 반드시 확인하세요.</p>
</div>
<h2 style="text-align:center;">5. "우리 업종 사례가 있나요?"</h2>
<div style="text-align:center;">
<p>포트폴리오는 외주사의 역량을 가장 잘 보여줍니다. 병원, 부동산, 교육 등 우리 업종 경험이 있는지 꼭 물어보세요.</p>
</div>
<div style="text-align:center;background:#F5F6FA;padding:20px;border-radius:12px;margin:16px 0;">
<p style="font-size:16px;font-weight:700;color:#5C3DE8;">외주사 선택, 이 5가지만 체크하세요</p>
<p style="font-size:13px;">① 브랜드 이해도 → ② 수정 범위 → ③ 납품 일정 → ④ 저작권 → ⑤ 포트폴리오</p>
</div>
<div style="text-align:center;font-size:12px;color:#999;">
<p>에이컷 — 48시간 숏폼 영상 편집 구독 서비스</p>
<p>📬 pf.kakao.com/_GIesX/chat | master@aicut.co.kr | aicut.co.kr</p>
</div>`;

    await p.evaluate((html) => {
      try {
        SmartEditor._editors['blogpc001'].setDocumentData(html);
      } catch(e) {
        console.log('setDocumentData error:', e.message);
      }
    }, content);
    console.log('Content set');

    // Save draft
    await p.evaluate(() => {
      try {
        SmartEditor._editors['blogpc001'].saveDraft();
        console.log('Draft saved');
      } catch(e) {
        console.log('Save error:', e.message);
      }
    });
    console.log('Done');
  } else {
    console.log('SmartEditor not loaded - checking page');
    const info = await p.evaluate(() => ({
      url: window.location.href.substring(0, 100),
      text: document.body.innerText.substring(0, 300).replace(/\n/g, ' ').trim()
    }));
    console.log(JSON.stringify(info));
  }
})();

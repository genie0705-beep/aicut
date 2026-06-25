const { chromium } = require('playwright');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  const p = await ctx.newPage();
  await p.goto('https://blog.naver.com/PostWrite.nhn?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await p.waitForTimeout(4000);

  const info = await p.evaluate(() => ({
    url: window.location.href.substring(0, 100),
    title: document.title,
    hasEditor: typeof SmartEditor !== 'undefined'
  }));
  console.log(JSON.stringify(info));

  if (!info.hasEditor) {
    console.log('SmartEditor not found - try alternative');
    const text = await p.evaluate(() => document.body.innerText.substring(0, 300));
    console.log('Page:', text.replace(/\n/g, ' ').trim());
    return;
  }

  // Set title
  await p.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('월 30만 원으로 시작하는 영상 마케팅, 우리도 가능할까?');
  });
  console.log('Title set');

  // Set content via clipboard method
  const content = `<div style="text-align:center;">
<p><b>"영상 마케팅, 해야 하는 건 알겠는데… 예산이 없어요."</b></p>
<p>많은 소상공인과 스타트업 대표가 하는 말입니다. 유튜브에 "영상 편집 단가"를 검색하면 50만 원, 100만 원, 많게는 500만 원까지. 월 정기로 외주를 맡기기엔 부담스러운 게 현실입니다.</p>
<p>하지만 꼭 그런 건 아닙니다. 에이컷은 <b>월 30만 원대 구독</b>으로 숏폼 영상 편집을 아웃소싱할 수 있는 서비스를 운영 중입니다.</p>
</div>
<h2 style="text-align:center;">영상 마케팅, 꼭 비싸야 할까?</h2>
<div style="text-align:center;">
<p>에이컷의 접근법은 다릅니다. <b>"이미 있는 영상을 가져오면, 우리가 편집해드린다"</b>는 구조입니다. 고객사가 직접 촬영한 원본이 있다면 편집 비용만으로 숏폼 콘텐츠를 정기적으로 생산할 수 있습니다.</p>
</div>
<h2 style="text-align:center;">월 30만 원으로 무엇이 가능할까</h2>
<div style="text-align:center;">
<p>에이컷의 월 구독 결과물:</p>
<ul style="text-align:left;display:inline-block;">
<li><b>숏폼 영상</b> — 15~60초 릴스·쇼츠 최적화</li>
<li><b>카드뉴스형 콘텐츠</b> — 영상+텍스트+이미지</li>
<li><b>정기 납품</b> — 매주/매월 안정적인 볼륨</li>
<li><b>스타일 유지</b> — 브랜드 가이드 지속 반영</li>
</ul>
</div>
<h2 style="text-align:center;">누가 이 서비스를 쓰나요</h2>
<div style="text-align:center;">
<p><b>병원·의원</b> — 원장님 촬영 영상을 릴스용 숏폼으로</p>
<p><b>부동산 중개법인</b> — 매물 영상 SNS 최적화</p>
<p><b>교육·프랜차이즈</b> — 강의·홍보 영상 정기 생산</p>
</div>
<div style="text-align:center;background:#F5F6FA;padding:20px;border-radius:12px;margin:16px 0;">
<p style="font-size:18px;font-weight:700;color:#5C3DE8;">어떻게 시작하나요</p>
<p>① aicut.co.kr 상담 신청 → ② 스타일·주기 협의 → ③ 원본 전송 → 48시간 후 첫 결과물</p>
</div>
<div style="text-align:center;font-size:12px;color:#999;">
<p>에이컷 — 48시간 숏폼 영상 편집 구독 서비스</p>
<p>📬 pf.kakao.com/_GIesX/chat | master@aicut.co.kr | aicut.co.kr</p>
</div>`;

  // Use clipboard
  await p.evaluate((html) => {
    // Try setDocumentData first
    try {
      SmartEditor._editors['blogpc001'].setDocumentData(html);
    } catch(e) {
      console.log('setDocumentData failed:', e.message);
    }
  }, content);
  console.log('Content pasted');

  // Save draft
  await p.evaluate(() => {
    try {
      SmartEditor._editors['blogpc001'].saveDraft();
      console.log('Draft saved');
    } catch(e) {
      console.log('Save failed:', e.message);
    }
  });
  console.log('Done');
})();

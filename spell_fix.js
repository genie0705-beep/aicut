const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  var page = await ctx.newPage();
  page.on('dialog', function(d) { d.dismiss(); });
  await page.setViewportSize({width:1400,height:1000});
  await page.goto('https://blog.naver.com/aicut/postwrite', {waitUntil:'domcontentloaded',timeout:15000});
  await sleep(4000);

  await page.evaluate(function() {
    SmartEditor._editors['blogpc001'].setDocumentTitle('뷰티·화장품 브랜드라면 숏폼 영상 마케팅을 시작해야 하는 이유');
  });
  console.log('1. 제목');

  // 맞춤법 꼼꼼히 확인한 본문
  var h = '<p style="text-align:center;">뷰티·화장품 브랜드를 운영하다 보면</p><p style="text-align:center;">이런 고민, 한 번쯤 해보셨을 겁니다. 💭</p><p style="text-align:center;"><br></p><p style="text-align:center;">&#34;제품 사진은 예쁜데</p><p style="text-align:center;">영상으로 보여주니 왜 다를까?&#34;</p><p style="text-align:center;"><br></p><p style="text-align:center;">&#34;인플루언서에게 제품을 보냈는데</p><p style="text-align:center;">결과물이 생각보다 별로예요.&#34;</p><p style="text-align:center;"><br></p><p style="text-align:center;">&#34;릴스를 매일 올려야 하는데</p><p style="text-align:center;">찍을 시간도, 편집할 실력도 없어요.&#34;</p><p style="text-align:center;"><br></p><p style="text-align:center;"><strong>뷰티 마케팅</strong>의 핵심은</p><p style="text-align:center;">이제 사진이 아니라 영상입니다. 🎬</p><p style="text-align:center;"><br></p><h2 style="text-align:center;">💄 뷰티·화장품, 왜 숏폼 영상이 필수인가</h2><p style="text-align:center;">제품을 실제로 사용하는 영상 하나면</p><p style="text-align:center;">사진 10장보다 더 높은 전환율을 만듭니다.</p><p style="text-align:center;"><br></p><p style="text-align:center;">제품 영상을 본 고객의 구매 전환율은</p><p style="text-align:center;">사진만 본 고객보다 최대 <strong>3배</strong> 높습니다. 📊</p><p style="text-align:center;"><br></p><p style="text-align:center;">인스타그램 릴스, 틱톡, 유튜브 쇼츠.</p><p style="text-align:center;"><strong>숏폼</strong> 하나로 수천에서 수만 명에게</p><p style="text-align:center;">제품을 알릴 수 있습니다. 🔥</p><p style="text-align:center;"><br></p><h2 style="text-align:center;">❌ 뷰티 브랜드가 영상에 실패하는 이유</h2><p style="text-align:center;">직접 촬영하고 편집하려면</p><p style="text-align:center;">하루에 1~2편이 한계입니다.</p><p style="text-align:center;"><br></p><p style="text-align:center;">인플루언서에게 위탁하면</p><p style="text-align:center;">원하는 결과물이 나올 때까지</p><p style="text-align:center;">기다려야 합니다.</p><p style="text-align:center;"><br></p><p style="text-align:center;">건당 외주는 편집자마다</p><p style="text-align:center;">스타일이 달라서</p><p style="text-align:center;">브랜드 정체성을 유지하기 어렵습니다.</p><p style="text-align:center;"><br></p><p style="text-align:center;">결국 &#34;이번 달은 못 올렸어요&#34;라는 말이</p><p style="text-align:center;">반복됩니다. 😔</p><p style="text-align:center;"><br></p><h2 style="text-align:center;">✅ <strong>에이컷</strong>이 해결합니다</h2><p style="text-align:center;">촬영한 원본만 보내 주세요.</p><p style="text-align:center;">자막과 배경음악, 브랜드 로고를 적용해서</p><p style="text-align:center;">릴스와 쇼츠로 납품해 드립니다. ✨</p><p style="text-align:center;"><br></p><p style="text-align:center;">온보딩 때 <strong>브랜드 가이드</strong>를</p><p style="text-align:center;">한 번만 저장해 두면</p><p style="text-align:center;">모든 영상이 같은 스타일로 제작됩니다.</p><p style="text-align:center;"><br></p><p style="text-align:center;"><strong>전담 에디터 1:1</strong> · <strong>D+1 납기</strong> · 계약 강제 없음</p><p style="text-align:center;"><br></p><h2 style="text-align:center;">💡 에이컷 운영진의 인사이트</h2><p style="text-align:center;">수많은 <strong>뷰티 브랜드</strong>를 도와드리며</p><p style="text-align:center;">확실히 깨달은 점이 있습니다.</p><p style="text-align:center;"><br></p><p style="text-align:center;"><strong>숏폼 마케팅</strong>에서 가장 중요한 것은</p><p style="text-align:center;">&#39;완벽한 영상&#39;이 아니라</p><p style="text-align:center;">&#39;<strong>꾸준히 올리는 것</strong>&#39;입니다.</p><p style="text-align:center;"><br></p><p style="text-align:center;">하루에 한 편씩만 올려도</p><p style="text-align:center;">한 달이면 30편의 콘텐츠가 쌓입니다.</p><p style="text-align:center;">그것이 진짜 <strong>뷰티 마케팅</strong>의 힘입니다.</p><p style="text-align:center;"><br></p><h2 style="text-align:center;">📞 지금 무료 상담을 받아 보세요 🙌</h2><p style="text-align:center;"><strong>영상 편집</strong>을 아웃소싱하고 싶다면</p><p style="text-align:center;">부담 없이 문의해 주세요.</p><p style="text-align:center;"><br></p><p style="text-align:center;">📩 카카오톡 채널: 에이컷</p><p style="text-align:center;">📧 contact@aicut.co.kr</p><p style="text-align:center;">🌐 aicut.co.kr</p><p style="text-align:center;"><br></p><p style="text-align:center;">#뷰티마케팅 #화장품마케팅 #숏폼마케팅 #인스타그램릴스 #뷰티릴스 #화장품릴스 #제품영상 #메이크업튜토리얼 #숏폼편집 #영상편집외주 #영상편집대행 #뷰티SNS #인스타마케팅 #뷰티브랜드 #화장품브랜드 #이커머스마케팅 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #월정액영상편집 #48시간납품 #전담편집팀 #에이컷 #AICUT #온라인쇼핑몰 #뷰티스타그램 #제품홍보영상 #B2B영상편집 #립스틱 #스킨케어</p>';

  // 클립보드 시도
  await page.evaluate(function(h) {
    var b = new Blob([h], {type:'text/html'});
    navigator.clipboard.write([new ClipboardItem({'text/html':b})]);
  }, h);
  await sleep(2000);
  await page.evaluate(function() {
    var ed = document.querySelector('[contenteditable]');
    if (ed) { ed.focus(); ed.innerHTML = ''; }
  });
  await sleep(500);
  await page.keyboard.press('Control+v');
  await sleep(3000);

  var len = await page.evaluate(function() {
    try { return SmartEditor._editors['blogpc001'].getContentText().length; } catch(e) { return 0; }
  });
  console.log('2. 본문:', len + '자');

  if (len < 100) {
    // 재시도
    await page.evaluate(function(h) {
      var b = new Blob([h], {type:'text/html'});
      navigator.clipboard.write([new ClipboardItem({'text/html':b})]);
    }, h);
    await sleep(1500);
    await page.evaluate(function() {
      var ed = document.querySelector('[contenteditable]');
      if (ed) { ed.focus(); }
    });
    await sleep(300);
    await page.keyboard.press('Control+v');
    await sleep(2500);
    
    len = await page.evaluate(function() {
      try { return SmartEditor._editors['blogpc001'].getContentText().length; } catch(e) { return 0; }
    });
    console.log('  재시도:', len + '자');
  }
  
  if (len < 100) { console.log('❌ 본문 실패'); await b.close(); return; }

  // 저장
  await page.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var b of btns) { if (b.textContent.trim() === '저장') { b.click(); return; } }
  });
  await sleep(2000);

  // 발행
  await page.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var b of btns) { if (b.textContent.trim() === '발행' && b.offsetParent !== null) { b.click(); return; } }
  });
  await sleep(2000);
  await page.evaluate(function() {
    var btns = document.querySelectorAll('button.confirm_btn__WEaBq');
    for (var btn of btns) { if (btn.offsetParent !== null) { btn.click(); } }
  });
  await sleep(3000);

  var url = await page.evaluate(function() { return window.location.href; });
  if (url.includes('PostView')) console.log('✅ 맞춤법 검수 + 발행 완료!');
  else console.log('URL:', url.substring(0,60));

  await b.close();
})().catch(e => console.error('❌', e.message));

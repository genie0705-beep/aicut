const { chromium } = require('playwright');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var pages = ctx.pages();
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('blog.naver.com') >= 0 && pages[i].url().indexOf('aicut') >= 0) { page = pages[i]; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }

  try { await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await sleep(5000);

  var mf = null, ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var f = page.frames()[fi];
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('no frames'); await b.close(); return; }

  // 1. 제목 설정 + 초기화
  console.log('1. 초기화 + 제목...');
  await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle('공인중개사라면 매물 영상 마케팅을 시작해야 하는 이유');
      var data = ed.getDocumentData();
      data.document.components = [];
      ed.setDocumentData(data);
    } catch(e) {}
  });
  await sleep(1000);

  // 2. 모바일 최적화 본문 + 마커 재설계
  console.log('2. 모바일 최적화 본문...');
  
  // 짧은 문단, 잦은 줄바꿈, 2~3줄 단위
  var html = [
    '<p style="text-align:center;">요즘 아파트 하나 팔려면</p>',
    '<p style="text-align:center;">사진 10장, 설명 10줄이면 끝나던 시대는 지났습니다. 💭</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>영상 하나가 문서 100장보다</strong></p>',
    '<p style="text-align:center;"><strong>강력한 설득력을 발휘하는 시대</strong>입니다. 🎬</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">"매물 사진만으로는 계약이 안 된다."</p>',
    '<p style="text-align:center;">"인스타에 매물 영상을 올렸는데</p>',
    '<p style="text-align:center;">조회수가 200도 안 나온다."</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">정답은 하나입니다.</p>',
    '<p style="text-align:center;">부동산 마케팅의 핵심은</p>',
    '<p style="text-align:center;">이제 사진이 아니라 <strong>영상</strong>입니다.</p>',
    '<p style="text-align:center;"><br></p>',
    // [이미지1 위치] — 대표 이미지
    '<p style="text-align:center;"><strong>■대표이미지■</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🏠 매물 영상 하나면 계약까지 반으로</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">텍스트와 사진만 있는 매물 페이지는</p>',
    '<p style="text-align:center;">이제 기본입니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">차별화는 <strong>영상</strong>에서 시작됩니다. 📈</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">영상이 포함된 매물 페이지는</p>',
    '<p style="text-align:center;">현장 방문 예약률 <strong>2~3배 상승</strong></p>',
    '<p style="text-align:center;">계약 시간 <strong>평균 40% 단축</strong></p>',
    '<p style="text-align:center;"><br></p>',
    // [이미지2 위치]
    '<p style="text-align:center;"><strong>■통계이미지■</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">📱 숏폼이 새로운 매물 창구다</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">릴스 하나로 단지 로비 → 주방 → 침실</p>',
    '<p style="text-align:center;">→ 발코니 뷰까지 원테이크로 보여주세요.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">단지 내 커뮤니티 시설을</p>',
    '<p style="text-align:center;">직접 걸어다니며 촬영한 워킹 투어 🔥</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">이런 콘텐츠가 매수자의 궁금증을</p>',
    '<p style="text-align:center;"><strong>80% 해소</strong>합니다.</p>',
    '<p style="text-align:center;"><br></p>',
    // [이미지3 위치]
    '<p style="text-align:center;"><strong>■숏폼이미지■</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">✍️ 부동산 영상, 이렇게 준비하세요</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>①</strong> 촬영은 <strong>10분</strong>이면 충분</p>',
    '<p style="text-align:center;">핸드폰으로 매물의 핵심만 찍어서 보내주세요.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>②</strong> <strong>주 2~3편</strong> 최소 3개월 유지</p>',
    '<p style="text-align:center;">꾸준함이 채널을 자라게 합니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;"><strong>③</strong> 편집은 <strong>전문가에게</strong></p>',
    '<p style="text-align:center;">직접 3~4시간 vs 아웃소싱 0시간</p>',
    '<p style="text-align:center;"><br></p>',
    // [이미지4 위치]
    '<p style="text-align:center;"><strong>■체크이미지■</strong></p>',
    '<p style="text-align:center;"><br></p>',
    '<h2 style="text-align:center;">🚀 지금 시작해야 하는 이유</h2>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">네이버, 인스타그램, 유튜브 모두</p>',
    '<p style="text-align:center;"><strong>영상 콘텐츠</strong>에</p>',
    '<p style="text-align:center;">검색 가중치를 높이고 있습니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">지금 시작하는 중개사와</p>',
    '<p style="text-align:center;">6개월 후 시작하는 중개사의 차이는</p>',
    '<p style="text-align:center;">누적된 콘텐츠의 차이입니다.</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">📞 지금 무료 상담 받기 🙌</p>',
    '<p style="text-align:center;"><br></p>',
    '<p style="text-align:center;">📩 카카오톡 채널: 에이컷</p>',
    '<p style="text-align:center;">📧 contact@aicut.co.kr</p>',
    '<p style="text-align:center;">🌐 aicut.co.kr</p>'
  ].join('\n');

  // 본문 붙여넣기
  await page.evaluate(function(h) {
    return new Promise(function(resolve) {
      var blob = new Blob([h], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(); }).catch(function() { resolve(); });
    });
  }, html);
  await page.mouse.click(510, 400);
  await sleep(1500);
  await page.keyboard.press('Control+v');
  await sleep(3000);
  console.log('  ✅ 본문 붙여넣기 완료');

  // 3. 마커 위치 찾아서 이미지 삽입
  console.log('3. 이미지 삽입...');
  var markers = [
    { search: '■대표이미지■', file: DIR + '/blog_img_realestate.png' },
    { search: '■통계이미지■', file: DIR + '/body_realestate_stat1.png' },
    { search: '■숏폼이미지■', file: DIR + '/body_realestate_stat2.png' },
    { search: '■체크이미지■', file: DIR + '/body_realestate_stat3.png' }
  ];

  for (var m = 0; m < markers.length; m++) {
    var marker = markers[m];
    console.log('  📤 ' + marker.search + '...');

    // 마커 찾기
    var pos = await mf.evaluate(function(s) {
      var all = document.querySelectorAll('strong, p, div, span');
      for (var i = 0; i < all.length; i++) {
        try {
          var t = (all[i].innerText || '').trim();
          if (t.indexOf(s) >= 0 && all[i].offsetParent !== null) {
            var r = all[i].getBoundingClientRect();
            return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), found: true };
          }
        } catch(e) {}
      }
      return { found: false };
    }, marker.search);

    if (!pos.found) {
      console.log('  ⚠️ 마커 못 찾음 (본문에 없음 - 이미 삽입됨)');
      continue;
    }

    // 마커 클릭
    await page.mouse.click(pos.x, pos.y);
    await sleep(500);

    // 마커 삭제 (Shift+Home → Delete)
    await page.keyboard.press('Home');
    await page.keyboard.down('Shift');
    await page.keyboard.press('End');
    await page.keyboard.up('Shift');
    await sleep(100);
    await page.keyboard.press('Delete');
    await sleep(300);

    // 이미지 업로드
    var fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    await page.mouse.click(36, 74);
    await sleep(2000);
    await page.mouse.click(200, 250);
    await sleep(1500);

    var fc = await fcP;
    if (!fc) {
      fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
      await page.mouse.click(36, 74);
      await sleep(1500);
      await page.mouse.click(200, 250);
      await sleep(1500);
      fc = await fcP;
    }

    if (fc) {
      await fc.setFiles(marker.file);
      await sleep(2000);

      // 패널 이미지 클릭
      var panel = await mf.evaluate(function() {
        var imgs = document.querySelectorAll('img');
        var t = null;
        imgs.forEach(function(img) {
          try {
            var r = img.getBoundingClientRect();
            if (r.y > 0 && r.y < 900 && r.width > 30 && (img.src || '').indexOf('blogfiles') >= 0) {
              if (!t || r.y > t.y) { t = { x: Math.round(r.x + 10), y: Math.round(r.y + 10) }; }
            }
          } catch(e) {}
        });
        return t;
      });

      if (panel) {
        await page.mouse.click(panel.x, panel.y);
        await sleep(1500);
        console.log('  ✅ 이미지 삽입 완료');
      } else {
        console.log('  ⚠️ 패널 클릭 실패');
      }
    }
    await sleep(1000);
  }

  // 4. 저장
  console.log('\n4. 저장...');
  try {
    await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
      }
    });
    console.log('  저장됨');
  } catch(e) {}

  await sleep(2000);
  console.log('\n✅ 수정 완료! 블로그 탭 확인해주세요.');
  await b.close();
})();

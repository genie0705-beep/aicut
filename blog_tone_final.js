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
    if (pages[i].url().indexOf('aicut') >= 0 && pages[i].url().indexOf('Write') >= 0) { page = pages[i]; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(4000);

  var mf = null, ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var f = page.frames()[fi];
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('no frames'); await b.close(); return; }

  // 1. 제목
  console.log('1. 제목 설정...');
  await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentTitle('병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과 (+원장님 인터뷰)');
    } catch(e) {}
  });
  console.log('  ✅');

  await sleep(1000);

  // 2. 이모티콘 + 톤앤매너 적용 본문
  console.log('2. 본문 준비...');
  
  var html = [
    '<p>병원·의원 마케팅을 고민하는 원장님들께</p>',
    '<p>가장 궁금해하는 것이 있습니다. 💭</p>',
    '<p><br></p>',
    '<p>"숏폼 영상을 하면 효과가 있을까?"</p>',
    '<p>"한 편 제작하는 데 얼마나 들지?"</p>',
    '<p>"환자들이 릴스를 보고 올까?"</p>',
    '<p><br></p>',
    '<p>정답은 하나입니다.</p>',
    '<p><strong>병원 영상마케팅</strong>은</p>',
    '<p>이제 선택이 아니라 필수입니다. 🎯</p>',
    '<p><br></p>',
    '<p>이 글에서는 실제 도입 사례와 함께</p>',
    '<p>숏폼 제작 비용과 효과를</p>',
    '<p>솔직하게 공유합니다.</p>',
    '<p><br></p>',
    '<h2>📊 1. 병원 숏폼, 왜 지금 시작해야 할까</h2>',
    '<p><br></p>',
    '<p>대기 시간에 릴스를 보는 환자들이</p>',
    '<p>점점 늘고 있습니다. 📱</p>',
    '<p><br></p>',
    '<p>네이버 데이터에 따르면</p>',
    '<p>"병원+릴스+시술후기" 검색량이</p>',
    '<p>전년 대비 <strong>약 2.5배</strong> 증가했습니다. 📈</p>',
    '<p><br></p>',
    '<p>성형외과, 피부과, 치과, 한의원 모두</p>',
    '<p>숏폼 콘텐츠가 진료 예약에</p>',
    '<p>직접적인 영향을 주고 있습니다.</p>',
    '<p><br></p>',
    '<h2>💰 2. 숏폼 1편, 실제 제작 비용</h2>',
    '<p><br></p>',
    '<p>많은 분들이 가장 궁금해하는 부분입니다.</p>',
    '<p><br></p>',
    '<p>하지만 더 중요한 건 <strong>꾸준함</strong>입니다. 🔥</p>',
    '<p><br></p>',
    '<p>릴스는 한 번 올린다고</p>',
    '<p>효과가 나지 않습니다.</p>',
    '<p><br></p>',
    '<p><strong>주 2~3편, 월 8~12편</strong>을</p>',
    '<p>최소 3개월 이상 유지해야</p>',
    '<p>검색 상위 노출이 시작됩니다.</p>',
    '<p><br></p>',
    '<h2>🏥 3. 실제 도입 사례 — 성형외과 K원장님</h2>',
    '<p><br></p>',
    '<p>"처음엔 릴스가 효과가 있을까</p>',
    '<p>의문이었어요."</p>',
    '<p><br></p>',
    '<p><strong>도입 전:</strong></p>',
    '<p>팔로워 300명, 문의 월 3~5건</p>',
    '<p><br></p>',
    '<p><strong>도입 3개월 후:</strong> ✨</p>',
    '<p>팔로워 2,100명 <strong>7배↑</strong></p>',
    '<p>문의 월 20~30건 <strong>6배↑</strong></p>',
    '<p><br></p>',
    '<p>가장 효과가 좋았던 콘텐츠는</p>',
    '<p>원장님의 진정성 있는 설명이 담긴</p>',
    '<p>숏폼이었습니다. 💡</p>',
    '<p><br></p>',
    '<h2>🚀 4. 지금 시작해야 하는 이유</h2>',
    '<p><br></p>',
    '<p>네이버와 인스타그램 모두</p>',
    '<p><strong>숏폼 콘텐츠</strong>에</p>',
    '<p>검색 가중치를 높이고 있습니다.</p>',
    '<p><br></p>',
    '<p>지금 시작하는 병원과</p>',
    '<p>6개월 후 시작하는 병원의 차이는</p>',
    '<p>쌓인 콘텐츠의 차이입니다.</p>',
    '<p><br></p>',
    '<p>여러분의 병원은</p>',
    '<p>어떤 숏폼 콘텐츠로</p>',
    '<p>환자들에게 다가가고 계신가요? 😊</p>',
    '<p><br></p>',
    '<p>📞 지금 무료 상담 받기</p>',
    '<p><br></p>',
    '<p>영상 편집 아웃소싱이 처음이시라면</p>',
    '<p>부담 없이 문의 주세요.</p>',
    '<p>샘플 편집본을 먼저 보내드립니다. 🙌</p>',
    '<p><br></p>',
    '<p>📩 카카오톡 채널: 에이컷</p>',
    '<p>📧 이메일: contact@aicut.co.kr</p>',
    '<p>🌐 홈페이지: aicut.co.kr</p>'
  ].join('\n');

  console.log('3. 클립보드 → Ctrl+V...');
  var clipResult = await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      var blob = new Blob([html], { type: 'text/html' });
      var item = new ClipboardItem({ 'text/html': blob });
      navigator.clipboard.write([item]).then(function() {
        resolve('ok');
      }).catch(function() {
        navigator.clipboard.writeText(html.replace(/<[^>]+>/g, '').substring(0, 500)).then(function() {
          resolve('text_only');
        }).catch(function(e) {
          resolve('err: ' + e.message.substring(0, 20));
        });
      });
    });
  }, html);
  console.log('  클립보드:', clipResult);

  await sleep(1000);
  await page.mouse.click(510, 400);
  await sleep(1500);
  await page.keyboard.press('Control+v');
  await sleep(3000);

  // 확인
  var check = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var text = ed.getContentText ? ed.getContentText() : '';
      var hasEmoji = text.indexOf('💭') >= 0 || text.indexOf('📊') >= 0 || text.indexOf('🔥') >= 0;
      return { ok: text.length > 0, len: text.length, emoji: hasEmoji, preview: text.substring(0, 25) };
    } catch(e) { return { ok: false }; }
  });
  console.log('  내용:', check.ok ? '✅ ' + check.len + '자' : '❌', check.emoji ? '이모티콘✅' : '이모티콘❌');

  if (check.ok) {
    console.log('4. 저장...');
    try {
      await mf.evaluate(function() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
        }
      });
      console.log('  저장됨');
    } catch(e) {}
  }

  await sleep(2000);
  console.log('\n✅ 완료!');
  await b.close();
})();

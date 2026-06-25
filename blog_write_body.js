const { chromium } = require('playwright');

const BODY = '<p>온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 <strong>퀄리티</strong>가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, <strong>편집의 완성도</strong>가 시청자의 몰입과 만족도를 결정합니다.</p><p><br></p><h2>1. 강의 퀄리티가 비약적으로 상승한다</h2><p><strong>자막의 가독성</strong>, <strong>호흡 조절</strong>, <strong>브랜드 통일감</strong> — 전문 편집자는 모든 요소를 한 번에 처리합니다.</p><p><br></p><h2>2. 제작 시간이 70% 단축된다</h2><p>1시간 강의 편집에 <strong>3~4시간</strong> 필요하지만, 아웃소싱하면 시간이 대폭 줄어듭니다.</p><p><br></p><h2>3. 숏폼 채널을 자동으로 성장시킨다</h2><p>릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.</p><p><br></p><h2>4. 편집 파트너 고를 때 체크할 3가지</h2><p>① 강의 콘텐츠를 이해하는가 ② 정기 납품이 가능한가 ③ 빠른 수정 대응이 가능한가</p><p><br></p><h2>5. 지금 시작해야 하는 이유</h2><p>네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다.</p><p><br></p><p>📞 지금 무료 상담 받기</p><p>📩 카카오톡 채널: 에이컷<br>📧 이메일: contact@aicut.co.kr<br>🌐 홈페이지: aicut.co.kr</p>';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().indexOf('aicut') >= 0 && pg.url().indexOf('Write') >= 0) { page = pg; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(2000);

  let ef = null;
  for (const f of page.frames()) {
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) {
      ef = f; break;
    }
  }
  if (!ef) { console.log('no editor'); await b.close(); return; }

  // Use _editingService.write to insert body content
  console.log('본문 입력 중...');
  var result = await ef.evaluate(function(html) {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      if (!ed) return 'no_editor';
      
      if (ed._editingService && typeof ed._editingService.write === 'function') {
        // First clear existing content
        var comps = ed.getDocumentData().document.components;
        // We need to set the content through the editing service
        ed._editingService.write(html);
        return 'write_called';
      }
      
      // Fallback: try setDocumentData
      if (typeof ed.setDocumentData === 'function') {
        var data = ed.getDocumentData();
        return 'setDocumentData available - current: ' + JSON.stringify(Object.keys(data));
      }
      
      return 'no_method';
    } catch(e) { return 'error: ' + (e.message || '').substring(0, 50); }
  }, BODY);
  console.log('  ' + result);

  await sleep(2000);

  // Check content
  var check = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var text = ed.getContentText ? ed.getContentText() : '';
      return 'content: ' + text.substring(0, 60);
    } catch(e) { return 'error'; }
  });
  console.log('결과:', check);
  
  // 저장
  var mf = null;
  for (const f of page.frames()) { if (f.name() === 'mainFrame') { mf = f; break; } }
  if (mf) {
    await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
          btns[i].click(); return;
        }
      }
    });
    console.log('저장됨');
  }

  await sleep(2000);
  await b.close();
})();

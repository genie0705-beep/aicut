const { chromium } = require('playwright');

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

  // Set full document with title and content via setDocumentData
  var result = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      if (!ed || typeof ed.setDocumentData !== 'function') return 'no_setDocumentData';
      
      // Get current data to preserve structure
      var currentData = ed.getDocumentData();
      var currentDoc = currentData.document;
      
      // Create new document with title and body content
      var newDoc = {
        version: currentDoc.version || '2.10.2',
        theme: currentDoc.theme || 'default',
        language: currentDoc.language || 'ko-KR',
        id: currentDoc.id || '',
        di: currentDoc.di || '',
        components: [
          {
            type: 'title',
            textContent: '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점'
          },
          {
            type: 'paragraph',
            textContent: '온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 퀄리티가 수강생 선택의 핵심 기준이 되고 있습니다.'
          },
          {
            type: 'heading',
            attributes: { level: '2' },
            textContent: '1. 강의 퀄리티가 비약적으로 상승한다'
          },
          {
            type: 'paragraph',
            textContent: '자막의 가독성, 호흡 조절, 브랜드 통일감 — 전문 편집자는 모든 요소를 한 번에 처리합니다.'
          },
          {
            type: 'heading',
            attributes: { level: '2' },
            textContent: '2. 제작 시간이 70% 단축된다'
          },
          {
            type: 'paragraph',
            textContent: '1시간 강의 편집에 3~4시간 필요하지만, 아웃소싱하면 시간이 대폭 줄어듭니다.'
          },
          {
            type: 'heading',
            attributes: { level: '2' },
            textContent: '3. 숏폼 채널을 자동으로 성장시킨다'
          },
          {
            type: 'paragraph',
            textContent: '릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.'
          },
          {
            type: 'heading',
            attributes: { level: '2' },
            textContent: '4. 편집 파트너 고를 때 체크할 3가지'
          },
          {
            type: 'list',
            textContent: '① 강의 콘텐츠를 이해하는가 ② 정기 납품이 가능한가 ③ 빠른 수정 대응이 가능한가'
          },
          {
            type: 'heading',
            attributes: { level: '2' },
            textContent: '5. 지금 시작해야 하는 이유'
          },
          {
            type: 'paragraph',
            textContent: '네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다.'
          }
        ]
      };
      
      ed.setDocumentData({ document: newDoc, documentId: currentData.documentId });
      return 'setDocumentData_success';
      
    } catch(e) {
      return 'error: ' + (e.message || '').substring(0, 100);
    }
  });

  console.log('API 결과:', result);
  
  await sleep(2000);

  // Verify
  var check = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var title = ed.getDocumentTitle ? ed.getDocumentTitle() : '';
      var content = ed.getContentText ? ed.getContentText() : '';
      return { title: title, contentPreview: content.substring(0, 60) };
    } catch(e) { return { error: e.message.substring(0, 50) }; }
  });
  console.log('확인:', JSON.stringify(check));
  
  // 찾기
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

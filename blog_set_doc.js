const { chromium } = require('playwright');
const crypto = require('crypto');

function uid() { return 'SE-' + crypto.randomUUID(); }

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
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; break; }
  }
  if (!ef) { console.log('no editor'); await b.close(); return; }

  // Get current document to preserve di and id
  var currentData = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var data = ed.getDocumentData();
      return {
        id: data.document.id,
        di: JSON.stringify(data.document.di),
        documentId: data.documentId
      };
    } catch(e) { return null; }
  });

  if (!currentData) { console.log('cannot get current data'); await b.close(); return; }

  // Build proper document structure matching Naver's format
  function makeTextNode(text) {
    return { id: uid(), value: text, '@ctype': 'textNode' };
  }
  function makeParagraph(text) {
    return { id: uid(), nodes: [makeTextNode(text)], '@ctype': 'paragraph' };
  }

  var newDoc = {
    version: '2.10.2',
    theme: 'default',
    language: 'ko-KR',
    id: currentData.id,
    di: JSON.parse(currentData.di),
    components: [
      {
        id: uid(),
        layout: 'default',
        title: [makeParagraph('온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점')],
        subtitle: null,
        align: 'left',
        '@ctype': 'documentTitle'
      },
      makeParagraph('온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 퀄리티가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, 편집의 완성도가 시청자의 몰입과 만족도를 결정합니다.'),
      makeParagraph(''),
      makeParagraph('1. 강의 퀄리티가 비약적으로 상승한다'),
      makeParagraph('자막의 가독성, 호흡 조절, 브랜드 통일감 — 전문 편집자는 모든 요소를 한 번에 처리합니다.'),
      makeParagraph(''),
      makeParagraph('2. 제작 시간이 70% 단축된다'),
      makeParagraph('1시간 강의 편집에 3~4시간 필요하지만, 아웃소싱하면 시간이 대폭 줄어듭니다.'),
      makeParagraph(''),
      makeParagraph('3. 숏폼 채널을 자동으로 성장시킨다'),
      makeParagraph('릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.'),
      makeParagraph(''),
      makeParagraph('4. 편집 파트너 고를 때 체크할 3가지'),
      makeParagraph('① 강의 콘텐츠를 이해하는가 ② 정기 납품이 가능한가 ③ 빠른 수정 대응이 가능한가'),
      makeParagraph(''),
      makeParagraph('5. 지금 시작해야 하는 이유'),
      makeParagraph('네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다.'),
      makeParagraph(''),
      makeParagraph('지금 무료 상담 받기'),
      makeParagraph('카카오톡 채널: 에이컷'),
      makeParagraph('이메일: contact@aicut.co.kr'),
      makeParagraph('홈페이지: aicut.co.kr')
    ]
  };

  var payload = { newDoc: newDoc, docId: currentData.documentId };
  var result = await ef.evaluate(function(p) {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      if (!ed || typeof ed.setDocumentData !== 'function') return 'no_setDocumentData';
      
      ed.setDocumentData({ document: p.newDoc, documentId: p.docId });
      return 'success';
    } catch(e) {
      return 'error: ' + (e.message || '').substring(0, 100);
    }
  }, payload);

  console.log('API 결과:', result);

  await sleep(2000);

  // Verify
  var check = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var title = ed.getDocumentTitle ? ed.getDocumentTitle() : '';
      var content = ed.getContentText ? ed.getContentText() : '';
      return { title: title, preview: content.substring(0, 50) };
    } catch(e) { return { error: e.message.substring(0, 50) }; }
  });
  console.log('확인:', JSON.stringify(check));

  // Save
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
  console.log('\n✅ 완료!');
  await b.close();
})();

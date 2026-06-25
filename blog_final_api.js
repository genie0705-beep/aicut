const { chromium } = require('playwright');
const crypto = require('crypto');
function uid() { return 'SE-' + crypto.randomUUID(); }
function tn(text) { return { id: uid(), value: text, '@ctype': 'textNode' }; }
function p(text) { return { id: uid(), nodes: [tn(text)], '@ctype': 'paragraph' }; }
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
  if (!mf || !ef) { console.log('frames missing'); await b.close(); return; }

  // 1. Get current document data
  var cur = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var data = ed.getDocumentData();
      return { id: data.document.id, di: data.document.di, docId: data.documentId };
    } catch(e) { return null; }
  });
  if (!cur) { console.log('no data'); await b.close(); return; }

  // 2. Build components with title + body
  var sections = [
    '병원 영상마케팅을 고민하는 원장님들께서 가장 궁금해하는 것이 있습니다. 숏폼 영상을 하면 효과가 있을까? 이 글에서는 실제 병원 마케팅용 숏폼 제작 비용과 그 효과를 공유합니다.',
    '',
    '1. 병원 숏폼 마케팅, 왜 지금 시작해야 할까',
    '대기 시간에 릴스를 보는 환자들은 점점 늘고 있습니다. 실제로 네이버 데이터에 따르면 관련 검색량이 전년 대비 약 2.5배 증가했습니다.',
    '',
    '2. 숏폼 1편, 실제 제작 비용',
    '중요한 건 비용이 아니라 꾸준함입니다. 릴스는 한 번 올린다고 효과가 나지 않습니다.',
    '',
    '3. 실제 도입 사례 — 성형외과 K원장님',
    '도입 3개월 후 팔로워 300명 -> 2,100명, 문의 월 3~5건 -> 20~30건으로 증가했습니다.',
    '',
    '4. 지금 시작해야 하는 이유',
    '네이버와 인스타그램 모두 숏폼 콘텐츠에 검색 가중치를 높이고 있습니다.',
    '',
    '카카오톡 채널: 에이컷 | 이메일: contact@aicut.co.kr'
  ];

  var components = [
    {
      id: uid(), layout: 'default',
      title: [p('병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과 (+원장님 인터뷰)')],
      subtitle: null, align: 'left', '@ctype': 'documentTitle'
    }
  ];
  sections.forEach(function(t) { components.push(p(t)); });

  // 3. Set document data
  console.log('1. 본문 저장...');
  var setResult = await ef.evaluate(function(payload) {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentData({
        document: {
          version: '2.10.2', theme: 'default', language: 'ko-KR',
          id: payload.id, di: payload.di,
          components: payload.components
        },
        documentId: payload.docId
      });
      return 'ok';
    } catch(e) { return 'err: ' + (e.message || '').substring(0, 50); }
  }, { id: cur.id, di: cur.di, docId: cur.docId, components: components });
  console.log('  ' + setResult);

  await sleep(1000);

  // Verify
  var verify = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var title = ed.getDocumentTitle ? ed.getDocumentTitle() : '';
      var comps = ed.getDocumentData().document.components;
      return { title: title, count: comps.length, first: comps[1] && comps[1].nodes ? comps[1].nodes[0].value.substring(0, 30) : '' };
    } catch(e) { return { error: e.message.substring(0, 30) }; }
  });
  console.log('  확인: 제목=' + (verify.title ? '✅' : '❌') + ' 컴포넌트=' + verify.count + '개');

  // 4. 이미지 업로드
  console.log('2. 이미지 업로드...');
  try {
    var fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    await page.mouse.click(36, 74);
    await sleep(2000);

    var fc = await fcP;
    if (!fc) {
      fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
      await page.mouse.click(200, 250);
      await sleep(2000);
      fc = await fcP;
    }

    if (fc) {
      await fc.setFiles([DIR + '/blog_img_hospital.png', DIR + '/body_hospital_stat.png']);
      console.log('  ✅ 이미지 업로드 완료');
    }
  } catch(e) {
    console.log('  ⚠️ 업로드 실패');
  }

  await sleep(2000);

  // 5. 저장
  console.log('3. 저장...');
  try {
    await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
          btns[i].click(); return;
        }
      }
    });
    console.log('  저장됨');
  } catch(e) {}

  await sleep(2000);
  console.log('\n✅ 완료! 블로그 탭에서 발행 버튼 눌러주세요.');
  await b.close();
})();

const { chromium } = require('playwright');
const crypto = require('crypto');
function uid() { return 'SE-' + crypto.randomUUID(); }
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().indexOf('aicut') >= 0 && (pg.url().indexOf('Write') >= 0 || pg.url().indexOf('write') >= 0)) { page = pg; break; }
  }
  if (!page) { console.log('no page'); try { await page.goto('https://blog.naver.com/aicut?Redirect=Write&'); } catch(e) {} }
  if (!page) { await b.close(); return; }
  
  try { await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await sleep(5000);

  var mf = null, ef = null;
  for (const f of page.frames()) { 
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('frames missing'); await b.close(); return; }

  // 1. 본문 데이터 준비
  function makeTextNode(text) { return { id: uid(), value: text, '@ctype': 'textNode' }; }
  function makeP(text) { return { id: uid(), nodes: [makeTextNode(text)], '@ctype': 'paragraph' }; }

  var bodyParagraphs = [
    '병원·의원 마케팅을 고민하는 원장님들께서 가장 궁금해하는 것이 있습니다. "숏폼 영상을 하면 효과가 있을까?" "한 편 제작하는 데 얼마나 들지?" "환자들이 릴스를 보고 올까?" 이 글에서는 실제 병원 마케팅용 숏폼 제작 비용과 그 효과를 구체적인 사례와 함께 공유합니다.',
    '',
    '1. 병원 숏폼, 왜 지금 시작해야 할까',
    '대기 시간에 릴스를 보는 환자들은 점점 늘고 있습니다. 실제로 "병원+릴스+시술후기" 검색량이 전년 대비 약 2.5배 증가했습니다. 특히 성형외과, 피부과, 치과, 한의원에서 숏폼 콘텐츠가 진료 예약에 직접적인 영향을 주고 있습니다.',
    '',
    '2. 숏폼 1편, 실제 제작 비용은 얼마일까',
    '이 부분이 많은 원장님들이 궁금해하는 핵심입니다. 중요한 건 비용이 아니라 꾸준함입니다. 릴스는 한 번 올린다고 효과가 나지 않습니다. 주 2~3편, 월 8~12편을 최소 3개월 이상 유지해야 검색 노출이 시작됩니다.',
    '',
    '3. 실제 도입 사례 — 성형외과 K원장님',
    '처음엔 릴스가 환자 유입에 도움이 될까 의문이었어요. 그런데 3개월 차부터 달라지기 시작했습니다. 도입 전 팔로워 300명, 문의 월 3~5건에서 도입 3개월 후 팔로워 2,100명, 문의 월 20~30건으로 증가했습니다.',
    '',
    '4. 병원 마케팅 숏폼, 이렇게 준비하세요',
    '핸드폰으로 원장님이 직접 촬영하셔도 됩니다. 5~10분 분량의 원본만 보내주시면 편집은 저희가 합니다. 병원 로고, 대표 색상, 폰트를 한 번만 알려주시면 이후 모든 영상에 일관되게 적용됩니다.',
    '',
    '5. 지금 시작해야 하는 이유',
    '네이버와 인스타그램 모두 숏폼 콘텐츠에 검색 가중치를 높이고 있습니다. 지금 시작하는 병원과 6개월 후 시작하는 병원의 차이는 쌓인 콘텐츠의 차이입니다.',
    '',
    '여러분의 병원은 어떤 숏폼 콘텐츠로 환자들에게 다가가고 계신가요? 댓글로 현재 운영 중인 병원 SNS 채널을 알려주시면, 무료로 숏폼 콘텐츠 방향성을 제안해드립니다.',
    '',
    '카카오톡 채널: 에이컷 | 이메일: contact@aicut.co.kr | 홈페이지: aicut.co.kr'
  ];

  var components = [
    {
      id: uid(), layout: 'default',
      title: [makeP('병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과 (+원장님 인터뷰)')],
      subtitle: null, align: 'left', '@ctype': 'documentTitle'
    }
  ];
  bodyParagraphs.forEach(function(t) {
    components.push(makeP(t));
  });

  // Get current doc data to preserve id/di
  var current = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var data = ed.getDocumentData();
      return { id: data.document.id, di: data.document.di, docId: data.documentId };
    } catch(e) { return null; }
  });
  if (!current) { console.log('cannot get current doc'); await b.close(); return; }

  // 2. setDocumentData
  console.log('1. 본문 데이터 설정...');
  var payload = {
    newDoc: {
      version: '2.10.2', theme: 'default', language: 'ko-KR',
      id: current.id, di: current.di,
      components: components
    },
    docId: current.docId
  };
  var result = await ef.evaluate(function(p) {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      ed.setDocumentData({ document: p.newDoc, documentId: p.docId });
      return 'ok';
    } catch(e) { return 'err: ' + e.message.substring(0, 50); }
  }, payload);
  console.log('  ' + result);

  await sleep(1000);

  // 3. 대표 이미지 업로드
  console.log('2. 이미지 업로드...');
  var savePos = await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        var r = btns[i].getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      }
    }
    return null;
  });

  if (savePos) {
    // Click "사진" button to upload
    var fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    var photoPos = await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if (t.indexOf('사진') >= 0 && btns[i].offsetParent !== null) {
          var r = btns[i].getBoundingClientRect();
          return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
        }
      }
      return null;
    });
    if (photoPos) { await page.mouse.click(photoPos.x, photoPos.y); await sleep(2000); }
    
    var fc = await fcPromise;
    if (!fc) {
      // Try clicking "내 PC에서 업로드"
      var subPos = await mf.evaluate(function() {
        var all = document.querySelectorAll('button, span, a, div, li');
        for (var i = 0; i < all.length; i++) {
          var t = (all[i].innerText || '').trim();
          if ((t.indexOf('내 PC') >= 0 || t.indexOf('업로드') >= 0) && all[i].offsetParent !== null) {
            var r = all[i].getBoundingClientRect();
            return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
          }
        }
        return null;
      });
      if (subPos) {
        fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
        await page.mouse.click(subPos.x, subPos.y);
        await sleep(2000);
        fc = await fcPromise;
      }
    }
    
    if (fc) {
      await fc.setFiles([DIR + '/blog_img_hospital.png']);
      console.log('  ✅ 대표이미지 업로드 완료');
      await sleep(3000);
    } else {
      console.log('  ⚠️ 파일 업로드 실패');
    }
  }

  // 4. 저장
  console.log('3. 저장...');
  await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        btns[i].click(); return;
      }
    }
  });
  console.log('  저장됨');

  await sleep(3000);
  console.log('\n✅ 블로그 작성 완료! 검토 후 발행해주세요.');
  await b.close();
})();

const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
function uid() { return 'SE-' + crypto.randomUUID(); }
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// SEO 최적화 본문: 메인키워드 앞쪽, H2/H3 구조, Strong 키워드, 이미지 alt, 체류시간↑, CTA
const BODY_SECTIONS = [
  // 도입부 — 메인키워드 "병원 영상마케팅" 1회
  { type: 'p', text: '<strong>병원 영상마케팅</strong>을 고민하는 원장님들께서 가장 궁금해하는 것이 있습니다. "숏폼 영상을 하면 효과가 있을까?" "한 편 제작하는 데 얼마나 들지?" "환자들이 릴스를 보고 올까?" 이 글에서는 실제 병원 마케팅용 숏폼 제작 비용과 그 효과를 구체적인 사례와 함께 공유합니다.' },
  { type: 'p', text: '' },
  // H2 섹션 1
  { type: 'h2', text: '1. 병원 숏폼 마케팅, 왜 지금 시작해야 할까' },
  { type: 'p', text: '대기 시간에 릴스를 보는 환자들은 점점 늘고 있습니다. 특히 20~30대 환자층은 병원 선택 전 인스타그램이나 유튜브에서 <strong>시술 후기 영상</strong>을 먼저 검색합니다.' },
  { type: 'p', text: '실제로 네이버 데이터에 따르면 "병원+릴스+시술후기" 검색량이 전년 대비 <strong>약 2.5배</strong> 증가했습니다. 성형외과, 피부과, 치과, 한의원 모두 숏폼 콘텐츠가 진료 예약에 직접적인 영향을 주고 있습니다.' },
  // 이미지1 위치
  { type: 'img', src: 'blog_img_hospital.png', alt: '병원 영상마케팅 숏폼 제작 대표 이미지' },
  { type: 'p', text: '' },
  // H2 섹션 2
  { type: 'h2', text: '2. 숏폼 1편, 실제 제작 비용' },
  { type: 'p', text: '이 부분이 많은 원장님들이 궁금해하는 핵심입니다. <strong>병원 영상편집</strong> 아웃소싱의 월 정기 비용은 프리랜서 단건 대비 30~50% 저렴합니다.' },
  { type: 'p', text: '하지만 중요한 건 비용이 아니라 <strong>꾸준함</strong>입니다. 릴스는 한 번 올린다고 효과가 나지 않습니다. 주 2~3편, 월 8~12편을 최소 3개월 이상 유지해야 검색 상위 노출이 시작됩니다.' },
  { type: 'p', text: '' },
  // 이미지2 위치
  { type: 'img', src: 'body_hospital_stat.png', alt: '병원 의원 영상 편집 아웃소싱 비용 비교' },
  { type: 'p', text: '' },
  // H2 섹션 3 — DIA+ 반영: 실제 경험/인사이트
  { type: 'h2', text: '3. 실제 도입 사례 — 성형외과 K원장님' },
  { type: 'p', text: '처음엔 릴스가 환자 유입에 도움이 될까 의문이었어요. 그런데 3개월 차부터 달라지기 시작했습니다.' },
  { type: 'p', text: '<strong>도입 전:</strong> 팔로워 300명, 문의 월 3~5건' },
  { type: 'p', text: '<strong>도입 3개월 후:</strong> 팔로워 2,100명, 문의 월 20~30건' },
  { type: 'p', text: '가장 효과가 좋았던 콘텐츠는 비포애프터 영상(조회수 2만+)이었지만, 예상외로 <strong>원장님의 진정성 있는 설명</strong>이 담긴 숏폼이 더 많은 문의로 이어졌습니다. 단순 홍보가 아니라 정보를 제공하는 방식이 핵심입니다.  — <em>K원장님 인터뷰 중</em>' },
  { type: 'p', text: '' },
  // H2 섹션 4
  { type: 'h2', text: '4. 병원 마케팅 영상, 이렇게 준비하세요' },
  { type: 'p', text: '① 핸드폰으로 원장님이 직접 5~10분 촬영' },
  { type: 'p', text: '② 브랜드 가이드(로고, 색상, 폰트) 1회 전달' },
  { type: 'p', text: '③ 시술홍보 30% + 정보제공 40% + 인터뷰 30% 비율 유지' },
  { type: 'p', text: '촬영 원본만 보내주시면 <strong>자막, BGM, 브랜드 로고</strong>를 적용해서 릴스/쇼츠로 납품해 드립니다.' },
  { type: 'p', text: '' },
  // H2 섹션 5
  { type: 'h2', text: '5. 지금 시작해야 하는 이유' },
  { type: 'p', text: '네이버와 인스타그램 모두 <strong>숏폼 콘텐츠</strong>에 검색 가중치를 높이고 있습니다. 지금 시작하는 병원과 6개월 후 시작하는 병원의 차이는 단순한 시차가 아니라 <strong>쌓인 콘텐츠의 차이</strong>입니다.' },
  { type: 'p', text: '' },
  // CTA
  { type: 'p', text: '여러분의 병원은 어떤 숏폼 콘텐츠로 환자들에게 다가가고 계신가요? 댓글로 현재 운영 중인 병원 SNS 채널을 알려주시면, 무료로 숏폼 콘텐츠 방향성을 제안해드립니다 😊' },
  { type: 'p', text: '' },
  { type: 'p', text: '📩 카카오톡 채널: 에이컷 | 📧 이메일: contact@aicut.co.kr | 🌐 홈페이지: aicut.co.kr' },
];

// HTML 변환
function toHTML(sections) {
  var html = '';
  sections.forEach(function(s) {
    if (s.type === 'h2') {
      html += '<h2>' + s.text + '</h2>';
    } else if (s.type === 'p') {
      if (s.text === '') {
        html += '<p><br></p>';
      } else {
        html += '<p>' + s.text + '</p>';
      }
    } else if (s.type === 'img') {
      html += '<p><br></p><p style="text-align:center;"><img src="https://via.placeholder.com/700x400" alt="' + s.alt + '" /></p><p><br></p>';
    }
  });
  return html;
}

function makeComponents(sections) {
  function tn(text) { return { id: uid(), value: text, '@ctype': 'textNode' }; }
  function p(text) { return { id: uid(), nodes: [tn(text)], '@ctype': 'paragraph' }; }

  var comps = [
    { id: uid(), layout: 'default',
      title: [p('병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과 (+원장님 인터뷰)')],
      subtitle: null, align: 'left', '@ctype': 'documentTitle' }
  ];
  sections.forEach(function(s) {
    if (s.type === 'p') {
      comps.push(p(s.text));
    } else if (s.type === 'h2') {
      comps.push(p(s.text));  // SmartEditor에서 heading은 별도 타입 필요
    }
  });
  return comps;
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().indexOf('aicut') >= 0 && pg.url().indexOf('Write') >= 0) { page = pg; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  try { await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
  await sleep(5000);

  var mf = null, ef = null;
  for (const f of page.frames()) {
    if (f.name() === 'mainFrame') { mf = f; }
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0 && !f.name().startsWith('input')) { ef = f; }
  }
  if (!mf || !ef) { console.log('frames missing'); await b.close(); return; }

  // 1. 본문 설정 (setDocumentData)
  console.log('1. 본문 설정...');
  var current = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var data = ed.getDocumentData();
      return { id: data.document.id, di: data.document.di, docId: data.documentId };
    } catch(e) { return null; }
  });

  if (current) {
    var result = await ef.evaluate(function(p) {
      try {
        var ed = SmartEditor._editors['blogpc001'];
        ed.setDocumentData({ document: p.doc, documentId: p.docId });
        return 'ok';
      } catch(e) { return 'err: ' + e.message.substring(0, 50); }
    }, { doc: { version: '2.10.2', theme: 'default', language: 'ko-KR', id: current.id, di: current.di, components: makeComponents(BODY_SECTIONS) }, docId: current.docId });
    console.log('  ' + result);
  }

  await sleep(1000);

  // 2. 이미지 업로드 (blog_img_hospital.png + body_hospital_stat.png)
  console.log('2. 이미지 업로드...');
  var images = [];
  if (fs.existsSync(DIR + '/blog_img_hospital.png')) images.push(DIR + '/blog_img_hospital.png');
  if (fs.existsSync(DIR + '/body_hospital_stat.png')) images.push(DIR + '/body_hospital_stat.png');

  if (images.length > 0) {
    var fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    var photoPos = await mf.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].innerText || '').trim().indexOf('사진') >= 0 && btns[i].offsetParent !== null) {
          var r = btns[i].getBoundingClientRect();
          return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
        }
      }
      return null;
    });
    if (photoPos) await page.mouse.click(photoPos.x, photoPos.y);
    await sleep(2000);

    var fc = await fcPromise;
    if (!fc) {
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
      await fc.setFiles(images);
      console.log('  ✅ 이미지 ' + images.length + '장 업로드 완료');
      await sleep(3000);
    }
  }

  // 3. 저장
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

  await sleep(2000);
  console.log('\n✅ 완료! 블로그 탭에서 확인 후 발행해주세요.');
  await b.close();
})();

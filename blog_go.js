const { chromium } = require('playwright');
const DIR = 'C:/Users/paul/.openclaw/workspace';

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  var pages = ctx.pages();
  var page = null;
  for (var p = 0; p < pages.length; p++) {
    if (pages[p].url().indexOf('blog.naver.com') >= 0 && pages[p].url().indexOf('Write') >= 0) { page = pages[p]; break; }
  }
  if (!page) { console.log('no page'); await b.close(); return; }
  await page.bringToFront();
  await sleep(4000);

  var mf = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    if (page.frames()[fi].name() === 'mainFrame') { mf = page.frames()[fi]; break; }
  }
  if (!mf) { console.log('no mf'); await b.close(); return; }

  // 1. SmartEditor API로 제목 저장 + 포커스
  console.log('1. 제목 입력...');
  var apiResult = await mf.evaluate(function(title) {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      if (!ed) return 'no_ed';
      if (typeof ed.setDocumentTitle === 'function') ed.setDocumentTitle(title);
      if (typeof ed.focusTitle === 'function') ed.focusTitle();
      return 'ok';
    } catch(e) { return 'err'; }
  }, '병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과 (+원장님 인터뷰)');
  console.log('  ' + apiResult);
  await sleep(1000);

  // 2. 타이틀 영역에 키보드 입력으로 React UI 업데이트
  await page.keyboard.type(' 병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과', { delay: 10 });
  await sleep(500);
  console.log('  제목 타이핑 완료');

  await sleep(1500);

  // 3. 본문 영역 클릭 후 타이핑
  console.log('2. 본문 입력...');
  await page.mouse.click(510, 400);
  await sleep(1000);

  var bodyText = [
    '병원 영상마케팅을 고민하는 원장님들께서 가장 궁금해하는 것이 있습니다. 숏폼 영상을 하면 효과가 있을까? 한 편 제작하는 데 얼마나 들지? 환자들이 릴스를 보고 올까? 이 글에서는 실제 병원 마케팅용 숏폼 제작 비용과 그 효과를 공유합니다.',
    '',
    '1. 병원 숏폼 마케팅, 왜 지금 시작해야 할까',
    '대기 시간에 릴스를 보는 환자들은 점점 늘고 있습니다. 실제로 네이버 데이터에 따르면 관련 검색량이 전년 대비 약 2.5배 증가했습니다. 성형외과, 피부과, 치과, 한의원 모두 숏폼 콘텐츠가 진료 예약에 직접적인 영향을 주고 있습니다.',
    '',
    '2. 숏폼 1편, 실제 제작 비용',
    '중요한 건 비용이 아니라 꾸준함입니다. 릴스는 한 번 올린다고 효과가 나지 않습니다. 주 2~3편, 월 8~12편을 최소 3개월 이상 유지해야 검색 상위 노출이 시작됩니다.',
    '',
    '3. 실제 도입 사례 — 성형외과 K원장님',
    '도입 전 팔로워 300명, 문의 월 3~5건에서 도입 3개월 후 팔로워 2,100명, 문의 월 20~30건으로 증가했습니다. 가장 효과가 좋았던 콘텐츠는 비포애프터 영상이었지만, 예상외로 원장님의 진정성 있는 설명이 담긴 숏폼이 더 많은 문의로 이어졌습니다.',
    '',
    '4. 병원 마케팅 영상, 이렇게 준비하세요',
    '핸드폰으로 원장님이 직접 5~10분 촬영하시면 됩니다. 브랜드 가이드를 한 번만 전달해주시면 이후 모든 영상에 일관되게 적용됩니다. 시술홍보 30% + 정보제공 40% + 인터뷰 30% 비율이 가장 효과적입니다.',
    '',
    '5. 지금 시작해야 하는 이유',
    '네이버와 인스타그램 모두 숏폼 콘텐츠에 검색 가중치를 높이고 있습니다. 지금 시작하는 병원과 6개월 후 시작하는 병원의 차이는 쌓인 콘텐츠의 차이입니다.',
    '',
    '여러분의 병원은 어떤 숏폼 콘텐츠로 환자들에게 다가가고 계신가요?',
    '',
    '카카오톡 채널: 에이컷 | 이메일: contact@aicut.co.kr | 홈페이지: aicut.co.kr'
  ];

  for (var i = 0; i < bodyText.length; i++) {
    var line = bodyText[i];
    if (line === '') {
      await page.keyboard.press('Enter');
      await sleep(80);
    } else {
      await page.keyboard.type(line, { delay: 3 });
      await page.keyboard.press('Enter');
      await sleep(80);
    }
  }
  console.log('  본문 타이핑 완료');

  await sleep(2000);

  // 4. 이미지 업로드
  console.log('3. 이미지 업로드...');
  try {
    var fcPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(function() { return null; });
    await page.mouse.click(36, 74);
    await sleep(2000);
    
    var fc = await fcPromise;
    if (!fc) {
      fcPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(function() { return null; });
      await page.mouse.click(200, 250);
      await sleep(2000);
      fc = await fcPromise;
    }
    
    if (fc) {
      await fc.setFiles([DIR + '/blog_img_hospital.png', DIR + '/body_hospital_stat.png']);
      console.log('  ✅ 이미지 업로드 완료');
      await sleep(3000);
    }
  } catch(e) {
    console.log('  ⚠️ 업로드 실패');
  }

  // 5. 저장
  console.log('4. 저장...');
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

  await sleep(3000);
  console.log('\n✅ 완료! 블로그 탭 확인해주세요.');
  await b.close();
})();

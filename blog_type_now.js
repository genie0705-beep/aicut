const { chromium } = require('playwright');

async function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];

  var pages = ctx.pages();
  var page = null;
  for (var p = 0; p < pages.length; p++) {
    if (pages[p].url().indexOf('blog.naver.com') >= 0 && pages[p].url().indexOf('Write') >= 0) {
      page = pages[p]; break;
    }
  }
  if (!page) { console.log('no page'); await b.close(); return; }

  await page.bringToFront();
  await sleep(3000);

  // === 타이틀 입력 ===
  // se-docu 영역 (y=139~310) 클릭
  var titleX = 510;
  var titleY = 180;
  console.log('1. 제목 입력 (클릭 위치: ' + titleX + ',' + titleY + ')');
  await page.mouse.click(titleX, titleY);
  await sleep(800);

  // 제목 텍스트
  var title = '병원 영상마케팅, 숏폼 1편 제작 비용과 실제 효과 (+원장님 인터뷰)';
  await page.keyboard.type(title, { delay: 10 });
  console.log('  ✅ 제목: ' + title.substring(0, 20) + '...');

  await sleep(1000);

  // === 본문 입력 ===
  // se-text 영역 (y=350+) 클릭
  var bodyX = 510;
  var bodyY = 380;
  console.log('2. 본문 입력 (클릭 위치: ' + bodyX + ',' + bodyY + ')');
  await page.mouse.click(bodyX, bodyY);
  await sleep(1000);

  // H2: Enter 키로 새로운 문단
  var lines = [
    // 문단 1
    '병원 영상마케팅을 고민하는 원장님들께서 가장 궁금해하는 것이 있습니다. "숏폼 영상을 하면 효과가 있을까?" "한 편 제작하는 데 얼마나 들지?" "환자들이 릴스를 보고 올까?" 이 글에서는 실제 병원 마케팅용 숏폼 제작 비용과 그 효과를 구체적인 사례와 함께 공유합니다.',
    '',
    '1. 병원 숏폼 마케팅, 왜 지금 시작해야 할까',
    '',
    '대기 시간에 릴스를 보는 환자들은 점점 늘고 있습니다. 특히 20~30대 환자층은 병원 선택 전 인스타그램이나 유튜브에서 시술 후기 영상을 먼저 검색합니다. 실제로 네이버 데이터에 따르면 "병원+릴스+시술후기" 검색량이 전년 대비 약 2.5배 증가했습니다.',
    '',
    '2. 숏폼 1편, 실제 제작 비용',
    '',
    '중요한 건 비용이 아니라 꾸준함입니다. 릴스는 한 번 올린다고 효과가 나지 않습니다. 주 2~3편, 월 8~12편을 최소 3개월 이상 유지해야 검색 상위 노출이 시작됩니다.',
    '',
    '3. 실제 도입 사례 — 성형외과 K원장님',
    '',
    '처음엔 릴스가 환자 유입에 도움이 될까 의문이었어요. 그런데 3개월 차부터 달라지기 시작했습니다. 도입 전 팔로워 300명, 문의 월 3~5건에서 도입 3개월 후 팔로워 2,100명, 문의 월 20~30건으로 증가했습니다.',
    '',
    '4. 병원 마케팅 영상, 이렇게 준비하세요',
    '',
    '핸드폰으로 원장님이 직접 5~10분 촬영하시면 됩니다. 브랜드 가이드(로고, 색상, 폰트)를 한 번만 전달해주시면 이후 모든 영상에 일관되게 적용됩니다.',
    '',
    '5. 지금 시작해야 하는 이유',
    '',
    '네이버와 인스타그램 모두 숏폼 콘텐츠에 검색 가중치를 높이고 있습니다. 지금 시작하는 병원과 6개월 후 시작하는 병원의 차이는 쌓인 콘텐츠의 차이입니다.',
    '',
    '여러분의 병원은 어떤 숏폼 콘텐츠로 환자들에게 다가가고 계신가요? 댓글로 현재 운영 중인 병원 SNS 채널을 알려주시면, 무료로 숏폼 콘텐츠 방향성을 제안해드립니다.',
    '',
    '카카오톡 채널: 에이컷 | 이메일: contact@aicut.co.kr | 홈페이지: aicut.co.kr'
  ];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line === '') {
      await page.keyboard.press('Enter');
      await sleep(200);
    } else {
      await page.keyboard.type(line, { delay: 4 });
      await page.keyboard.press('Enter');
      await sleep(150);
    }
  }
  console.log('  ✅ 본문 ' + lines.length + '줄 입력 완료');

  await sleep(2000);

  // === 이미지 업로드 ===
  console.log('3. 이미지 업로드...');
  // 사진 버튼 위치: (36, 74)
  var fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
  await page.mouse.click(36, 74);
  await sleep(2000);

  var fc = await fcPromise;
  if (!fc) {
    // 내 PC에서 업로드
    fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(function() { return null; });
    await page.mouse.click(200, 250); // 일반적인 내 PC 버튼 위치 
    await sleep(2000);
    fc = await fcPromise;
  }

  if (fc) {
    await fc.setFiles([
      'C:/Users/paul/.openclaw/workspace/blog_img_hospital.png',
      'C:/Users/paul/.openclaw/workspace/body_hospital_stat.png'
    ]);
    console.log('  ✅ 이미지 2장 업로드 완료');
    await sleep(3000);
  } else {
    console.log('  ⚠️ 이미지 업로드 실패');
  }

  // === 저장 ===
  console.log('4. 저장...');
  await page.mouse.click(1762, 22);  // 저장 버튼 위치 (1744 + 18, 7 + 15)
  await sleep(3000);

  console.log('\n✅ 블로그 작성 완료! 브라우저 확인해주세요.');
  await b.close();
})();

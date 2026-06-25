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
  await sleep(4000);

  // Find mainFrame for toolbar position
  let mf = null;
  for (const f of page.frames()) { if (f.name() === 'mainFrame') { mf = f; break; } }
  if (!mf) { console.log('no mainFrame'); await b.close(); return; }

  // Step 1: Find toolbar Y position
  var toolbarY = await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '저장' || t.indexOf('사진') >= 0) {
        return Math.round(btns[i].getBoundingClientRect().y);
      }
    }
    return 47;
  });
  console.log('툴바 Y:', toolbarY);

  // Step 2: Click title area (above toolbar) and type
  var titleY = toolbarY - 70;
  console.log('제목 입력 (y=' + titleY + ')...');
  await page.mouse.click(200, titleY);
  await sleep(800);
  
  var titleText = '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점';
  await page.keyboard.type(titleText, { delay: 12 });
  console.log('  제목: ' + titleText.substring(0, 20) + '...');

  await sleep(1000);

  // Step 3: Click body area (below toolbar) and type
  var bodyY = toolbarY + 50;
  console.log('본문 입력 (y=' + bodyY + ')...');
  await page.mouse.click(200, bodyY);
  await sleep(800);

  var bodyLines = [
    '온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 퀄리티가 수강생 선택의 핵심 기준이 되고 있습니다. 강의 내용도 중요하지만, 편집의 완성도가 시청자의 몰입과 만족도를 결정합니다.',
    '',
    '1. 강의 퀄리티가 비약적으로 상승한다',
    '',
    '자막의 가독성, 호흡 조절, 브랜드 통일감 — 전문 편집자는 모든 요소를 한 번에 처리합니다.',
    '',
    '2. 제작 시간이 70% 단축된다',
    '',
    '1시간 강의 편집에 3~4시간 필요하지만, 아웃소싱하면 시간이 대폭 줄어듭니다.',
    '',
    '3. 숏폼 채널을 자동으로 성장시킨다',
    '',
    '릴스, 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.',
    '',
    '4. 편집 파트너 고를 때 체크할 3가지',
    '',
    '① 강의 콘텐츠를 이해하는가 ② 정기 납품이 가능한가 ③ 빠른 수정 대응이 가능한가',
    '',
    '5. 지금 시작해야 하는 이유',
    '',
    '네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다.',
    '',
    '지금 무료 상담 받기',
    '카카오톡 채널: 에이컷',
    '이메일: contact@aicut.co.kr',
    '홈페이지: aicut.co.kr'
  ];

  for (var i = 0; i < bodyLines.length; i++) {
    var line = bodyLines[i];
    if (line === '') {
      await page.keyboard.press('Enter');
    } else {
      await page.keyboard.type(line, { delay: 8 });
      if (i < bodyLines.length - 1) {
        await page.keyboard.press('Enter');
      }
    }
    await sleep(100);
  }
  console.log('  본문 ' + bodyLines.length + '줄 입력 완료');

  await sleep(2000);

  // Step 4: Save button
  console.log('저장...');
  var savePos = await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        var r = btns[i].getBoundingClientRect();
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
      }
    }
    return null;
  });

  if (savePos) {
    await page.mouse.click(savePos.x, savePos.y);
    console.log('  저장됨');
  }

  await sleep(3000);
  console.log('\n✅ 블로그 작성 완료! 확인해주세요.');
  await b.close();
})();

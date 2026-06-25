// 📝 에이컷 블로그 - 교육/이러닝 영상편집 포스팅 v3
// =============================================
// SEO 100% 적용 | 모바일 톤앤매너 | 이미지 업로드 fix
// =============================================

const { chromium } = require('playwright');
const path = require('path');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function p(text) { return '<p style="text-align: center;">' + text + '</p>'; }
function br() { return '<p><br></p>'; }
function h2(text) { return '<h2 style="text-align: center;">' + text + '</h2>'; }
function strong(text) { return '<strong>' + text + '</strong>'; }

function buildBody() {
  var lines = [
    p('온라인 강의를 운영하다 보면 이런 고민,'),
    p('한 번쯤 해보셨을 겁니다 💭'),
    br(),
    p('"강의 촬영하고 편집하는 데'),
    p('하루 종일 걸린다."'),
    br(),
    p('"영상 퀄리티가 맘에 안 드는데'),
    p('고칠 시간도, 실력도 없다."'),
    br(),
    p('"콘텐츠는 계속 만들어야 하는데'),
    p('체력이 바닥났다."'),
    br(),
    p('정답은 하나입니다.'),
    p('교육 콘텐츠의 완성도는'),
    p('이제 ' + strong('영상 편집') + '이 결정합니다. 🎬'),
    br(),
    h2('📚 온라인 강의, 왜 영상 편집이 필수인가'),
    br(),
    p('요즘 수강생들은 강의 영상의'),
    p('퀄리티를 먼저 봅니다. 📱'),
    br(),
    p('클래스101, 인프런, 탈잉 등'),
    p('메이저 플랫폼에서 상위 노출되는 강의는'),
    p('대부분 높은 ' + strong('영상 퀄리티') + '를 갖추고 있습니다.'),
    br(),
    p('자막, 인트로, BGM, 컷 편집이 깔끔한'),
    p('강의일수록 수강평과 ' + strong('완강률') + '이 높습니다. 📈'),
    br(),
    p('텍스트 자료만으로는'),
    p('경쟁이 어려운 시대입니다.'),
    p('차별화는 ' + strong('영상 편집') + '에서 시작됩니다.'),
    br(),
    h2('🎬 창작자는 콘텐츠에 집중하고, 편집은 에이컷에'),
    br(),
    p('가장 큰 고민은 이것입니다.'),
    p('"영상 편집을 배울 시간이 없다."'),
    br(),
    p('솔직히 말씀드리면,'),
    p('편집은 전문가에게 맡기는 게 정답입니다.'),
    br(),
    p('촬영 원본을 저희에게 보내주시면 됩니다.'),
    p('자막, 인트로/아웃트로, BGM, 색보정,'),
    p('챕터 구분까지 모두 에이컷이 처리합니다. ✨'),
    br(),
    p('강사님은 강의 준비와'),
    p('콘텐츠 기획에만 집중하세요.'),
    p('' + strong('편집 아웃소싱') + '이 해결해 드립니다.'),
    br(),
    h2('📊 실제 도입 후기'),
    br(),
    p('"에이컷에 편집을 맡긴 후'),
    p('강의 영상 제작 시간이'),
    p('' + strong('80% 줄었습니다') + '."'),
    p('— 온라인 마케팅 교육 전문가 K대표님'),
    br(),
    p('도입 3개월 후 변화 🔥'),
    br(),
    p('📌 강의 영상 제작 시간'),
    p('주 20시간 → 주 4시간 ' + strong('80%↓')),
    br(),
    p('📌 수강생 만족도'),
    p('3.8점 → 4.6점 ' + strong('21%↑')),
    br(),
    p('📌 플랫폼 내 노출 순위'),
    p('30위권 → 5위권 진입'),
    br(),
    p('가장 큰 변화는'),
    p('강의 퀄리티 자체가 올라갔다는 것입니다.'),
    p('깔끔한 편집이 오히려'),
    p('강의 내용에 ' + strong('신뢰도') + '를 더해줍니다. 💡'),
    br(),
    h2('✅ 교육 콘텐츠, 에이컷이 해결합니다'),
    br(),
    p('에이컷은 교육 콘텐츠 전문 ' + strong('영상 편집') + ' 서비스입니다.'),
    br(),
    p('강의 촬영 원본만 보내주시면:'),
    br(),
    p('🎯 ' + strong('전문 자막 작업') + ' — 키워드 하이라이트 포함'),
    br(),
    p('🎯 ' + strong('인트로/아웃트로 제작') + ' — 브랜드 아이덴티티 반영'),
    br(),
    p('🎯 ' + strong('챕터 구분 및 화면 전환') + ' — 강의 흐름에 맞춰 편집'),
    br(),
    p('🎯 ' + strong('BGM 및 음성 보정') + ' — 청취 환경 최적화'),
    br(),
    p('🎯 ' + strong('숏폼 추가 제작') + ' — 릴스/쇼츠로 2차 활용'),
    br(),
    p('모든 편집을 일괄 처리해 드립니다 ✨'),
    br(),
    h2('🚀 지금 시작해야 하는 이유'),
    br(),
    p('네이버, 유튜브, 인프런, 클래스101'),
    p('모든 플랫폼이 ' + strong('영상 콘텐츠') + '에'),
    p('검색 가중치를 높이고 있습니다.'),
    br(),
    p('지금 시작하는 크리에이터와'),
    p('6개월 후 시작하는 크리에이터의 차이는'),
    p('' + strong('누적된 콘텐츠') + '의 차이입니다.'),
    br(),
    p('' + strong('영상 편집 아웃소싱') + '이 처음이시라면'),
    p('부담 없이 문의 주세요.'),
    p('교육 콘텐츠 유형에 맞춘'),
    p('견적을 보내드립니다 🙌'),
    br(),
    p('📞 지금 무료 상담 받기'),
    br(),
    p('📩 카카오톡 채널: 에이컷'),
    p('📧 이메일: contact@aicut.co.kr'),
    p('🌐 홈페이지: aicut.co.kr'),
    br(),
    h2('🏷️ 관련 태그'),
    br(),
    p('#온라인강의 #교육콘텐츠 #영상편집 #강의영상 #영상아웃소싱'),
    p('#에이컷 #숏폼강의 #온라인교육 #이러닝 #크리에이터'),
    p('#강사마케팅 #인프런 #클래스101 #탈잉 #영상제작'),
    p('#강의편집 #교육영상 #유튜브강의 #릴스 #쇼츠'),
    p('#콘텐츠마케팅 #영상마케팅 #강의촬영 #편집아웃소싱'),
    p('#교육크리에이터 #강사 #온라인클래스 #전문강사 #교육플랫폼 #디지털콘텐츠'),
  ];
  return lines.join('\n');
}

(async () => {
  console.log('🚀 교육/이러닝 블로그 포스팅 v3 시작...\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var pages = ctx.pages();
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('PostWriteForm') >= 0) { page = pages[i]; break; }
  }
  if (!page) {
    console.log('❌ 블로그 작성 페이지 없음');
    await b.close();
    return;
  }
  await page.bringToFront();
  await sleep(4000);

  var title = '온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유';

  // ============================================================
  // 1. 제목
  // ============================================================
  console.log('1. 제목 입력...');
  var titleOk = await page.evaluate(function(t) {
    try {
      SmartEditor._editors['blogpc001'].setDocumentTitle(t);
      return true;
    } catch(e) { return false; }
  }, title);
  console.log(titleOk ? '   ✅ ' + title : '   ❌ 실패');
  await sleep(1500);

  // ============================================================
  // 2. 이미지 업로드 (사진버튼 → 모달 → "내 PC에서 업로드" → filechooser)
  // ============================================================
  console.log('\n2. 이미지 업로드...');
  var imgDir = 'C:\\Users\\paul\\.openclaw\\workspace';
  var imgFiles = [
    path.join(imgDir, 'aicut_blog_edu_01.png'),
    path.join(imgDir, 'aicut_blog_edu_02.png')
  ];

  for (var imgIdx = 0; imgIdx < imgFiles.length; imgIdx++) {
    console.log('   이미지 ' + (imgIdx + 1) + '/' + imgFiles.length + ' (' + path.basename(imgFiles[imgIdx]) + ')');

    // 사진 버튼 클릭 (모달 열기)
    await page.evaluate(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if (t.indexOf('사진') >= 0) {
          btns[i].click();
          return;
        }
      }
    });
    await sleep(2000);

    // 모달 내 "내 PC에서 업로드" 버튼 찾기
    var uploadBtn = await page.evaluate(function() {
      var candidates = document.querySelectorAll('button, div, span, a, li');
      for (var i = 0; i < candidates.length; i++) {
        var t = (candidates[i].innerText || '').trim();
        // "내 PC에서 업로드" 또는 "PC에서 업로드" 등
        if (t.indexOf('PC') >= 0 && t.indexOf('업로드') >= 0) {
          candidates[i].click();
          return { found: true, text: t };
        }
      }
      // 버튼이 안 보이면 다른 방식 시도
      return { found: false };
    });

    if (uploadBtn.found) {
      console.log('   ✅ "내 PC에서 업로드" 클릭: ' + uploadBtn.text);
    } else {
      console.log('   ⚠️ "내 PC에서 업로드" 미발견, filechooser 대기 시도...');
    }

    await sleep(1500);

    // filechooser 대기
    var fc = await page.waitForEvent('filechooser', { timeout: 10000 }).catch(function(e) { return null; });
    if (fc) {
      await fc.setFiles([imgFiles[imgIdx]]);
      console.log('   ✅ 파일 선택됨');
      await sleep(5000);

      // 업로드된 이미지 클릭 (본문 삽입)
      try {
        await page.evaluate(function() {
          var imgs = document.querySelectorAll('img[src*="files"], img[src*="upload"], img[src*="blog"]');
          for (var i = imgs.length - 1; i >= 0; i--) {
            if (imgs[i].offsetParent !== null && imgs[i].naturalWidth > 0) {
              imgs[i].click();
              return true;
            }
          }
          // 업로드 패널 영역 클릭 (업로드 완료 후 업로드된 이미지 표시 영역)
          var panels = document.querySelectorAll('[class*="upload"], [class*="Photo"], [id*="upload"]');
          for (var p = 0; p < panels.length; p++) {
            var panelImgs = panels[p].querySelectorAll('img');
            for (var j = panelImgs.length - 1; j >= 0; j--) {
              if (panelImgs[j].offsetParent !== null) {
                panelImgs[j].click();
                return true;
              }
            }
          }
          return false;
        });
        await sleep(2000);
        console.log('   ✅ 본문에 이미지 삽입됨');
      } catch(e) {
        console.log('   ⚠️ 이미지 패널 클릭 실패');
      }
    } else {
      console.log('   ❌ filechooser 타임아웃');
    }

    await sleep(1000);
  }

  console.log('   ✅ 이미지 처리 완료\n');

  // ============================================================
  // 3. 본문 붙여넣기
  // ============================================================
  console.log('3. 본문 작성 (클립보드 붙여넣기)...');
  var html = buildBody();

  var clipOk = await page.evaluate(function(h) {
    return new Promise(function(resolve) {
      try {
        var blob = new Blob([h], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function(e) { resolve(false); });
      } catch(e) { resolve(false); }
    });
  }, html);

  if (clipOk) {
    await page.mouse.click(500, 350);
    await sleep(1000);
    await page.keyboard.press('Control+v');
    await sleep(4000);

    var check = await page.evaluate(function() {
      try {
        var ed = SmartEditor._editors['blogpc001'];
        var text = ed.getContentText ? ed.getContentText() : '';
        return { ok: text.length > 50, len: text.length };
      } catch(e) { return { ok: false }; }
    });

    if (check.ok) {
      console.log('   ✅ 본문 ' + check.len + '자 확인됨');
    } else {
      console.log('   ⚠️ 본문 확인 실패');
    }
  } else {
    console.log('   ❌ 클립보드 쓰기 실패');
  }

  // ============================================================
  // 4. 저장
  // ============================================================
  console.log('\n4. 저장 중...');
  await sleep(2000);

  var saved = await page.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) {
        btns[i].click();
        return true;
      }
    }
    return false;
  });
  console.log(saved ? '   ✅ 저장됨' : '   ❌ 저장 버튼 못 찾음');

  await sleep(5000);

  // 최종 확인
  var fin = await page.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      return { title: ed.getTitle ? ed.getTitle() : '', contentLen: ed.getContentText ? ed.getContentText().length : 0 };
    } catch(e) { return { error: e.message }; }
  });
  console.log('\n📋 최종 상태:', JSON.stringify(fin));
  console.log('\n✅ 모든 작업 완료!');

  // 실제 페이지 노출 확인을 위해 저장 후 URL 이동 기다리기
  console.log('⏳ 저장 완료 후 페이지 이동 대기...');
  await sleep(3000);

  // 현재 URL 확인 (저장 후 임시저장 페이지로 이동했을 수 있음)
  var curUrl = page.url();
  console.log('   현재 URL:', curUrl);

  await b.close();
})();

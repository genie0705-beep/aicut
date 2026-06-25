// 인스타그램 + Threads 포스팅 - 교육/이러닝 콘텐츠
const { chromium } = require('playwright');
const path = require('path');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

// 인스타 캡션
const INSTA_CAPTION = `온라인 강의·교육 콘텐츠 창작자라면 주목! 📚

강의 촬영하고 편집하는 데 하루 종일 걸리시나요?

💭 이런 고민, 해보셨죠?
"영상 퀄리티가 맘에 안 드는데 고칠 시간도 없다"
"콘텐츠는 계속 만들어야 하는데 체력이 바닥났다"
"영상 편집을 배울 시간이 없다"

정답은 하나입니다.
교육 콘텐츠의 완성도는 이제 영상 편집이 결정합니다 🎬

에이컷이 해결해 드립니다 ✨
✔ 전문 자막 작업 (키워드 하이라이트)
✔ 인트로/아웃트로 제작
✔ 챕터 구분 및 화면 전환
✔ BGM 및 음성 보정
✔ 릴스/쇼츠 숏폼 추가 제작

강사님은 강의 준비와 콘텐츠 기획에만 집중하세요!
촬영 원본만 보내주시면 됩니다 🙌

📩 문의: aicut.co.kr

#온라인강의 #교육콘텐츠 #영상편집 #강의영상 #에이컷
#인프런 #클래스101 #탈잉 #강사마케팅 #숏폼강의
#영상아웃소싱 #교육크리에이터 #유튜브강의 #강의편집
#콘텐츠마케팅 #이러닝 #온라인클래스 #릴스 #쇼츠`;

// Threads 글
const THREADS_TEXT = `온라인 강의·교육 콘텐츠 창작자라면 영상 편집 아웃소싱이 필요한 이유 📚

강의 촬영하고 편집하는 데 하루 종일 걸리시나요?

💭 "영상 퀄리티가 맘에 안 드는데 고칠 시간도 없다"
💭 "콘텐츠는 계속 만들어야 하는데 체력이 바닥났다"

교육 콘텐츠의 완성도는 이제 편집이 결정합니다.

에이컷은 교육 콘텐츠 전문 영상 편집 서비스입니다.
촬영 원본만 보내주시면 자막, 인트로, BGM, 숏폼까지 모두 처리해 드립니다 ✨

강사님은 콘텐츠에만 집중하세요!

📩 aicut.co.kr

#온라인강의 #교육콘텐츠 #영상편집 #에이컷 #강사 #크리에이터 #인프런 #클래스101`;

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // ============================================================
  // 1. 인스타그램 포스팅
  // ============================================================
  console.log('🚀 [1/2] 인스타그램 포스팅 시작\n');

  var instaPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com/aicut') >= 0) { instaPage = pages[i]; break; }
  }
  if (!instaPage) { console.log('❌ 인스타 페이지 없음'); }
  else {
    await instaPage.bringToFront();
    await sleep(2000);

    // 홈으로 이동
    try { await instaPage.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 15000 }); } catch(e) {}
    await sleep(3000);

    // 새 게시물 버튼 SVG 클릭
    var createClicked = await instaPage.evaluate(function() {
      var svgs = document.querySelectorAll('svg');
      for (var i = 0; i < svgs.length; i++) {
        var title = svgs[i].querySelector('title');
        if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
          var btn = svgs[i].closest('a') || svgs[i].closest('button') || svgs[i].closest('[role="button"]');
          if (btn) { btn.click(); return true; }
        }
      }
      return false;
    });
    console.log('1. 새 게시물 버튼:', createClicked ? '✅' : '❌');
    await sleep(2000);

    // "게시물" 옵션 선택
    var postOptClicked = await instaPage.evaluate(function() {
      var items = document.querySelectorAll('button, [role="button"], a, span, div');
      for (var i = 0; i < items.length; i++) {
        var t = (items[i].innerText || '').trim();
        if (t === '게시물' || t === 'Post') {
          items[i].click(); return true;
        }
      }
      return false;
    });
    console.log('2. 게시물 옵션:', postOptClicked ? '✅' : '❌');
    await sleep(2000);

    // 파일 input 찾기
    var fileInput = await instaPage.$('input[type="file"]');
    if (fileInput) {
      // 4개 이미지 업로드 (캐러셀)
      var imgDir = 'C:\\Users\\paul\\.openclaw\\workspace\\';
      var imgs = [
        imgDir + 'aicut_blog_edu_01.png',
        imgDir + 'aicut_blog_edu_02.png',
        imgDir + 'aicut_blog_edu_03.png',
        imgDir + 'aicut_blog_edu_04.png'
      ];
      await fileInput.setInputFiles(imgs);
      console.log('3. 이미지 4장 업로드 ✅');
      await sleep(3000);

      // "다음" 2번 클릭 (크롭 → 필터)
      for (var step = 0; step < 2; step++) {
        var nextClicked = await instaPage.evaluate(function() {
          var btns = document.querySelectorAll('button, [role="button"]');
          for (var i = 0; i < btns.length; i++) {
            var t = (btns[i].innerText || '').trim();
            if (t === '다음' || t === 'Next') {
              btns[i].click(); return true;
            }
          }
          return false;
        });
        if (nextClicked) { console.log('   다음 (' + (step+1) + '단계) ✅'); await sleep(2500); }
        else break;
      }

      // 캡션 입력
      var captionInput = await instaPage.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea[placeholder*="문구"], [contenteditable="true"][role="textbox"]');
      if (captionInput) {
        await captionInput.click({ force: true });
        await sleep(500);
        // 타이핑
        for (var c = 0; c < INSTA_CAPTION.length; c++) {
          await instaPage.keyboard.type(INSTA_CAPTION[c], { delay: 5 });
          if (c % 50 === 0) await sleep(50);
        }
        console.log('4. 캡션 입력 ✅');
      } else {
        console.log('4. ⚠️ 캡션 입력창 못 찾음');
      }
      await sleep(1500);

      // 공유하기
      var shareClicked = await instaPage.evaluate(function() {
        var btns = document.querySelectorAll('button, [role="button"]');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          if ((t === '공유하기' || t === 'Share') && !btns[i].disabled) {
            btns[i].click(); return true;
          }
        }
        return false;
      });
      console.log('5. 공유하기:', shareClicked ? '✅' : '⚠️ 버튼 못 찾음');
      await sleep(6000);
      console.log('\n✅ 인스타그램 포스팅 완료!\n');
    } else {
      console.log('❌ 파일 input 못 찾음');
    }
  }

  // ============================================================
  // 2. Threads 포스팅
  // ============================================================
  console.log('🚀 [2/2] Threads 포스팅 시작\n');

  var threadsPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('threads.com/@aicut') >= 0) { threadsPage = pages[i]; break; }
  }
  if (!threadsPage) {
    console.log('❌ Threads 페이지 없음');
    // 새로 열기
    threadsPage = await ctx.newPage();
    await threadsPage.goto('https://www.threads.com/@aicut.official', { waitUntil: 'networkidle', timeout: 30000 });
  }

  await threadsPage.bringToFront();
  await sleep(3000);

  // Threads 글쓰기 버튼 찾기
  var writeBtn = await threadsPage.evaluate(function() {
    var btns = document.querySelectorAll('a, button, div[role="button"]');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '글쓰기' || t === '새 글' || t === 'New post' || t === 'Write' || t === '시작하기') {
        btns[i].click(); return true;
      }
      // SVG 아이콘 확인
      var svg = btns[i].querySelector('svg');
      if (svg) {
        var title = svg.querySelector('title');
        if (title && (title.textContent.indexOf('write') >= 0 || title.textContent.indexOf('Write') >= 0 || title.textContent.indexOf('post') >= 0 || title.textContent.indexOf('Post') >= 0)) {
          btns[i].click(); return true;
        }
      }
    }
    // + 아이콘 버튼 찾기
    var allEls = document.querySelectorAll('*');
    for (var i = 0; i < allEls.length; i++) {
      var t = (allEls[i].innerText || '').trim();
      if (t === '+' && allEls[i].offsetParent !== null) {
        allEls[i].click(); return true;
      }
    }
    return false;
  });
  console.log('1. 글쓰기 버튼:', writeBtn ? '✅' : '⚠️');
  await sleep(3000);

  // 텍스트 에디터 찾기
  var textInput = await threadsPage.$('[contenteditable="true"], textarea, [role="textbox"]');
  if (textInput) {
    await textInput.click({ force: true });
    await sleep(500);

    // 텍스트 입력
    for (var c = 0; c < THREADS_TEXT.length; c++) {
      await threadsPage.keyboard.type(THREADS_TEXT[c], { delay: 5 });
      if (c % 50 === 0) await sleep(50);
    }
    console.log('2. 글 작성 ✅');
    await sleep(1500);

    // 게시 버튼 찾기
    var postClicked = await threadsPage.evaluate(function() {
      var btns = document.querySelectorAll('button, [role="button"]');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '게시' || t === 'Post' || t === '공유' || t === 'Share') && !btns[i].disabled) {
          btns[i].click(); return true;
        }
      }
      return false;
    });
    console.log('3. 게시:', postClicked ? '✅' : '⚠️');
    await sleep(5000);
    console.log('\n✅ Threads 포스팅 완료!');
  } else {
    console.log('❌ 텍스트 입력창 못 찾음');
  }

  console.log('\n🎉 인스타그램 + Threads 모두 처리 완료!');
  await b.close();
})().catch(function(e) { console.error('오류:', e.message); });

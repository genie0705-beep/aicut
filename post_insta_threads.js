const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand(min, max) { return Math.floor(Math.random() * (max - min) + min); }

var IMG_FILES = [
  DIR + '/aicut_blog_worker.png',
  DIR + '/aicut_body_worker_cycle.png',
  DIR + '/aicut_body_worker_cost.png',
  DIR + '/aicut_body_worker_after.png'
];

var CAPTION = [
  '영상편집 때문에 새벽 3시까지 붙잡고 있던 직장인의 썰 ',
  '',
  '"퇴근하고, 아이 재우고, 밤 11시 노트북 앞에 앉는 삶"',
  '"자막 넣다가 새벽 2시, 효과 넣다가 새벽 3시"',
  '',
  '3개월 삽질 끝에 깨달았습니다.',
  '시간당 3만원인 내 시간으로 5시간 편집하는 게',
  '오히려 손해라는 걸 ',
  '',
  '에이컷에 맡긴 후 달라진 점:',
  '- 밤 11시에 잔다 (더 이상 새벽 3시 없다)',
  '- 퀄리티 업 (전문가 편집)',
  '- 와이프 표정 좋아짐 ',
  '',
  '직장인은 편집할 시간에 기획해야 합니다.',
  '',
  'aicut.co.kr',
  '',
  '#영상편집외주 #직장인에세이 #영상편집대행 #숏폼제작',
  '#밤샘편집 #직장인일상 #영상편집 #에이컷 #AICUT'
].join('\n');

var THREADS_TEXT = [
  '영상편집 때문에 새벽 3시까지 붙잡고 있던 직장인의 썰',
  '',
  '"퇴근하고 아이 재우고 밤 11시에 편집 시작해서 새벽 3시..."',
  '3개월 삽질 끝에 깨달았어요.',
  '내 시간이 더 귀하다는 것을.',
  '',
  '에이컷에 맡기고 나니 밤 11시에 잡니다.',
  '퀄리티는 올라가고 비용은 더 아껴지고',
  '',
  '직장인은 편집할 시간에 기획을 해야죠.',
  'aicut.co.kr',
  '',
  '#영상편집외주 #직장인 #숏폼제작 #에이컷 #밤샘편집'
].join('\n');

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  var pages = ctx.pages();

  // === 1. Instagram ===
  var igPage = pages[0];
  if (igPage && igPage.url().includes('instagram.com')) {
    console.log('[Instagram] 시작...');
    await igPage.bringToFront();
    await sleep(2000);

    try {
      // 새 게시물 버튼
      var newPostBtn = await igPage.evaluate(function() {
        var svgs = document.querySelectorAll('svg');
        for (var i = 0; i < svgs.length; i++) {
          var title = svgs[i].querySelector('title');
          if (title && (title.textContent === '새로운 게시물' || title.textContent === 'New post')) {
            var btn = svgs[i].closest('[role="button"], button, a');
            if (btn) { btn.click(); return true; }
          }
        }
        return false;
      });
      console.log('  새 게시물:', newPostBtn);
      await sleep(2000);

      // 게시물 옵션
      if (newPostBtn) {
        var postOpt = await igPage.evaluate(function() {
          var items = Array.from(document.querySelectorAll('button, [role="button"], a, span'));
          var item = items.find(function(el) {
            var t = (el.innerText || '').trim();
            return t === '게시물' || t === 'Post';
          });
          if (item) { item.click(); return true; }
          return false;
        });
        console.log('  게시물 옵션:', postOpt);
        await sleep(1500);
      }

      // 파일 업로드
      var fileInput = await igPage.$('input[type="file"]');
      if (fileInput) {
        var validFiles = IMG_FILES.filter(function(f) { return fs.existsSync(f); });
        console.log('  이미지 ' + validFiles.length + '개 업로드');
        await fileInput.setInputFiles(validFiles);
        console.log('  업로드 완료');
        await sleep(3000);

        // 다음 3번
        for (var step = 0; step < 3; step++) {
          var nextBtn = await igPage.evaluate(function() {
            var btns = Array.from(document.querySelectorAll('button, [role="button"]'));
            var btn = btns.find(function(b) {
              var t = (b.innerText || '').trim();
              return t === '다음' || t === 'Next';
            });
            if (btn && !btn.disabled) { btn.click(); return true; }
            return false;
          });
          if (nextBtn) { console.log('  다음 ' + (step+1)); await sleep(2500); }
          else { break; }
        }

        // 캡션
        var captionEl = await igPage.$('[aria-label*="캡션"], [aria-label*="Caption"], textarea, [contenteditable="true"][role="textbox"]');
        if (captionEl) {
          await captionEl.click({ force: true });
          await sleep(500);
          await igPage.keyboard.type(CAPTION, { delay: 10 });
          console.log('  캡션 입력 완료');
        }
        await sleep(1000);

        // 공유하기
        var shareBtn = await igPage.evaluate(function() {
          var btns = Array.from(document.querySelectorAll('button, [role="button"]'));
          var btn = btns.find(function(b) {
            var t = (b.innerText || '').trim();
            return (t === '공유하기' || t === 'Share') && !b.disabled;
          });
          if (btn) { btn.click(); return true; }
          return false;
        });
        console.log('  공유하기:', shareBtn ? '클릭!' : '못찾음');
        await sleep(6000);
        console.log('  Instagram 완료!');
      }
    } catch(e) {
      console.log('  오류:', e.message.split('\n')[0].substring(0, 60));
    }
  }

  // === 2. Threads ===
  var thPage = pages[1];
  if (thPage && thPage.url().includes('threads.com')) {
    console.log('\n[Threads] 시작...');
    await thPage.bringToFront();
    await sleep(2000);

    try {
      // 입력창 찾기
      var found = await thPage.evaluate(function() {
        var textboxes = document.querySelectorAll('[role="textbox"], [contenteditable]');
        for (var i = 0; i < textboxes.length; i++) {
          var r = textboxes[i].getBoundingClientRect();
          if (r.width > 100 && r.height > 30) {
            textboxes[i].click();
            return true;
          }
        }
        return false;
      });
      console.log('  입력창:', found ? '클릭' : '못찾음');
      await sleep(1000);

      if (found) {
        await thPage.keyboard.type(THREADS_TEXT, { delay: 10 });
        console.log('  텍스트 입력 완료');
        await sleep(1000);

        // 이미지 첨부
        var fileInput = await thPage.$('input[type="file"]');
        if (fileInput) {
          var firstImg = IMG_FILES.filter(function(f) { return fs.existsSync(f); })[0];
          if (firstImg) {
            await fileInput.setInputFiles([firstImg]);
            console.log('  이미지 1장 첨부');
            await sleep(3000);
          }
        }

        // 게시
        var posted = await thPage.evaluate(function() {
          var btns = document.querySelectorAll('[role="button"], button');
          for (var i = 0; i < btns.length; i++) {
            var t = (btns[i].innerText || '').trim();
            if ((t === '게시' || t === 'Post') && btns[i].offsetParent !== null) {
              btns[i].click();
              return true;
            }
          }
          return false;
        });
        console.log('  게시:', posted ? '클릭!' : '못찾음');
        await sleep(3000);
        console.log('  Threads 완료!');
      }
    } catch(e) {
      console.log('  오류:', e.message.split('\n')[0].substring(0, 60));
    }
  }

  console.log('\n모든 포스팅 완료!');
  await b.close();
})();

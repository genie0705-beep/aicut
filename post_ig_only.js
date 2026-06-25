const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var IMG_DIR = [
  DIR + '/aicut_blog_worker.png',
  DIR + '/aicut_body_worker_cycle.png',
  DIR + '/aicut_body_worker_cost.png',
  DIR + '/aicut_body_worker_after.png'
];

var CAPTION_TEXT = '영상편집 때문에 새벽 3시까지 붙잡고 있던 직장인의 썰 \n\n"퇴근하고, 아이 재우고, 밤 11시 노트북 앞에 앉는 삶"\n"자막 넣다가 새벽 2시, 효과 넣다가 새벽 3시"\n\n3개월 삽질 끝에 깨달았습니다.\n시간당 3만원인 내 시간으로 5시간 편집하는 게 오히려 손해라는 걸 \n\n에이컷에 맡긴 후 달라진 점:\n- 밤 11시에 잔다 \n- 퀄리티 업\n- 와이프 표정 좋아짐 \n\n직장인은 편집할 시간에 기획해야 합니다.\n\naicut.co.kr\n\n#영상편집외주 #직장인에세이 #영상편집대행 #숏폼제작 #밤샘편집 #직장인일상 #영상편집 #에이컷 #AICUT';

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  
  // === Instagram ===
  var igPage = pages[0];
  await igPage.bringToFront();
  await sleep(2000);
  
  console.log('1. 새 게시물 버튼...');
  var r1 = await igPage.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var t = svgs[i].querySelector('title');
      if (t && (t.textContent.indexOf('새로운 게시물') >= 0 || t.textContent.indexOf('New post') >= 0)) {
        var btn = svgs[i].closest('div, button, a');
        if (btn) { btn.click(); return true; }
      }
    }
    return false;
  });
  console.log('   ', r1);
  await sleep(2000);
  
  console.log('2. 게시물 옵션...');
  var r2 = await igPage.evaluate(function() {
    var items = document.querySelectorAll('button, div[role=button], a, span');
    for (var i = 0; i < items.length; i++) {
      var t = (items[i].innerText || '').trim();
      if (t === '게시물' || t === 'Post') { items[i].click(); return true; }
    }
    return false;
  });
  console.log('   ', r2);
  await sleep(1500);
  
  console.log('3. 파일 업로드...');
  // multiple 속성 추가
  await igPage.evaluate(function() {
    var inp = document.querySelector('input[type=file]');
    if (inp) inp.setAttribute('multiple', 'true');
  });
  await sleep(300);
  
  var fi = await igPage.$('input[type=file]');
  if (fi) {
    var valid = IMG_DIR.filter(function(f) { return fs.existsSync(f); });
    console.log('   이미지 ' + valid.length + '개');
    await fi.setInputFiles(valid);
    console.log('   업로드 완료!');
    await sleep(3000);
    
    // 다음 버튼 3번
    for (var s = 0; s < 3; s++) {
      var nxt = await igPage.evaluate(function() {
        var btns = document.querySelectorAll('button, div[role=button]');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          if ((t === '다음' || t === 'Next') && !btns[i].disabled) {
            btns[i].click(); return true;
          }
        }
        return false;
      });
      if (nxt) { console.log('   다음 ' + (s+1)); await sleep(2500); }
      else break;
    }
    
    console.log('4. 캡션 입력...');
    var cap = await igPage.$('textarea, [contenteditable=true]');
    if (cap) {
      await cap.click({ force: true });
      await sleep(500);
      await igPage.keyboard.type(CAPTION_TEXT, { delay: 8 });
      console.log('   입력 완료');
    }
    await sleep(1000);
    
    console.log('5. 공유하기...');
    var shr = await igPage.evaluate(function() {
      var btns = document.querySelectorAll('button, div[role=button]');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '공유하기' || t === 'Share') && !btns[i].disabled) {
          btns[i].click(); return true;
        }
      }
      return false;
    });
    console.log('   ', shr ? '클릭완료!' : '못찾음');
    await sleep(6000);
    console.log('Instagram 성공!');
  } else {
    console.log('파일 input 없음');
  }
  
  await b.close();
})();

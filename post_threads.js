const { chromium } = require('playwright');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var THREADS_TEXT = '영상편집 때문에 새벽 3시까지 붙잡고 있던 직장인의 썰\n\n"퇴근하고 아이 재우고 밤 11시에 편집 시작해서 새벽 3시..."\n3개월 삽질 끝에 깨달았어요.\n내 시간이 더 귀하다는 것을.\n\n에이컷에 맡기고 나니 밤 11시에 잡니다.\n퀄리티는 올라가고 비용은 더 아껴지고\n\n직장인은 편집할 시간에 기획을 해야죠.\naicut.co.kr\n\n#영상편집외주 #직장인 #숏폼제작 #에이컷 #밤샘편집';

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  
  var thPage = pages[1];
  await thPage.bringToFront();
  await sleep(2000);
  
  console.log('Threads 포스팅 시작...');
  
  // "새로운 소식이 있나요?" 클릭
  var clicked = await thPage.evaluate(function() {
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var t = (all[i].innerText || '').trim();
      if (t.indexOf('새로운 소식') >= 0) {
        all[i].click();
        return true;
      }
    }
    return false;
  });
  console.log('입력창 클릭:', clicked);
  await sleep(2000);
  
  // contenteditable이 나타날 때까지 기다리기
  var ce = null;
  for (var retry = 0; retry < 10; retry++) {
    ce = await thPage.$('[contenteditable], [role=textbox], textarea');
    if (ce) break;
    await sleep(1000);
  }
  
  if (ce) {
    console.log('contenteditable 발견!');
    await ce.click({ force: true });
    await sleep(500);
    await thPage.keyboard.type(THREADS_TEXT, { delay: 8 });
    console.log('텍스트 입력 완료');
    await sleep(1000);
    
    // 이미지 파일 input 찾기
    var fi = await thPage.$('input[type=file]');
    if (fi) {
      var imgPath = 'C:/Users/paul/.openclaw/workspace/aicut_blog_worker.png';
      var fs = require('fs');
      if (fs.existsSync(imgPath)) {
        await fi.setInputFiles([imgPath]);
        console.log('이미지 첨부 완료');
        await sleep(3000);
      }
    }
    
    // 게시 버튼
    var posted = await thPage.evaluate(function() {
      var btns = document.querySelectorAll('[role=button], button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '게시' || t === 'Post') && btns[i].offsetParent !== null && !btns[i].disabled) {
          btns[i].click();
          return true;
        }
      }
      return false;
    });
    console.log('게시:', posted ? '클릭!' : '못찾음');
    await sleep(4000);
    console.log('Threads 완료!');
  } else {
    console.log('contenteditable 못찾음. 페이지 구조 확인 필요');
  }
  
  await b.close();
})();

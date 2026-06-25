const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var FILES = [
  DIR+'/aicut_card_reels_01.png',
  DIR+'/aicut_card_reels_02.png',
  DIR+'/aicut_card_reels_03.png',
  DIR+'/aicut_card_reels_04.png'
];

var CAPTION = [
  '[ 영상빡침일기 #3 ]',
  '',
  '"릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유"',
  '',
  '직접 겪은 이야기입니다.',
  '3일 편집한 릴스 = 조회수 200',
  '3시간 만든 릴스 = 조회수 23,000',
  '차이가 100배가 났어요.',
  '',
  '알고리즘의 핵심: "처음 3초 안에 시청자를 멈추게 하라"',
  '',
  '화려한 편집보다 중요한 건 메시지와 트렌드입니다.',
  '편집은 에이컷, 메시지 기획은 당신에게!',
  '',
  'aicut.co.kr',
  '',
  '#릴스마케팅 #숏폼마케팅 #릴스조회수 #인스타릴스 #숏폼제작 #릴스편집 #릴스 #인스타마케팅 #영상편집 #릴스노하우 #숏폼영상 #릴스광고 #인스타그램마케팅 #콘텐츠마케팅 #마케팅 #영상편집외주 #영상편집대행 #릴스제작 #쇼츠 #틱톡 #릴스추천 #인스타 #에이컷 #aicuts #숏폼콘텐츠 #영상제작 #소셜미디어마케팅 #디지털마케팅 #숏폼에디터 #릴스전문'
].join('\n');

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var pages = b.contexts()[0].pages();
  var igPage = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com') >= 0) { igPage = pages[i]; break; }
  }
  if (!igPage) { console.log('no page'); await b.close(); return; }
  await igPage.bringToFront();
  await sleep(2000);
  
  // 새 게시물 만들기
  await igPage.evaluate(function() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var t = svgs[i].querySelector('title');
      if (t && (t.textContent.indexOf('새로운 게시물') >= 0 || t.textContent.indexOf('New post') >= 0)) {
        var btn = svgs[i].closest('[role=button], button, a, div');
        if (btn) { btn.click(); return; }
      }
    }
  });
  await sleep(2000);
  
  await igPage.evaluate(function() {
    var items = document.querySelectorAll('button, [role=button], a, span');
    for (var i = 0; i < items.length; i++) {
      var t = (items[i].innerText || '').trim();
      if (t === '게시물' || t === 'Post') { items[i].click(); return; }
    }
  });
  await sleep(1500);
  
  // 파일 input 재정의: multiple 속성 확실히 설정
  console.log('파일 input 재설정...');
  await igPage.evaluate(function() {
    var oldInput = document.querySelector('input[type=file]');
    if (!oldInput) return;
    // Create new input with multiple
    var newInput = document.createElement('input');
    newInput.type = 'file';
    newInput.multiple = true;
    newInput.setAttribute('multiple', 'multiple');
    newInput.style.cssText = 'position:absolute!important;opacity:0;pointer-events:none;';
    newInput.id = 'aicut-file-input';
    oldInput.parentNode.insertBefore(newInput, oldInput);
    oldInput.remove();
  });
  await sleep(500);
  
  var fi = await igPage.$('input#aicut-file-input');
  if (!fi) {
    // Fallback: original input
    fi = await igPage.$('input[type=file]');
  }
  
  if (fi) {
    var valid = FILES.filter(function(f) { return fs.existsSync(f); });
    console.log(valid.length + '개 파일 업로드 시도');
    
    await fi.setInputFiles(valid);
    console.log('setInputFiles 완료');
    await sleep(3000);
    
    // 다음 버튼
    for (var s = 0; s < 3; s++) {
      var nxt = await igPage.evaluate(function() {
        var btns = document.querySelectorAll('button, [role=button]');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          if ((t === '다음' || t === 'Next') && !btns[i].disabled) {
            btns[i].click(); return true;
          }
        }
        return false;
      });
      if (nxt) { console.log('다음 '+(s+1)); await sleep(2500); }
      else break;
    }
    
    // 캡션
    var cap = await igPage.$('textarea, [contenteditable=true], [aria-label*=캡션]');
    if (cap) {
      await cap.click({ force: true });
      await sleep(500);
      await igPage.keyboard.type(CAPTION, { delay: 5 });
      console.log('캡션 완료');
    }
    await sleep(1000);
    
    // 공유
    var shr = await igPage.evaluate(function() {
      var btns = document.querySelectorAll('button, [role=button]');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '공유하기' || t === 'Share') && !btns[i].disabled) {
          btns[i].click(); return true;
        }
      }
      return false;
    });
    console.log(shr ? '공유완료!' : '못찾음');
    await sleep(6000);
  }
  
  console.log('\n완료!');
  process.exit(0);
})();

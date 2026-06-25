const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var CARD_FILES = [
  DIR + '/aicut_card_kids_01.png',
  DIR + '/aicut_card_kids_02.png',
  DIR + '/aicut_card_kids_03.png',
  DIR + '/aicut_card_kids_04.png'
];

var CAPTION = [
  '[ 영상빡침일기 #2 ]',
  '',
  '"아이 영상 500개 찍어놓고 USB만 쌓아둔 부모님들 특징"',
  '',
  '1. 폰 갤러리에 아이 영상만 100기가',
  '2. 편집하려고 마음먹은 지 3년째',
  '3. 결국 USB에 쌓아두고 \"나중에\" 반복',
  '4. 새벽까지 편집하다 포기',
  '',
  '부모의 역할은 찍는 거지 편집이 아니에요.',
  '에이컷에 맡기면:',
  ' 찍기만 하면 됨  48시간 내 납품',
  ' AI+전담에디터  폰으로 바로 감상',
  '',
  'USB에 묻힌 아이의 성장 기록,' ,
  '지금 꺼내주세요 .',
  '',
  'aicut.co.kr',
  '',
  '#아이영상편집 #아이성장영상 #가족영상 #추억보관 #아이영상 #영상편집외주 #영상편집대행 #아이키우는맘 #아이키우는아빠 #육아일기 #성장영상 #첫걸음마 #생일영상 #가족추억 #영상편집 #USB속영상 #에이컷 #aicuts #영상편집업체 #영상제작외주 #숏폼영상 #아이성장기록 #편집대행 #영상에디터 #부모일상 #갤러리정리 #영상편집추천 #아이영상제작'
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
  
  console.log('1. 새 게시물...');
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
  
  console.log('2. 게시물 옵션...');
  await igPage.evaluate(function() {
    var items = document.querySelectorAll('button, [role=button], a, span');
    for (var i = 0; i < items.length; i++) {
      var t = (items[i].innerText || '').trim();
      if (t === '게시물' || t === 'Post') { items[i].click(); return; }
    }
  });
  await sleep(1500);
  
  console.log('3. 카드뉴스 4장 업로드...');
  var fi = await igPage.$('input[type=file]');
  if (fi) {
    var valid = CARD_FILES.filter(function(f) { return fs.existsSync(f); });
    console.log('   ' + valid.length + '개');
    
    await igPage.evaluate(function() {
      var inp = document.querySelector('input[type=file]');
      if (inp) inp.setAttribute('multiple', 'true');
    });
    await sleep(300);
    
    await fi.setInputFiles(valid);
    console.log('   업로드 완료!');
    await sleep(3000);
    
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
      if (nxt) { console.log('   다음 ' + (s+1)); await sleep(2500); }
      else break;
    }
    
    console.log('4. 캡션 입력...');
    var cap = await igPage.$('textarea, [contenteditable=true], [aria-label*=캡션], [aria-label*=Caption]');
    if (cap) {
      await cap.click({ force: true });
      await sleep(500);
      await igPage.keyboard.type(CAPTION, { delay: 5 });
      console.log('   완료');
    }
    await sleep(1000);
    
    console.log('5. 공유하기...');
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
    console.log('   ' + (shr ? '공완료!' : '못찾음'));
    await sleep(6000);
    console.log('   인스타 카드뉴스 업로드 완료!');
  }
  
  console.log('\n끝!');
  process.exit(0);
})();

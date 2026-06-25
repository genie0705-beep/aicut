const { chromium } = require('playwright');
const fs = require('fs');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

var IMG_FILES = [
  DIR + '/aicut_blog_kids.png',
  DIR + '/aicut_body_kids_phone.png',
  DIR + '/aicut_body_kids_time.png',
  DIR + '/aicut_body_kids_solve.png'
];

var CAPTION = [
  '아이 영상 500개 찍어놓고 USB만 쌓아둔 부모님들의 현실 ',
  '',
  '"6개월 50장, 12개월 200장, 36개월 1,000장..."',
  '동영상만 500개에 용량 100기가, 편집 엄두가 안 나서 USB에만 쌓아두고 있지 않나요? ',
  '',
  '사실 부모 역할은 찍는 거지 편집이 아니에요. ',
  '편집은 프로에게, 감상은 가족이 함께!',
  '',
  '에이컷에 맡기니 달라진 점:',
  '- 찍기만 하면 됨 (원본만 전송)',
  '- 48시간 내 납품',
  '- AI + 전담 에디터 퀄리티',
  '- USB 아닌 폰으로 바로 감상 ',
  '',
  '아이의 첫 걸음마, 첫 생일파티,',
  'USB에 묻히기엔 너무 소중한 순간들이에요. ',
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
  
  if (!igPage) { console.log('no insta page'); await b.close(); return; }
  await igPage.bringToFront();
  await sleep(2000);
  
  console.log('1. New post button...');
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
  
  console.log('2. Post option...');
  await igPage.evaluate(function() {
    var items = document.querySelectorAll('button, [role=button], a, span');
    for (var i = 0; i < items.length; i++) {
      var t = (items[i].innerText || '').trim();
      if (t === '게시물' || t === 'Post') { items[i].click(); return; }
    }
  });
  await sleep(1500);
  
  console.log('3. Upload 4 images...');
  var fi = await igPage.$('input[type=file]');
  if (fi) {
    var valid = IMG_FILES.filter(function(f) { return fs.existsSync(f); });
    console.log('   ' + valid.length + ' files');
    
    // Add multiple attribute
    await igPage.evaluate(function() {
      var inp = document.querySelector('input[type=file]');
      if (inp) inp.setAttribute('multiple', 'true');
    });
    await sleep(300);
    
    await fi.setInputFiles(valid);
    console.log('   uploaded!');
    await sleep(3000);
    
    // Next buttons
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
      if (nxt) { console.log('   next ' + (s+1)); await sleep(2500); }
      else break;
    }
    
    // Caption
    console.log('4. Caption...');
    var cap = await igPage.$('textarea, [contenteditable=true], [aria-label*=캡션], [aria-label*=Caption]');
    if (cap) {
      await cap.click({ force: true });
      await sleep(500);
      await igPage.keyboard.type(CAPTION, { delay: 5 });
      console.log('   done');
    }
    await sleep(1000);
    
    // Share
    console.log('5. Share...');
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
    console.log('   ' + (shr ? 'shared!' : 'not found'));
    await sleep(6000);
    console.log('   Instagram done!');
  }
  
  console.log('\nDone!');
  process.exit(0);
})();

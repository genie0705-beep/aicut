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
  '3일 편집 = 조회수 200',
  '3시간 만든 릴스 = 조회수 23,000',
  '차이가 100배!',
  '',
  '알고리즘 핵심: "처음 3초 안에 시청자를 멈추게 하라"',
  '',
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
  
  // Open new post
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
  await sleep(2000);
  
  // METHOD 1: Drag & Drop - drop 4 files onto the drop zone
  console.log('Drag & Drop 시도...');
  var validFiles = FILES.filter(function(f) { return fs.existsSync(f); });
  
  // Read all files as base64 to pass to browser context
  var fileData = [];
  for (var i = 0; i < validFiles.length; i++) {
    var buf = fs.readFileSync(validFiles[i]);
    fileData.push({
      name: 'reels_card_' + (i+1) + '.png',
      type: 'image/png',
      base64: buf.toString('base64')
    });
  }
  console.log(fileData.length + '개 파일 준비');
  
  // Drop files onto the drop zone via DataTransfer
  var dropResult = await igPage.evaluate(function(files) {
    // Find drop zone
    var allDivs = document.querySelectorAll('div');
    var dropZone = null;
    for (var i = 0; i < allDivs.length; i++) {
      var t = (allDivs[i].innerText || '').trim();
      if (t.indexOf('끌어다 놓으세요') >= 0 && allDivs[i].offsetParent !== null) {
        var rect = allDivs[i].getBoundingClientRect();
        if (rect.width > 200 && rect.height > 200) {
          dropZone = allDivs[i];
          break;
        }
      }
    }
    
    if (!dropZone) return 'no drop zone';
    
    // Create File objects from base64
    var dt = new DataTransfer();
    for (var i = 0; i < files.length; i++) {
      var byteChars = atob(files[i].base64);
      var byteArrays = [];
      for (var offset = 0; offset < byteChars.length; offset += 512) {
        var slice = byteChars.slice(offset, offset + 512);
        var byteNumbers = new Array(slice.length);
        for (var j = 0; j < slice.length; j++) {
          byteNumbers[j] = slice.charCodeAt(j);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      var blob = new Blob(byteArrays, { type: files[i].type });
      var file = new File([blob], files[i].name, { type: files[i].type });
      dt.items.add(file);
    }
    
    // Dispatch dragenter
    var enterEvent = new DragEvent('dragenter', { dataTransfer: dt, bubbles: true, cancelable: true });
    dropZone.dispatchEvent(enterEvent);
    
    // Dispatch dragover
    var overEvent = new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true });
    dropZone.dispatchEvent(overEvent);
    
    // Dispatch drop
    var dropEvent = new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true });
    dropZone.dispatchEvent(dropEvent);
    
    return 'dropped ' + dt.files.length + ' files';
  }, fileData);
  
  console.log('Drop result:', dropResult);
  await sleep(3000);
  
  // Check if files were accepted (look for "다음" or crop UI)
  var check = await igPage.evaluate(function() {
    var btns = document.querySelectorAll('button, [role=button]');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].innerText || '').trim();
      if (t === '다음' || t === 'Next') { return 'next_found'; }
    }
    return 'no_next';
  });
  console.log('Upload check:', check);
  
  if (check === 'next_found') {
    // Next through crop/filter
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
      if (nxt) { console.log('Next '+(s+1)); await sleep(2500); }
      else break;
    }
    
    // Caption
    var cap = await igPage.$('textarea, [contenteditable=true], [aria-label*=캡션]');
    if (cap) {
      await cap.click({ force: true });
      await sleep(500);
      await igPage.keyboard.type(CAPTION, { delay: 5 });
      console.log('Caption done');
    }
    await sleep(1000);
    
    // Share
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
    console.log('Share:', shr);
    await sleep(6000);
  }
  
  console.log('\nDone!');
  process.exit(0);
})();

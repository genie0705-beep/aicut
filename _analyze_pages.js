// Threads + 인스타 페이지 분석
const { chromium } = require('playwright');
function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();

  // ============================================================
  // Threads 분석
  // ============================================================
  console.log('===== Threads 페이지 분석 =====\n');

  var tp = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('threads.com') >= 0) { tp = pages[i]; break; }
  }

  if (tp) {
    await tp.bringToFront();
    await tp.goto('https://www.threads.com/@aicut.official', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
    await sleep(4000);
    
    var analysis = await tp.evaluate(function() {
      var r = {};
      r.url = window.location.href;
      r.title = document.title;
      
      // 로그인 상태 확인
      r.bodyText = (document.body.innerText || '').substring(0, 500);
      
      // 에디터/입력창 상태
      r.contentEditable = document.querySelectorAll('[contenteditable]').length;
      r.textareas = document.querySelectorAll('textarea').length;
      r.textbox = document.querySelectorAll('[role="textbox"]').length;
      
      // visible editable elements
      r.visibleEditables = [];
      document.querySelectorAll('*').forEach(function(el) {
        if (el.offsetParent !== null) {
          var isEd = el.getAttribute('contenteditable') === 'true' || el.getAttribute('role') === 'textbox';
          if (isEd || el.tagName === 'TEXTAREA') {
            r.visibleEditables.push({
              tag: el.tagName, id: el.id || '', cls: (el.className || '').substring(0, 50),
              placeholder: (el.getAttribute('placeholder') || '')
            });
          }
        }
      });
      
      // 게시 버튼 분석
      r.postButtons = [];
      document.querySelectorAll('*').forEach(function(el) {
        if (el.offsetParent !== null) {
          var t = (el.innerText || '').trim();
          if (t === '게시' || t === 'Post') {
            r.postButtons.push({ tag: el.tagName, role: el.getAttribute('role'), cls: (el.className||'').substring(0,60), rect: JSON.stringify(el.getBoundingClientRect()), html: el.outerHTML.substring(0, 100) });
          }
        }
      });
      
      // '게시' 버튼이 보이는 영역 근처 분석
      r.nearPost = [];
      var allDivs = document.querySelectorAll('div');
      for (var i = 0; i < allDivs.length; i++) {
        var t = (allDivs[i].innerText || '').trim();
        if (t.indexOf('게시') >= 0 && t.length < 200 && allDivs[i].offsetParent !== null) {
          r.nearPost.push({ tag: allDivs[i].tagName, text: t.substring(0, 150), cls: (allDivs[i].className||'').substring(0, 50) });
        }
      }
      
      return r;
    });
    
    console.log('URL:', analysis.url);
    console.log('Title:', analysis.title);
    console.log('\n입력창: contentEditable=' + analysis.contentEditable + ' textarea=' + analysis.textareas + ' textbox=' + analysis.textbox);
    console.log('visibleEditables:', JSON.stringify(analysis.visibleEditables));
    console.log('\n게시 버튼들:', JSON.stringify(analysis.postButtons, null, 2));
    console.log('\n게시 근처 영역:', JSON.stringify(analysis.nearPost, null, 2));
    
    // 스크린샷
    await tp.screenshot({ path: '_threads_state.png', fullPage: false });
    console.log('\n스크린샷 저장됨');
  }

  // ============================================================
  // 인스타그램 분석
  // ============================================================
  console.log('\n\n===== 인스타그램 페이지 분석 =====\n');

  var ip = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('instagram.com') >= 0) { ip = pages[i]; break; }
  }

  if (ip) {
    await ip.bringToFront();
    await ip.goto('https://www.instagram.com/aicut.official/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
    await sleep(4000);
    
    var instaAnalysis = await ip.evaluate(function() {
      var r = {};
      r.url = window.location.href;
      
      // 게시물 링크 수
      r.postLinks = [];
      document.querySelectorAll('a').forEach(function(a) {
        var h = a.href || '';
        if (h.indexOf('/p/') >= 0 && !r.postLinks.find(function(x) { return x.substring(0,55) === h.substring(0,55); })) {
          r.postLinks.push(h.substring(0, 60));
        }
      });
      
      // 게시물 수
      r.articleCount = document.querySelectorAll('article').length;
      
      // 프로필 텍스트
      r.profileText = (document.body.innerText || '').substring(0, 300);
      
      return r;
    });
    
    console.log('URL:', instaAnalysis.url);
    console.log('게시물 링크:', instaAnalysis.postLinks.length + '개');
    for (var pi = 0; pi < instaAnalysis.postLinks.length; pi++) {
      console.log('  ' + (pi+1) + '. ' + instaAnalysis.postLinks[pi]);
    }
    console.log('\n프로필 텍스트:', instaAnalysis.profileText.substring(0, 200));
    
    // 가장 최근 게시물 열기
    if (instaAnalysis.postLinks.length > 0) {
      var latestPost = instaAnalysis.postLinks[0];
      console.log('\n최신 게시물 열기:', latestPost);
      await ip.goto(latestPost, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
      await sleep(3000);
      
      var postInfo = await ip.evaluate(function() {
        var r = {};
        // 캡션
        r.bodyText = (document.body.innerText || '').substring(0, 500);
        
        // 이미지
        r.images = [];
        document.querySelectorAll('img').forEach(function(img) {
          if (img.offsetParent !== null && img.naturalWidth > 10) {
            r.images.push({ src: img.src.substring(0, 70), w: img.naturalWidth, h: img.naturalHeight });
          }
        });
        r.imageCount = r.images.length;
        
        return r;
      });
      
      console.log('게시물 본문:', postInfo.bodyText.substring(0, 300));
      console.log('\n이미지:', postInfo.imageCount + '개');
      for (var ii = 0; ii < Math.min(postInfo.images.length, 5); ii++) {
        console.log('  ' + (ii+1) + '. ' + postInfo.images[ii].src + ' (' + postInfo.images[ii].w + 'x' + postInfo.images[ii].h + ')');
      }
    }
  }

  await b.close();
})();

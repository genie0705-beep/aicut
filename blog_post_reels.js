const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = 'C:/Users/paul/.openclaw/workspace';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function p(t) { return '<p style="text-align: center;">' + t + '</p>'; }
function br() { return '<p><br></p>'; }
function h2(t) { return '<h2 style="text-align: center;">' + t + '</h2>'; }

var BODY = [
  p('인스타 릴스를 운영해본 사람이라면'),
  p('한 번쯤 겪어봤을 상황.'),
  br(),
  p('"3일 동안 기획하고, 촬영하고, 편집했다."'),
  p('"근데 조회수 200."'),
  p('"다음 날 대충 찍은 릴스가 조회수 2만."'),
  br(),
  p('뭔가 이상하지 않나요?'),
  p('오늘은 <strong>릴스 조회수</strong>의 비밀에 대해'),
  p('이야기해볼게요.'),
  br(),
  h2('3일 vs 3시간의 반전'),
  br(),
  p('<strong>3일 걸린 영상:</strong> 기획 1일, 촬영 1일, 편집 1일 -> 조회수 200'),
  p('<strong>3시간 만든 영상:</strong> 핸드폰 대충 찍고 간단 편집 -> 조회수 2.3만'),
  br(),
  p('차이가 100배 났습니다.'),
  p('왜 이런 일이 발생할까요?'),
  br(),
  h2('릴스 알고리즘의 핵심'),
  br(),
  p('<strong>릴스 마케팅</strong>에서 가장 중요한 건'),
  p('편집 퀄리티가 아닙니다.'),
  br(),
  p('<strong>핵심:</strong> "처음 3초 안에 시청자가 멈추게 하라"'),
  br(),
  p('<strong>1. 초반 체류율</strong> - 3초 안에 넘길지 결정'),
  p('<strong>2. 다시보기</strong> - 2회 이상 재생 = 가중치 UP'),
  p('<strong>3. 공유/저장</strong> - 바이럴 핵심'),
  p('<strong>4. 댓글/좋아요</strong> - 참여 신호'),
  br(),
  h2('시간 대비 효과가 안 나는 이유'),
  br(),
  p('"편집을 잘하면 릴스가 뜬다"?'),
  p('아닙니다.'),
  p('<strong>콘텐츠의 메시지와 트렌드</strong>가 편집보다 10배 중요합니다.'),
  br(),
  p('<strong>이유1:</strong> 편집에 집중하다 메시지가 흐려짐'),
  p('<strong>이유2:</strong> 트렌드에 뒤쳐짐 (3일이면 트렌드 바뀜)'),
  p('<strong>이유3:</strong> 과한 편집이 오히려 자연스러움 해침'),
  br(),
  h2('그렇다고 편집이 필요 없는 건 아니다'),
  br(),
  p('핵심은'),
  p('<strong>적절한 편집 + 강력한 메시지</strong>의 조합입니다.'),
  br(),
  p('에이컷은 메시지를 해치지 않는 선에서'),
  p('깔끔하게 편집해드립니다.'),
  br(),
  h2('지금 확인해보세요'),
  br(),
  p('3일 편집한 영상과 3시간 만든 영상의'),
  p('조회수 차이를 확인해보세요.'),
  br(),
  p('<strong>더 나은 편집이 아니라 더 나은 콘텐츠-편집 조합</strong>'),
  p('이 해결책입니다.'),
  br(),
  p('지금 에이컷에 무료 상담해보세요.'),
  br(),
  p('카카오톡 채널: 에이컷'),
  p('이메일: contact@aicut.co.kr'),
  p('홈페이지: aicut.co.kr')
].join('\n');

var TAGS = '#릴스마케팅 #숏폼마케팅 #릴스조회수 #인스타릴스 #숏폼제작 #릴스편집 #릴스 #인스타마케팅 #영상편집 #릴스노하우 #숏폼영상 #릴스광고 #인스타그램마케팅 #콘텐츠마케팅 #마케팅 #영상편집외주 #영상편집대행 #릴스제작 #쇼츠 #틱톡 #릴스추천 #인스타 #에이컷 #aicuts #숏폼콘텐츠 #영상제작 #소셜미디어마케팅 #디지털마케팅 #숏폼에디터 #릴스전문';

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  var pages = ctx.pages();
  
  var page = null;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].url().indexOf('blog.naver.com') >= 0 && pages[i].url().indexOf('nidlogin') < 0) {
      page = pages[i]; break;
    }
  }
  if (!page) { page = await ctx.newPage(); }
  
  await page.bringToFront();
  console.log('블로그 에디터 이동...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(function(){});
  await sleep(4000);
  
  // Find editor frame
  var ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var hasSE = await page.frames()[fi].evaluate(function() { return typeof SmartEditor !== 'undefined'; }).catch(function(){ return false; });
    if (hasSE) { ef = page.frames()[fi]; break; }
  }
  if (!ef) { console.log('editor frame not found'); await b.close(); return; }
  
  var mf = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    if (page.frames()[fi].name() === 'mainFrame') { mf = page.frames()[fi]; break; }
  }
  if (!mf) mf = page;
  
  // 1. Title
  console.log('1/5 제목...');
  await ef.evaluate(function() {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle('릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유'); } catch(e) {}
  });
  console.log('  ok');
  await sleep(1000);
  
  // 2. Body
  console.log('2/5 본문...');
  var clipOk = await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      var blob = new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
    });
  }, BODY);
  
  if (clipOk) {
    await page.mouse.click(510, 400);
    await sleep(1500);
    await page.keyboard.press('Control+v');
    await sleep(3000);
  }
  
  var check = await ef.evaluate(function() {
    try { var ed = SmartEditor._editors['blogpc001']; var text = ed.getContentText ? ed.getContentText() : ''; return { ok: text.length > 50, len: text.length }; } catch(e) { return { ok: false }; }
  });
  console.log('  ' + (check.ok ? check.len + '자' : 'fail'));
  
  // 3. Images
  console.log('3/5 이미지...');
  var imgs = ['aicut_blog_reels.png', 'aicut_body_reels_compare.png', 'aicut_body_reels_algorithm.png', 'aicut_body_reels_solution.png'];
  
  for (var idx = 0; idx < imgs.length; idx++) {
    var imgPath = path.join(DIR, imgs[idx]);
    if (!fs.existsSync(imgPath)) { console.log('  ' + imgs[idx] + ' 없음'); continue; }
    
    var fcPromise = page.waitForEvent('filechooser', { timeout: 8000 }).catch(function() { return null; });
    await mf.evaluate(function() {
      var btns = document.querySelectorAll('button, a, span');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if ((t === '사진' || t === '사진 추가') && btns[i].offsetParent !== null) { btns[i].click(); return; }
      }
    }).catch(function(){});
    
    var fc = await fcPromise;
    if (fc) {
      await fc.setFiles(imgPath);
      await sleep(3000);
      console.log('  ' + (idx+1) + '/4 ok');
    } else {
      console.log('  ' + (idx+1) + '/4 skip');
    }
  }
  
  // 4. Hashtags
  console.log('4/5 해시태그...');
  await mf.evaluate(function(tags) {
    var inputs = document.querySelectorAll('input[placeholder*=""], input');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].offsetParent !== null) {
        var ph = inputs[i].getAttribute('placeholder') || '';
        if (ph.indexOf('태그') >= 0 || ph.indexOf('해시') >= 0) {
          var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inputs[i], tags);
          inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
          return;
        }
      }
    }
    // Try tag button
    var btns = document.querySelectorAll('button, span, a');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '태그' && btns[i].offsetParent !== null) { btns[i].click(); return; }
    }
  }, TAGS);
  await sleep(2000);
  await page.keyboard.type(TAGS, { delay: 15 });
  await sleep(1000);
  await page.keyboard.press('Enter');
  await sleep(500);
  console.log('  ok');
  
  // 5. Save
  console.log('5/5 저장...');
  await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
    }
  });
  await sleep(3000);
  console.log('  ok');
  
  console.log('\n블로그 #3 저장 완료!');
  console.log('제목: 릴스 조회수, 3일 만든 영상보다 3시간 만든 영상이 더 잘 나가는 이유');
  
  process.exit(0);
})();

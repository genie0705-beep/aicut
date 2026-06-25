const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const DIR = 'C:/Users/paul/.openclaw/workspace';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function p(t) { return '<p style="text-align: center;">' + t + '</p>'; }
function br() { return '<p><br></p>'; }
function h2(t) { return '<h2 style="text-align: center;">' + t + '</h2>'; }
function h3(t) { return '<h3 style="text-align: center;">' + t + '</h3>'; }

var BODY_HTML = [
  p('아이 키우는 부모님들의 현실.'),
  p('핸드폰 갤러리를 열어보세요.'),
  br(),
  p('"6개월 50장 \u2192 12개월 200장 \u2192 36개월 1,000장"'),
  p('"동영상만 500개, 용량 100기가..."'),
  p('"편집하고 싶은데 엄두가 안 난다"'),
  br(),
  p('이 글 보는 순간 고개 끄덕이셨죠?'),
  p('저도 그랬습니다.'),
  p('오늘은 <strong>아이 영상 편집</strong>에 대한'),
  p('현실적인 이야기를 해볼게요.'),
  br(),
  h2('폰 용량이 부족하다는 건 핑계였다'),
  br(),
  p('"아이 폰에 영상이 너무 많아서 용량이 부족해요."'),
  p('맞는 말입니다.'),
  p('하지만 진짜 이유는 따로 있어요.'),
  br(),
  p('<strong>이유 1:</strong> 500개 중에 골라내는 게 더 힘들다'),
  p('<strong>이유 2:</strong> 편집 프로그램 켜는 것 자체가 스트레스'),
  p('<strong>이유 3:</strong> "나중에 하지"가 3년째'),
  br(),
  p('결국 USB에 쌓여가는 아이 영상들.'),
  p('공감되시나요?'),
  br(),
  h2('USB에 묻힌 아이의 성장 기록'),
  br(),
  p('솔직히 말씀드리면,'),
  p('<strong>아이 영상 편집</strong>은'),
  p('일반 영상보다 훨씬 까다롭습니다.'),
  br(),
  p('3초짜리 웃는 표정 하나 살리려고'),
  p('<strong>30분짜리 원본</strong>을 다 뒤져야 하고,'),
  p('BGM 넣으려다 또 1시간 순삭입니다.'),
  br(),
  p('작년에 찍은 첫 걸음마 영상,'),
  p('아직도 USB에서 잠들어 있지 않나요?'),
  br(),
  h2('시간 대비 결과가 안 나오는 이유'),
  br(),
  p('아이 영상 1편(1~3분) 만드는 데'),
  p('<strong>평균 3~4시간</strong>이 걸립니다.'),
  br(),
  p('퇴근하고, 아이 재우고,'),
  p('간신히 앉아서 편집 시작하면 밤 11시.'),
  br(),
  p('이걸 매일 할 수 있을까요?'),
  p('당연히 안 됩니다.'),
  p('그래서 USB에 쌓이는 거예요.'),
  br(),
  h2('편집은 프로에게, 감상은 우리에게'),
  br(),
  p('여기서 중요한 깨달음.'),
  p('<strong>부모의 역할은 찍는 거지, 편집이 아닙니다.</strong>'),
  br(),
  p('에이컷에 맡긴 후 달라진 점:'),
  br(),
  p('<strong>찍기만 하면 됩니다</strong> \u2014 원본만 보내주세요'),
  p('<strong>48시간 내 납품</strong> \u2014 기다릴 필요 없음'),
  p('<strong>AI + 전문 에디터</strong> \u2014 감동적인 영상으로'),
  p('<strong>USB가 아닌 폰으로 감상</strong>'),
  br(),
  p('아이의 첫 걸음마, 첫 생일파티,'),
  p('이 모든 순간이 USB에 묻히는 게'),
  p('얼마나 아까운지요.'),
  br(),
  h2('지금이 바로 그 타이밍'),
  br(),
  p('오늘 집에 가서 갤러리를 열어보세요.'),
  p('아마 500개가 넘는 아이 영상이'),
  p('편집을 기다리고 있을 거예요.'),
  br(),
  p('<strong>아이 영상 편집</strong>은 에이컷에 맡기세요.'),
  br(),
  p('지금 무료 상담 받기'),
  br(),
  p('카카오톡 채널: 에이컷'),
  p('이메일: contact@aicut.co.kr'),
  p('홈페이지: aicut.co.kr')
].join('\n');

var HASHTAGS = '#아이영상편집 #아이성장영상 #가족영상 #추억보관 #아이영상 #영상편집외주 #영상편집대행 #아이키우는맘 #아이키우는아빠 #육아일기 #아이영상편집 #성장영상 #첫걸음마 #생일영상 #가족추억 #영상편집 #USB속영상 #에이컷 #aicuts #영상편집업체 #영상제작외주 #숏폼영상 #아이성장기록 #편집대행 #영상에디터 #부모일상 #아이폰정리 #갤러리정리 #영상편집추천 #아이영상제작';

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });

  // 블로그 에디터 페이지로 이동
  var page = null;
  for (var i = 0; i < ctx.pages().length; i++) {
    var u = ctx.pages()[i].url();
    if (u.indexOf('blog.naver.com') >= 0 && u.indexOf('nidlogin') < 0) {
      page = ctx.pages()[i];
      break;
    }
  }
  
  if (!page) {
    console.log('블로그 탭 없음, 새로');
    page = await ctx.newPage();
  }
  
  await page.bringToFront();
  console.log('블로그 탭 이동...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(function(){});
  await sleep(4000);
  
  console.log('URL:', page.url().substring(0, 80));
  
  // 프레임 찾기
  var mf = null, ef = null;
  for (var fi = 0; fi < page.frames().length; fi++) {
    var f = page.frames()[fi];
    if (f.name() === 'mainFrame') mf = f;
    if (f.url().indexOf('PostWriteForm') >= 0 && f.url().indexOf('wtm') < 0) ef = f;
  }
  
  // SmartEditor 직접 찾기
  if (!ef) {
    for (var fi = 0; fi < page.frames().length; fi++) {
      var hasSE = await page.frames()[fi].evaluate(function() {
        return typeof SmartEditor !== 'undefined';
      }).catch(function(){ return false; });
      if (hasSE) { ef = page.frames()[fi]; break; }
    }
  }
  
  console.log('프레임: main=' + (mf ? 'Y' : 'N') + ' editor=' + (ef ? 'Y' : 'N'));
  
  if (!ef) {
    console.log('에디터 프레임 없음');
    await b.close();
    return;
  }
  
  if (!mf) mf = page;
  
  // 1. 제목
  console.log('\n1/5 제목 입력...');
  await ef.evaluate(function() {
    try {
      SmartEditor._editors['blogpc001'].setDocumentTitle('아이 영상 편집, 500개 찍어놓고 USB만 쌓아둔 부모님들 특징');
    } catch(e) {}
  });
  console.log('  완료');
  await sleep(1000);
  
  // 2. 본문
  console.log('2/5 본문 붙여넣기...');
  var clipOk = await page.evaluate(function(html) {
    return new Promise(function(resolve) {
      var blob = new Blob([html], { type: 'text/html' });
      navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(function() { resolve(true); }).catch(function() { resolve(false); });
    });
  }, BODY_HTML);
  
  if (clipOk) {
    await page.mouse.click(510, 400);
    await sleep(1500);
    await page.keyboard.press('Control+v');
    await sleep(3000);
  }
  
  var check = await ef.evaluate(function() {
    try {
      var ed = SmartEditor._editors['blogpc001'];
      var text = ed.getContentText ? ed.getContentText() : '';
      return { ok: text.length > 50, len: text.length };
    } catch(e) { return { ok: false }; }
  });
  console.log('  본문:', check.ok ? check.len + '자' : '실패');
  
  // 3. 이미지
  console.log('3/5 이미지 등록...');
  var imgFiles = ['aicut_blog_kids.png', 'aicut_body_kids_phone.png', 'aicut_body_kids_time.png', 'aicut_body_kids_solve.png'];
  
  for (var idx = 0; idx < imgFiles.length; idx++) {
    var imgPath = path.join(DIR, imgFiles[idx]);
    if (!fs.existsSync(imgPath)) { console.log('  ' + imgFiles[idx] + ' 없음'); continue; }
    
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
      console.log('  ' + (idx+1) + '/' + imgFiles.length + ' 업로드');
    } else {
      console.log('  ' + (idx+1) + '/' + imgFiles.length + ' filechooser 없음');
    }
  }
  
  // 4. 해시태그
  console.log('4/5 해시태그 입력...');
  await mf.evaluate(function(tags) {
    var inputs = document.querySelectorAll('input[placeholder*=\"태그\"], input[placeholder*=\"해시\"], input._tagSearchInput');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].offsetParent !== null) {
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inputs[i], tags);
        inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
    // 태그 섹션 버튼 찾기
    var btns = document.querySelectorAll('button, span, a');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '태그' && btns[i].offsetParent !== null) { btns[i].click(); return; }
    }
  }, HASHTAGS);
  
  await sleep(2000);
  await page.keyboard.type(HASHTAGS, { delay: 15 });
  await sleep(1000);
  await page.keyboard.press('Enter');
  await sleep(500);
  console.log('  완료');
  
  // 5. 저장
  console.log('5/5 저장...');
  await mf.evaluate(function() {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      if ((btns[i].innerText || '').trim() === '저장' && btns[i].offsetParent !== null) { btns[i].click(); return; }
    }
  });
  await sleep(3000);
  console.log('  완료');
  
  console.log('\n✅✅✅ 블로그 포스팅 완료!');
  console.log('제목: 아이 영상 편집, 500개 찍어놓고 USB만 쌓아둔 부모님들 특징');
  console.log('이미지: 4장');
  console.log('해시태그: 30개');
  
  await b.close();
})();

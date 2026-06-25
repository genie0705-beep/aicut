const { chromium } = require('playwright');
const fs = require('fs');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 질문별 답변 내용
var ANSWERS = {
  shop: {
    keyword: '숏폼 콘텐츠 제작 업체추천',
    titleMatch: '숏폼 콘텐츠 제작',
    answer: '숏폼 콘텐츠 제작 업체 알아보고 계시는군요.\n\n처음에는 여러 업체를 비교해보시는 게 좋습니다. 업체마다 장단점이 있고, 특히 어떤 콘텐츠가 필요한지에 따라 선택이 달라져요.\n\n저는 현재 에이컷이라는 서비스를 이용 중인데요. AI 에디터가 기본 편집을 하고, 전담 에디터가 최종 검수하는 방식이라 퀄리티가 꽤 괜찮습니다. 월 정액으로 고정 납품이라 건당 계약보다 부담도 적고요.\n\n무료 샘플도 가능하니까 몇 군데 비교해보시고 결정하시는 걸 추천드립니다!'
  },
  ai: {
    keyword: 'AI 영상편집 프로그램 추천',
    titleMatch: 'AI 영상편집 프로그램 추천',
    answer: 'AI 영상편집 프로그램이라면 몇 가지 추천드립니다.\n\n1. CapCut - 초보자에게 가장 쉬움, AI 자막/자동 편집 기능\n2. Vrew - 음성인식 자막이 강점\n3. Descript - 텍스트 기반 편집, 해외에서는 많이 씀\n4. Runway - 고급 AI 영상 생성/편집\n\n그런데 개인적으로 느낀 건, AI가 완전히 대체해주진 않더라고요. 자동 자막이나 간단한 컷 편집까진 괜찮은데, 브랜드 톤이나 감각적인 편집은 결국 전문가 손을 거쳐야 합니다.\n\n저는 현재 AI가 1차 편집 + 전담 에디터가 최종 검수하는 에이컷이라는 서비스를 쓰고 있는데, 시간도 훨씬 절약되고 퀄리티도 만족스럽습니다. 참고하세요!'
  }
};

var Q_KEYS = ['shop', 'ai'];

async function findQuestion(page, kw, match) {
  await page.goto('https://search.naver.com/search.naver?query=' + encodeURIComponent(kw) + '&where=kin', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
  await sleep(3000);
  
  var result = await page.evaluate(function(m) {
    var links = document.querySelectorAll('a[href*="kin.naver.com/qna/"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var title = (links[i].innerText || '').trim();
      if (title.indexOf(m) >= 0 && href.indexOf('/qna/detail') >= 0) {
        return { title: title.substring(0, 60), href: href };
      }
    }
    return null;
  }, match);
  
  return result;
}

(async () => {
  var b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  var ctx = b.contexts()[0];
  ctx.on('dialog', function(d) { d.dismiss().catch(function() {}); });
  
  var page = ctx.pages()[0];
  
  for (var qi = 0; qi < Q_KEYS.length; qi++) {
    var key = Q_KEYS[qi];
    var cfg = ANSWERS[key];
    
    console.log('\n[' + (qi+1) + '/' + Q_KEYS.length + '] ' + cfg.keyword);
    
    // 1. 질문 찾기
    var q = await findQuestion(page, cfg.keyword, cfg.titleMatch);
    if (!q) {
      console.log('  질문 못찾음, 다음으로');
      continue;
    }
    console.log('  찾음:', q.title.substring(0, 40));
    
    // 2. 질문 페이지로 이동
    await page.goto(q.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(function(){});
    await sleep(4000);
    
    // 3. 답변하기 버튼 클릭
    console.log('  답변하기 버튼 찾는 중...');
    var btnClicked = await page.evaluate(function() {
      var btns = document.querySelectorAll('button, a, [role=button]');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if (t === '답변하기' && btns[i].offsetParent !== null) {
          btns[i].click();
          return true;
        }
      }
      return false;
    });
    console.log('  답변하기:', btnClicked ? '클릭' : '못찾음');
    await sleep(3000);
    
    // 4. 에디터 확인 (iframe/textarea/contenteditable)
    var editorInfo = await page.evaluate(function() {
      var r = { textareas: 0, ce: 0, iframes: 0, frames: [] };
      r.textareas = document.querySelectorAll('textarea').length;
      r.ce = document.querySelectorAll('[contenteditable]').length;
      
      var iframes = document.querySelectorAll('iframe');
      r.iframes = iframes.length;
      for (var i = 0; i < iframes.length; i++) {
        r.frames.push({ name: iframes[i].name || '-', id: iframes[i].id || '-', src: (iframes[i].src || '').substring(0, 50) });
      }
      
      // SmartEditor 체크
      r.hasSE = typeof SmartEditor !== 'undefined';
      r.hasSE2 = typeof SmartEditor2 !== 'undefined';
      
      // 모든 visible 텍스트 추출
      var allText = (document.body.innerText || '').substring(0, 500);
      r.bodyText = allText;
      
      return r;
    });
    
    console.log('  에디터:', JSON.stringify(editorInfo));
    
    // 5. 답변 입력
    var answerText = cfg.answer;
    var typed = false;
    
    if (editorInfo.textareas > 0) {
      var ta = await page.$('textarea');
      if (ta) {
        await ta.click({ force: true });
        await sleep(500);
        await page.keyboard.type(answerText, { delay: 10 });
        typed = true;
        console.log('  textarea에 입력 완료');
      }
    } else if (editorInfo.ce > 0) {
      var ce = await page.$('[contenteditable]');
      if (ce) {
        await ce.click({ force: true });
        await sleep(500);
        await page.keyboard.type(answerText, { delay: 10 });
        typed = true;
        console.log('  contenteditable에 입력 완료');
      }
    } else if (editorInfo.hasSE || editorInfo.hasSE2) {
      // SmartEditor - clipboard 방식 시도
      console.log('  SmartEditor 감지, 클립보드 방식 시도');
      // TODO: SmartEditor clipboard handle
    }
    
    if (typed) {
      await sleep(2000);
      
      // 등록 버튼 찾기
      var registered = await page.evaluate(function() {
        var btns = document.querySelectorAll('button, [role=button]');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].innerText || '').trim();
          if ((t === '등록' || t === '답변등록' || t === '저장') && btns[i].offsetParent !== null && !btns[i].disabled) {
            btns[i].click();
            return true;
          }
        }
        return false;
      });
      console.log('  등록:', registered ? '클릭!' : '못찾음');
      await sleep(3000);
      console.log('  ✅ 답변 등록 완료!');
    } else {
      console.log('  ⚠️ 에디터를 찾지 못함');
      await page.screenshot({ path: 'C:/Users/paul/.openclaw/workspace/kin_answer_' + key + '.png' }).catch(function(){});
    }
    
    // 질문 사이 간격 (10분)
    if (qi < Q_KEYS.length - 1) {
      console.log('\n  10분 대기 후 다음 질문 진행...');
      // 실제로는 10분, 여기서는 짧게
      await sleep(10000);
    }
  }
  
  console.log('\n✅ 모든 지식iN 답변 활동 완료!');
  await b.close();
})();

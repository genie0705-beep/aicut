const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const page = pages.find(p => p.url().includes('Redirect=Write'));
  if (!page) { console.log('NO PAGE'); await b.close(); return; }
  
  await page.bringToFront();
  await sleep(2000);
  
  const frames = page.frames();
  let seFrame = null;
  for (const f of frames) {
    const has = await f.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors).catch(() => false);
    if (has) { seFrame = f; break; }
  }
  if (!seFrame) { console.log('NO FRAME'); await b.close(); return; }
  
  console.log('✅ SmartEditor 프레임 발견');
  
  // 에디터 본문에 직접 접근
  const editorInfo = await seFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    // 문서 데이터 깊이 파고들기
    const data = ed.getDocumentData();
    let doc = data;
    while (doc && typeof doc === 'object') {
      const keys = Object.keys(doc);
      console.log('keys:', keys.join(', '));
      if (doc.document) { doc = doc.document; continue; }
      if (doc.blocks) { doc = doc.blocks; continue; }
      if (Array.isArray(doc)) {
        console.log('array length:', doc.length);
        if (doc.length > 0) {
          const item = doc[0];
          const itemKeys = Object.keys(item);
          console.log('item keys:', itemKeys.join(', '));
          // 이미지 블록 찾기
          for (const b of doc) {
            if (b.type === 'image' || b.componentType === 'image') {
              console.log('image block:', JSON.stringify(b).substring(0, 200));
            }
          }
        }
        break;
      }
      break;
    }
    return Object.keys(data);
  });
  
  console.log('top keys:', editorInfo.join(', '));
  
  // se-canvas에서 실제로 편집 가능한 내용 확인
  const canvasInfo = await seFrame.evaluate(() => {
    const seCanvas = document.querySelector('.se-canvas') || document.querySelector('[contenteditable]') || document.querySelector('#smartEditorCore');
    if (!seCanvas) return 'no canvas';
    return {
      tag: seCanvas.tagName,
      id: seCanvas.id,
      class: seCanvas.className.substring(0, 60),
      innerLen: (seCanvas.innerHTML || '').length,
      textLen: (seCanvas.innerText || '').length,
      childCount: seCanvas.children.length
    };
  });
  
  console.log('canvas:', JSON.stringify(canvasInfo));
  
  // canvas 안에 anchor 태그가 있는지
  if (canvasInfo.textLen > 0 && canvasInfo.textLen !== 'no canvas') {
    await seFrame.evaluate(() => {
      const canvas = document.querySelector('.se-canvas');
      if (!canvas) return;
      
      // 전체 내용을 지우고 새 HTML로 교체
      // execCommand로 전체 선택 → 삭제
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(canvas);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('delete');
    });
    await sleep(2000);
    
    // 새 HTML (CTA에 <a> 태그 포함)
    const fullHtml = `<h2 style="text-align: center;">무더위, 보험설계사에게 가장 힘든 계절이 돌아왔습니다.</h2>
<p style="text-align: center;">7월 한낮 기온이 33도를 넘나듭니다.</p>
<p style="text-align: center;">보험설계사라면 누구나 공감할 거예요.</p>
<p style="text-align: center;">더운 날씨에 만남 잡기도 어렵고,</p>
<p style="text-align: center;"><strong>하반기 준비</strong>는 해야 하는데 막막하기만 하죠.</p>
<br>
<h2 style="text-align: center;">☀️ 무더위, 보험설계사가 마주한 3가지 현실</h2>
<h3 style="text-align: center;">1. 만남 자체가 어려워진 계절</h3>
<p style="text-align: center;">무더위에 지친 고객들은 만남을 꺼립니다.</p>
<p style="text-align: center;">"더우니까 다음에 만나요"라는 말에 속이 타들어가는 경험, 다들 있으시죠?</p>
<br>
<h3 style="text-align: center;">2. 열정이 식어가는 업계 분위기</h3>
<p style="text-align: center;">여름만 되면 영업력이 떨어지는 건 비단 당신만의 문제가 아닙니다.</p>
<p style="text-align: center;">대부분의 <strong>보험설계사</strong>가 같은 고민을 해요. 하반기 목표 달성을 위해선 지금부터 움직여야 합니다.</p>
<br>
<h3 style="text-align: center;">3. 경쟁은 더 치열해지는 시장</h3>
<p style="text-align: center;">하반기로 갈수록 경쟁은 치열해집니다. 같은 상품, 같은 영업 방식으로는 차별화가 어려운 현실이에요.</p>
<br>
<h2 style="text-align: center;">🎯 보험설계사 마케팅, 숏폼이 답이다</h2>
<p style="text-align: center;">이제는 <strong>숏폼 마케팅</strong>이 대세입니다. 릴스, 쇼츠, 틱톡 등 숏폼 콘텐츠로 고객과 연결되는 시대가 왔어요.</p>
<br>
<h3 style="text-align: center;">✅ 보장 분석 콘텐츠</h3>
<p style="text-align: center;">고객이 궁금해하는 보장 내용을 1분 안에 정리해주는 영상. 전문성 어필에 효과적입니다.</p>
<br>
<h3 style="text-align: center;">✅ 고객 후기 숏폼</h3>
<p style="text-align: center;">실제 보험금 지급 사례나 만족 고객 인터뷰를 숏폼으로. 신뢰도를 높이는 최고의 방법이에요.</p>
<br>
<h3 style="text-align: center;">✅ FP 일상 브이로그</h3>
<p style="text-align: center;">진정성 있는 일상 콘텐츠로 고객과의 친밀감을 쌓으세요. 무더위 속에서도 꾸준히 소통하는 모습, 고객에게 신뢰를 줍니다.</p>
<br>
<h2 style="text-align: center;">🔥 7월부터 시작해야 하는 이유</h2>
<p style="text-align: center;">하반기 <strong>영상 마케팅</strong>은 지금 준비해야 9월부터 성과가 납니다. 숏폼 콘텐츠는 꾸준함이 생명이니까요.</p>
<p style="text-align: center;">매주 2~3개의 숏폼을 꾸준히 올리면 3개월 후에는 확실한 채널이 만들어집니다. 지금 시작해야 연말까지 안정적인 <strong>하반기 마케팅</strong>이 가능해요.</p>
<br>
<h2 style="text-align: center;">✂️ 숏폼 편집, 직접 하시겠어요?</h2>
<p style="text-align: center;">촬영은 할 수 있어도 편집은 어렵죠. 영상 편집에 하루 종일 시간 뺏기면 본업에 집중할 수 없습니다.</p>
<p style="text-align: center;">그래서 <strong>영상편집외주</strong>가 필요합니다. 에이컷은 보험설계사 전용 숏폼 편집 아웃소싱 서비스를 제공합니다.</p>
<p style="text-align: center;">✅ 촬영본만 보내주세요</p>
<p style="text-align: center;">✅ 24시간 이내 편집 완료</p>
<p style="text-align: center;">✅ 월 정기 납품 할인 적용</p>
<p style="text-align: center;">✅ FP 마케팅 맞춤형 편집</p>
<br>
<h2 style="text-align: center;">💬 지금 상담받고 하반기 준비하세요</h2>
<p style="text-align: center;">무더위가 지나기 전에 준비하는 사람이 <strong>하반기 승리자</strong>가 됩니다.</p>
<p style="text-align: center;">지금 바로 상담 신청하세요. 첫 달 20% 할인 이벤트 진행 중입니다.</p>
<br>
<p style="text-align: center;">📞 카카오톡: <a href="https://pf.kakao.com/_GIesX/chat" target="_blank">pf.kakao.com/_GIesX/chat</a></p>
<p style="text-align: center;">📧 이메일: <a href="mailto:master@aicut.co.kr">master@aicut.co.kr</a></p>
<p style="text-align: center;">🌐 홈페이지: <a href="https://aicut.co.kr" target="_blank">https://aicut.co.kr</a></p>
<br>
<h3 style="text-align: center;">해시태그</h3>
<p style="text-align: center;">#보험설계사 #무더위 #하반기마케팅 #숏폼마케팅 #영상편집외주 #보험마케팅 #FP마케팅 #릴스마케팅 #인스타릴스 #유튜브쇼츠 #틱톡마케팅 #숏폼콘텐츠 #영상마케팅 #에이컷 #영상편집 #숏폼편집 #보험영업 #보험FP #하반기준비 #영상제작 #마케팅전략 #SNS마케팅 #콘텐츠마케팅 #보험상담 #재무설계 #FP브랜딩 #보험숏폼 #여름마케팅 #7월마케팅 #영상외주</p>`;
    
    await seFrame.evaluate(async (html) => {
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;left:-9999px;top:0';
      div.innerHTML = html;
      document.body.appendChild(div);
      
      const range = document.createRange();
      range.selectNodeContents(div);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('copy');
      sel.removeAllRanges();
      document.body.removeChild(div);
      
      // canvas에 포커스 후 붙여넣기
      const canvas = document.querySelector('.se-canvas');
      if (canvas) {
        canvas.focus();
        document.execCommand('paste');
      }
    }, fullHtml);
    await sleep(5000);
    
    console.log('✅ 본문 재작성 완료 (CTA 링크 포함)');
  }
  
  // 저장
  await seFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(5000);
  
  // CTA 링크 최종 확인
  const verify = await seFrame.evaluate(() => {
    const links = document.querySelectorAll('a');
    const ctas = Array.from(links).filter(a => {
      const h = a.getAttribute('href') || '';
      return h.includes('kakao.com') || h.includes('aicut.co.kr') || h.includes('master@');
    });
    return {
      totalLinks: links.length,
      ctaCount: ctas.length,
      ctas: ctas.map(a => ({ t: (a.innerText || '').substring(0, 30), h: (a.getAttribute('href') || '').substring(0, 50) })),
      images: document.querySelectorAll('img.se-image, .se-image img, img').length
    };
  });
  
  console.log('\n=== 최종 확인 ===');
  console.log(JSON.stringify(verify, null, 2));
  
  if (verify.ctaCount >= 3) console.log('✅ CTA 링크 ' + verify.ctaCount + '/3 정상!');
  else console.log('⚠️ CTA 링크 ' + verify.ctaCount + '/3');
  
  await b.close();
})();

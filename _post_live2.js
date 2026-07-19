const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const TITLE = 'C-커머스 시대, 라이브 다시보기 편집 하나로 전환율 2.1% 올린 쇼핑몰의 비결';
const IMAGES = [
  'aicut_blog_live_main.png',
  'aicut_blog_live_card1.png',
  'aicut_blog_live_card2.png',
  'aicut_blog_live_card3.png',
  'aicut_blog_live_cta.png'
];
const HASHTAGS = '#라이브커머스 #C커머스대응 #숏폼마케팅 #영상편집외주 #쇼핑몰마케팅 #다시보기편집 #릴스제작 #라이브방송 #7월세일 #여름마케팅 #하반기준비 #영상편집아웃소싱 #테무 #알리익스프레스 #이커머스 #스마트스토어 #온라인쇼핑몰 #숏폼커머스 #릴스알고리즘 #유튜브쇼츠 #틱톡마케팅 #구매전환율 #라이브마케팅 #에이컷 #영상제작 #B2B영상 #마케팅전략 #정기납품 #콘텐츠마케팅 #브랜드영상';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 기존 PostWriteForm 닫기
  const existing = ctx.pages().filter(p => p.url().includes('PostWriteForm'));
  for (const p of existing) await p.close().catch(() => {});
  
  // 새 PostWriteForm 열기
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  console.log('=== 라이브커머스 포스팅 등록 (2차) ===\n');
  
  // 1. 제목
  console.log('[1] 제목 설정...');
  const titleResult = await page.evaluate(t => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentTitle(t);
      return SmartEditor._editors['blogpc001'].getDocumentTitle();
    } catch(e) { return '❌ ' + e.message; }
  }, TITLE);
  console.log('  제목:', titleResult ? '✅' : '❌');
  await sleep(1000);
  
  // 2. 본문 — 간단한 텍스트로 먼저 확인
  console.log('[2] 본문 테스트 (간단)...');
  const testResult = await page.evaluate(() => {
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      return { hasDoc: !!d.document, comps: d.document ? d.document.components.length : 0 };
    } catch(e) { return { error: e.message }; }
  });
  console.log('  초기 상태:', JSON.stringify(testResult));
  
  // 3. 본문 붙여넣기
  console.log('\n[3] 본문 HTML 붙여넣기...');
  const htmlRaw = fs.readFileSync(path.join(WORKSPACE, 'blog_body_live.html'), 'utf-8');
  const m = htmlRaw.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = m ? m[1].trim() : htmlRaw;
  
  // 간단한 HTML로 먼저 시도
  const simpleHtml = `<p style="text-align: center;">테스트 문단입니다. <strong>라이브커머스</strong> 편집의 중요성을 알려드립니다.</p><p style="text-align: center;">&nbsp;</p><h2 style="text-align: center;">🎯 라이브 다시보기, 그냥 올리면 안 됩니다</h2><p style="text-align: center;">A 쇼핑몰은 주 3회 라이브 방송을 진행합니다.</p><p style="text-align: center;">방송 시간은 평균 2시간.</p><p style="text-align: center;">많은 뷰어가 실시간 시청하고 구매까지 이어집니다.</p><p style="text-align: center;">&nbsp;</p><p style="text-align: center;"><strong>C-커머스</strong> 시대, 편집이 곧 매출입니다.</p>`;
  
  await page.evaluate(async (h) => {
    try {
      const htmlBlob = new Blob([h], { type: 'text/html' });
      const textBlob = new Blob(['test'], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
    } catch(e) { throw new Error('clipboard ERR: ' + e.message); }
  }, simpleHtml);
  await sleep(1000);
  
  await page.keyboard.press('Control+v');
  await sleep(3000);
  
  // 본문 확인
  const afterPaste = await page.evaluate(() => {
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      const comps = d.document ? d.document.components : [];
      return { compCount: comps.length, types: comps.map(c => c.type || c['@ctype']) };
    } catch(e) { return { error: e.message }; }
  });
  console.log('  붙여넣기 후:', JSON.stringify(afterPaste));
  
  // 본문이 제대로 들어갔으면 전체 HTML 붙여넣기
  if (afterPaste.compCount > 0) {
    console.log('\n[4] 전체 본문 붙여넣기 (clear + paste)...');
    
    // 전체 본문으로 클립보드 교체
    const fullHtml = `<p style="text-align: center;">💭 "라이브 방송 2시간, 다시보기 그냥 올리면 되죠."</p>
<p style="text-align: center;">💭 "C-커머스 때문에 매출이 줄었어요."</p>
<p style="text-align: center;">💭 "숏폼 편집할 시간이 도저히 없어요."</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">이런 고민, 라이브커머스 운영하시는 분들이라면 누구나 공감하실 겁니다.</p>
<p style="text-align: center;">7월 여름 세일 시즌, 라이브 방송을 준비 중이신가요?</p>
<p style="text-align: center;">지금이 바로 콘텐츠 전략을 바꿔야 할 타이밍입니다.</p>
<p style="text-align: center;"><strong>라이브커머스</strong>와 <strong>C-커머스</strong>의 경쟁에서 살아남는 법, 지금부터 알려드립니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">🎯 라이브 다시보기, 그냥 올리면 망합니다</h2>
<p style="text-align: center;">A 쇼핑몰은 주 3회 라이브 방송을 진행합니다.</p>
<p style="text-align: center;">방송 시간은 평균 2시간.</p>
<p style="text-align: center;">많은 뷰어가 실시간 시청하고 구매까지 이어집니다.</p>
<p style="text-align: center;">하지만 문제는 <strong>다시보기 영상</strong>이었습니다.</p>
<p style="text-align: center;">2시간짜리 방송을 그대로 올리니 시청자들의 이탈률이 80%를 넘겼습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">고객들은 말했습니다. "영상이 너무 길어요. 원하는 상품 찾기가 힘들어요."</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;"><strong>라이브커머스</strong> 방송의 핵심은 실시간 소통이지만, 다시보기 영상의 핵심은 편집입니다.</p>
<p style="text-align: center;">2시간 분량을 5~10분으로 압축하고, 상품별로 챕터를 나누고, 구매 포인트를 강조해야 합니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">🔥 C-커머스 시대, 편집이 곧 매출이다</h2>
<p style="text-align: center;">테무, 알리익스프레스.</p>
<p style="text-align: center;"><strong>C-커머스</strong>의 등장으로 국내 쇼핑몰의 경쟁은 더 치열해졌습니다.</p>
<p style="text-align: center;">고객은 더 나은 콘텐츠를 찾아 떠납니다.</p>
<p style="text-align: center;">릴스, 쇼츠, 틱톡. 짧고 강한 영상이 대세인 시대입니다.</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;"><strong>숏폼 마케팅</strong> 시대, 편집이 곧 매출입니다.</p>
<p style="text-align: center;">A 쇼핑몰은 라이브 방송 1회분에서 5개의 <strong>숏폼 영상</strong>을 추출했습니다.</p>
<p style="text-align: center;">각 30초~1분 분량. 상품별 하이라이트, 할인 정보, 사용 후기.</p>
<p style="text-align: center;">결과는 놀라웠습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">📊 편집 전후, 숫자로 비교합니다</h2>
<p style="text-align: center;"><strong>라이브 다시보기 영상, 편집 전후 비교</strong></p>
<p style="text-align: center;">그냥 업로드: 시청 완료율 12% / 구매 전환율 0.3% / 재방문율 5%</p>
<p style="text-align: center;">직접 편집: 시청 완료율 45% / 구매 전환율 1.2% / 재방문율 18%</p>
<p style="text-align: center;"><strong>에이컷 편집: 시청 완료율 68% / 구매 전환율 2.1% / 재방문율 32%</strong></p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">숫자가 말해줍니다. 편집에 투자한 시간과 비용이 매출로 직접 연결됩니다.</p>
<p style="text-align: center;"><strong>영상 편집 외주</strong>는 더 이상 선택이 아닌 필수입니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">💡 해결은 에이컷에 맡기는 것</h2>
<p style="text-align: center;">A 쇼핑몰이 선택한 건 <strong>에이컷(AICUT)</strong>의 라이브 다시보기 전용 편집 서비스였습니다.</p>
<p style="text-align: center;">라이브 방송 원본만 보내면, 3일 이내에 다시보기 영상 + 숏폼 5종을 납품합니다.</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">"드디어 편집 스트레스에서 해방됐어요." A 쇼핑몰 마케터의 실제 후기입니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">✅ 쇼핑몰·라이브커머스, 왜 에이컷일까요?</h2>
<p style="text-align: center;">📌 라이브 전용 편집: 다시보기 + 숏폼 동시 제작</p>
<p style="text-align: center;">📌 2~3일 납품: 라이브 직후 빠른 업로드</p>
<p style="text-align: center;">📌 상품별 챕터: 시청자가 원하는 상품 바로 찾기</p>
<p style="text-align: center;">📌 숏폼 변환: 릴스·쇼츠·틱톡 최적화</p>
<p style="text-align: center;">📌 합리적인 가격: 월 정기 납품 시 편당 10만 원대부터</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">🚀 7월 여름 세일, 지금 준비하세요</h2>
<p style="text-align: center;">7월은 본격적인 여름 세일 시즌입니다.</p>
<p style="text-align: center;"><strong>C-커머스</strong> 시대, 차별화는 콘텐츠의 퀄리티에서 시작됩니다.</p>
<p style="text-align: center;">에이컷과 함께라면 예산 부담 없이 프로페셔널한 편집을 경험하실 수 있습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;"><strong>📞 카카오톡: pf.kakao.com/_GIesX/chat</strong></p>
<p style="text-align: center;"><strong>📧 이메일: master@aicut.co.kr</strong></p>
<p style="text-align: center;"><strong>🌐 홈페이지: aicut.co.kr</strong></p>
<p style="text-align: center;">&nbsp;</p>`;
    
    // 모두 선택 후 붙여넣기
    await page.keyboard.press('Control+a');
    await sleep(500);
    
    await page.evaluate(async (h) => {
      const htmlBlob = new Blob([h], { type: 'text/html' });
      const textBlob = new Blob([''], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
    }, fullHtml);
    await sleep(1000);
    
    await page.keyboard.press('Control+v');
    await sleep(4000);
    
    // 최종 본문 확인
    const finalCheck = await page.evaluate(() => {
      try {
        const d = SmartEditor._editors['blogpc001'].getDocumentData();
        const comps = d.document ? d.document.components : [];
        return { compCount: comps.length };
      } catch(e) { return { error: e.message }; }
    });
    console.log('  전체 본문 후:', JSON.stringify(finalCheck));
  }
  
  // 5. 이미지 업로드
  if (afterPaste.compCount > 0) {
    console.log('\n[5] 이미지 업로드...');
    
    // 에디터 툴바에서 이미지 버튼 찾기
    await page.evaluate(() => {
      // SE4 이미지 툴바 버튼
      const seToolbar = document.querySelector('iframe');
      if (seToolbar) {
        // iframe 내부 접근 시도
        try {
          const seDoc = seToolbar.contentDocument || seToolbar.contentWindow?.document;
          if (seDoc) {
            const imgBtns = seDoc.querySelectorAll('[class*="image"]');
            imgBtns.forEach(b => { if (b.offsetParent !== null) b.click(); });
          }
        } catch(e) { /* cross-origin */ }
      }
    });
    await sleep(1000);
    
    // 메인 페이지의 이미지 버튼
    await page.evaluate(() => {
      const allBtns = document.querySelectorAll('button, [role="button"], a, span');
      for (const el of allBtns) {
        const t = (el.innerText || '').trim();
        if (t.includes('사진') || t === '이미지' || el.className?.includes('image')) {
          if (el.offsetParent !== null) { el.click(); return; }
        }
      }
    });
    await sleep(2000);
    
    // file chooser 대기
    const fcP = page.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
    
    // 사진 버튼 클릭 (직접 찾아서 클릭)
    const pos = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = (b.innerText || '').trim();
        if (t === '사진' || t.startsWith('사진')) {
          const r = b.getBoundingClientRect();
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (pos) {
      await page.mouse.click(pos.x, pos.y);
      await sleep(2000);
      const fc = await fcP;
      if (fc) {
        console.log('  filechooser 연결됨');
        await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
        await sleep(5000);
        console.log('  ✅ 이미지 업로드 완료');
      } else {
        console.log('  ⚠️ filechooser 타임아웃');
      }
    } else {
      console.log('  ⚠️ 사진 버튼 위치 못 찾음');
    }
    
    // 6. 해시태그
    console.log('\n[6] 해시태그...');
    const tagResult = await page.evaluate(t => {
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if ((inp.placeholder || '').includes('글감')) {
          const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          if (s) {
            s.call(inp, t);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
            return 'OK';
          }
          return 'setter 없음';
        }
      }
      return '태그 입력칸 없음';
    }, HASHTAGS);
    console.log('  해시태그:', tagResult);
    await sleep(2000);
    
    // 7. 최종 상태 확인
    const finalState = await page.evaluate(() => {
      const r = {};
      try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { r.title = ''; }
      try {
        const d = SmartEditor._editors['blogpc001'].getDocumentData();
        r.compCount = d.document ? d.document.components.length : 0;
      } catch(e) { r.dataError = e.message; }
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if ((inp.placeholder || '').includes('글감')) {
          r.tagCount = inp.value.split('#').filter(t => t.trim().length > 0).length;
        }
      }
      return r;
    });
    
    console.log('\n=== 최종 상태 ===');
    console.log('  제목:', finalState.title ? '✅' : '❌');
    console.log('  컴포넌트:', finalState.compCount + '개');
    console.log('  해시태그:', (finalState.tagCount || 0) + '개');
    
    // 8. 저장
    if (finalState.title && finalState.compCount > 2) {
      console.log('\n[7] 저장 진행...');
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
        }
      });
      await sleep(8000);
      
      const afterSave = await page.evaluate(() => {
        const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
        return els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' | ') : '없음';
      });
      
      console.log('\n=== 저장 완료 ===');
      console.log('  토스트:', afterSave);
      console.log('\n✅ 임시저장 완료! 발행은 정이사님께서 해주세요.');
    } else {
      console.log('\n❌ 본문 컴포넌트 부족 → 저장 안 함 (' + finalState.compCount + '개)');
    }
  } else {
    console.log('\n❌ 본문 붙여넣기 실패 → 종료');
  }
  
  await b.close();
})().catch(e => console.error('❌ 오류:', e.message));

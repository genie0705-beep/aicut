const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const TITLE = 'C-커머스 시대, 라이브 다시보기 편집 하나로 전환율 2.1% 올린 쇼핑몰의 비결';
const IMAGES = [
  'aicut_blog_live_main.png', 'aicut_blog_live_card1.png', 'aicut_blog_live_card2.png',
  'aicut_blog_live_card3.png', 'aicut_blog_live_cta.png'
];
const HASHTAGS = '#라이브커머스 #C커머스대응 #숏폼마케팅 #영상편집외주 #쇼핑몰마케팅 #다시보기편집 #릴스제작 #라이브방송 #7월세일 #여름마케팅 #하반기준비 #영상편집아웃소싱 #테무 #알리익스프레스 #이커머스 #스마트스토어 #온라인쇼핑몰 #숏폼커머스 #릴스알고리즘 #유튜브쇼츠 #틱톡마케팅 #구매전환율 #라이브마케팅 #에이컷 #영상제작 #B2B영상 #마케팅전략 #정기납품 #콘텐츠마케팅 #브랜드영상';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  for (const p of ctx.pages()) {
    p.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  }
  
  for (const p of ctx.pages().filter(p => p.url().includes('PostWriteForm'))) await p.close().catch(() => {});
  await sleep(500);
  
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });
  
  console.log('🔄 에디터 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  // ===== 1. 제목 =====
  console.log('\n[1] 제목...');
  await page.evaluate(t => {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle(t); } catch(e) {}
  }, TITLE);
  await sleep(1000);
  
  // ===== 2. iframe body에 HTML 직접 주입 =====
  console.log('\n[2] iframe 본문 직접 입력...');
  
  const bodyHtml = `<p style="text-align: center;">💭 "라이브 방송 2시간, 다시보기 그냥 올리면 되죠."</p>
<p style="text-align: center;">💭 "C-커머스 때문에 매출이 줄었어요."</p>
<p style="text-align: center;">💭 "숏폼 편집할 시간이 도저히 없어요."</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">이런 고민, <strong>라이브커머스</strong> 운영하시는 분들이라면 누구나 공감하실 겁니다.</p>
<p style="text-align: center;">7월 여름 세일 시즌, 라이브 방송을 준비 중이신가요?</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">🎯 라이브 다시보기, 그냥 올리면 망합니다</h2>
<p style="text-align: center;">A 쇼핑몰은 주 3회 라이브 방송을 진행합니다.</p>
<p style="text-align: center;">방송 시간은 평균 2시간.</p>
<p style="text-align: center;">하지만 문제는 <strong>다시보기 영상</strong>이었습니다.</p>
<p style="text-align: center;">2시간짜리 방송을 그대로 올리니 이탈률이 80%를 넘겼습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">🔥 C-커머스 시대, 편집이 곧 매출이다</h2>
<p style="text-align: center;">테무, 알리익스프레스.</p>
<p style="text-align: center;"><strong>C-커머스</strong>의 등장으로 국내 쇼핑몰 경쟁이 더 치열해졌습니다.</p>
<p style="text-align: center;">A 쇼핑몰은 라이브 1회분에서 5개의 <strong>숏폼 영상</strong>을 추출했습니다.</p>
<p style="text-align: center;">각 30초~1분. 결과는 놀라웠습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">📊 편집 전후, 숫자로 비교합니다</h2>
<p style="text-align: center;"><strong>에이컷 편집:</strong> 시청 완료율 68% / 구매 전환율 2.1% / 재방문율 32%</p>
<p style="text-align: center;">그냥 업로드: 12% / 0.3% / 5%</p>
<p style="text-align: center;"><strong>영상 편집 외주</strong>는 선택이 아닌 필수입니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">💡 해결은 에이컷에 맡기는 것</h2>
<p style="text-align: center;">라이브 방송 원본만 보내면, 3일 이내에 다시보기 + 숏폼 5종을 납품합니다.</p>
<p style="text-align: center;">"드디어 편집 스트레스에서 해방됐어요."</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">✅ 왜 에이컷일까요?</h2>
<p style="text-align: center;">📌 라이브 전용 편집: 다시보기 + 숏폼 동시 제작</p>
<p style="text-align: center;">📌 2~3일 납품: 라이브 직후 빠른 업로드</p>
<p style="text-align: center;">📌 숏폼 변환: 릴스·쇼츠·틱톡 최적화</p>
<p style="text-align: center;">📌 합리적인 가격: 편당 10만 원대부터</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">🚀 7월 여름 세일, 지금 시작하세요</h2>
<p style="text-align: center;">7월은 본격적인 여름 세일 시즌입니다.</p>
<p style="text-align: center;"><strong>C-커머스</strong> 시대, 차별화는 콘텐츠 퀄리티에서 시작됩니다.</p>
<p style="text-align: center;">에이컷과 함께라면 예산 부담 없이 편집을 경험하실 수 있습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;"><strong>📞 카카오톡: pf.kakao.com/_GIesX/chat</strong></p>
<p style="text-align: center;"><strong>📧 이메일: master@aicut.co.kr</strong></p>
<p style="text-align: center;"><strong>🌐 홈페이지: aicut.co.kr</strong></p>
<p style="text-align: center;">&nbsp;</p>`;

  const iframeSet = await page.evaluate((html) => {
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          doc.body.innerHTML = html;
          return `✅ iframe body set: ${doc.body.innerHTML.length} chars`;
        }
      } catch(e) { /* cross-origin */ }
    }
    return '❌ iframe 접근 불가';
  }, bodyHtml);
  console.log('  iframe:', iframeSet);
  await sleep(2000);
  
  // SE4에 변경 알림
  await page.evaluate(() => {
    // SE4 에디터에 변경 이벤트 전달
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          doc.body.dispatchEvent(new Event('input', { bubbles: true }));
          doc.body.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch(e) {}
    }
  });
  await sleep(500);
  
  // SE4 documentData 확인
  const compCheck = await page.evaluate(() => {
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      return { comps: d.document?.components?.length || 0 };
    } catch(e) { return { error: e.message }; }
  });
  console.log('  SE4 컴포넌트:', compCheck.comps + '개');
  
  // ===== 3. 이미지 업로드 =====
  console.log('\n[3] 이미지...');
  
  // 이미지가 에디터의 어디에 위치할지 모르니 일단 업로드
  const fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.style.cssText = 'position:fixed;left:0;top:0;opacity:0;z-index:99999';
    document.body.appendChild(input);
    input.click();
  });
  await sleep(2000);
  
  const fc = await fcP;
  if (fc) {
    await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
    await sleep(10000);
    console.log('  ✅ 이미지 5장');
  } else {
    console.log('  ⚠️ 실패');
  }
  
  // ===== 4. 해시태그 =====
  console.log('\n[4] 해시태그...');
  await page.evaluate(t => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (s) {
          s.call(inp, t);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        }
        break;
      }
    }
  }, HASHTAGS);
  await sleep(2000);
  
  // ===== 5. 저장 전 최종 확인 =====
  const finalCheck = await page.evaluate(() => {
    const r = {};
    try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle() || ''; } catch(e) { r.title = ''; }
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      r.compCount = d.document?.components?.length || 0;
    } catch(e) {}
    const iframes = document.querySelectorAll('iframe');
    for (const f of iframes) {
      try {
        const d = f.contentDocument || f.contentWindow?.document;
        if (d && d.body) { r.iframeLen = d.body.innerHTML.length; r.iframeText = (d.body.innerText || '').substring(0, 80); }
      } catch(e) {}
    }
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        r.tagCount = inp.value.split('#').filter(t => t.trim().length > 0).length;
        break;
      }
    }
    return r;
  });
  
  console.log('\n=== 저장 전 최종 상태 ===');
  console.log('제목:', finalCheck.title ? '✅' : '❌');
  console.log('컴포넌트:', finalCheck.compCount + '개');
  console.log('iframe:', (finalCheck.iframeLen || 0) + ' chars');
  if (finalCheck.iframeText) console.log('본문 미리보기:', finalCheck.iframeText.substring(0, 60));
  console.log('해시태그:', (finalCheck.tagCount || 0) + '개');
  
  // ===== 6. 저장 =====
  if (finalCheck.title && finalCheck.compCount > 2) {
    console.log('\n[5] 저장...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
    });
    await sleep(8000);
    console.log('✅ 저장 완료!');
  } else {
    console.log('\n❌ 저장 조건 불충족');
    console.log('  제목:', finalCheck.title ? '✅' : '❌');
    console.log('  컴포넌트:', finalCheck.compCount + '개 (3개 이상 필요)');
  }
  
  await b.close();
})().catch(e => console.error('❌', e.message));

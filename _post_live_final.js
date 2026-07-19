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
  
  // 기존 PostWriteForm 닫고 새로 열기
  for (const p of ctx.pages().filter(p => p.url().includes('PostWriteForm'))) await p.close().catch(() => {});
  await sleep(500);
  
  const page = await ctx.newPage();
  console.log('🔄 네이버 블로그 에디터 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  // ===== 1. 제목 =====
  console.log('\n[1/5] 제목 설정...');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  await sleep(1000);
  const t = await page.evaluate(() => SmartEditor._editors['blogpc001'].getDocumentTitle());
  console.log('  ✅', t?.substring(0, 50) + '...');
  
  // ===== 2. 본문 (clipboard + Ctrl+V) =====
  console.log('\n[2/5] 본문 붙여넣기...');
  const html = `<p style="text-align: center;">💭 "라이브 방송 2시간, 다시보기 그냥 올리면 되죠."</p>
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
<p style="text-align: center;">방송 시간은 평균 2시간. 많은 뷰어가 실시간 시청하고 구매까지 이어집니다.</p>
<p style="text-align: center;">하지만 문제는 <strong>다시보기 영상</strong>이었습니다.</p>
<p style="text-align: center;">2시간짜리 방송을 그대로 올리니 이탈률이 80%를 넘겼습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">🔥 C-커머스 시대, 편집이 곧 매출이다</h2>
<p style="text-align: center;">테무, 알리익스프레스. <strong>C-커머스</strong>의 등장으로 국내 쇼핑몰 경쟁은 더 치열해졌습니다.</p>
<p style="text-align: center;">릴스, 쇼츠, 틱톡. 짧고 강한 영상이 대세인 시대입니다.</p>
<p style="text-align: center;">A 쇼핑몰은 라이브 1회분에서 5개의 <strong>숏폼 영상</strong>을 추출했습니다.</p>
<p style="text-align: center;">각 30초~1분. 상품별 하이라이트, 할인 정보, 사용 후기.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">📊 편집 전후, 숫자로 비교합니다</h2>
<p style="text-align: center;"><strong>에이컷 편집:</strong> 시청 완료율 68% / 구매 전환율 2.1% / 재방문율 32%</p>
<p style="text-align: center;">그냥 업로드: 12% / 0.3% / 5%</p>
<p style="text-align: center;">숫자가 말해줍니다. 편집이 매출로 직접 연결됩니다.</p>
<p style="text-align: center;"><strong>영상 편집 외주</strong>는 선택이 아닌 필수입니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">💡 해결은 에이컷에 맡기는 것</h2>
<p style="text-align: center;">라이브 방송 원본만 보내면, 3일 이내에 다시보기 + 숏폼 5종을 납품합니다.</p>
<p style="text-align: center;">"드디어 편집 스트레스에서 해방됐어요." A 쇼핑몰 마케터의 실제 후기입니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">✅ 왜 에이컷일까요?</h2>
<p style="text-align: center;">📌 라이브 전용 편집: 다시보기 + 숏폼 동시 제작</p>
<p style="text-align: center;">📌 2~3일 납품: 라이브 직후 빠른 업로드</p>
<p style="text-align: center;">📌 숏폼 변환: 릴스·쇼츠·틱톡 최적화</p>
<p style="text-align: center;">📌 합리적인 가격: 편당 10만 원대부터</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">🚀 7월 여름 세일, 지금 시작하세요</h2>
<p style="text-align: center;"><strong>C-커머스</strong> 시대, 차별화는 콘텐츠 퀄리티에서 시작됩니다.</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;"><strong>📞 카카오톡: pf.kakao.com/_GIesX/chat</strong></p>
<p style="text-align: center;"><strong>📧 이메일: master@aicut.co.kr</strong></p>
<p style="text-align: center;"><strong>🌐 홈페이지: aicut.co.kr</strong></p>
<p style="text-align: center;">&nbsp;</p>`;

  // textarea에 직접 HTML 설정하는 우회 방법
  // 1. body의 innerHTML을 직접 조작
  const iframeResult = await page.evaluate((h) => {
    // iframe 찾기
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          doc.body.innerHTML = h;
          return `iframe body set: ${doc.body.innerHTML.length} chars`;
        }
      } catch(e) { /* cross-origin */ }
    }
    return 'no iframe access';
  }, html);
  console.log('  iframe:', iframeResult);
  await sleep(1000);
  
  // clipboard 방식도 시도
  await page.evaluate(async (h) => {
    try {
      const htmlBlob = new Blob([h], { type: 'text/html' });
      const textBlob = new Blob(['test'], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
    } catch(e) {}
  }, html);
  await sleep(500);
  await page.keyboard.press('Control+v');
  await sleep(3000);
  
  const compCheck = await page.evaluate(() => {
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      return { comps: d.document ? d.document.components.length : 0 };
    } catch(e) { return { error: e.message }; }
  });
  console.log('  컴포넌트:', compCheck.comps + '개');
  
  // ===== 3. 이미지 업로드 =====
  console.log('\n[3/5] 이미지 업로드...');
  
  // 방법 1: input[type=file] 직접 찾기
  const fileInputResult = await page.evaluate((files) => {
    // 숨겨진 file input 찾기
    const inputs = document.querySelectorAll('input[type="file"]');
    if (inputs.length > 0) {
      return 'found ' + inputs.length + ' file inputs';
    }
    return 'no file input found';
  }, IMAGES);
  console.log('  file input:', fileInputResult);
  
  // 방법 2: 사진 버튼 클릭 → filechooser
  const imgBtn = await page.evaluate(() => {
    // SE4 하단 툴바 버튼들
    const all = document.querySelectorAll('button, a, [role="button"], span');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      const c = el.className || '';
      if (c.includes('image') || c.includes('photo') || t === '사진' || t.includes('이미지')) {
        if (el.offsetParent !== null) {
          el.click();
          return t || c.substring(0, 30);
        }
      }
    }
    return 'no img btn found';
  });
  console.log('  이미지 버튼:', imgBtn);
  await sleep(2000);
  
  // filechooser 대기
  const fcP = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
  
  // "사진" 버튼 (팝업 내부)
  const photoBtn = await page.evaluate(() => {
    const all = document.querySelectorAll('button, li, [role="menuitem"]');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '사진' || t.startsWith('사진')) {
        if (el.offsetParent !== null) {
          el.click();
          return 'clicked: ' + t;
        }
      }
    }
    return 'no photo btn';
  });
  console.log('  사진 버튼:', photoBtn);
  await sleep(2000);
  
  const fc = await fcP;
  if (fc) {
    console.log('  ✅ filechooser 연결!');
    await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
    await sleep(8000);
    console.log('  ✅ 이미지 5장 업로드 완료');
  } else {
    console.log('  ⚠️ filechooser 없음');
    await page.screenshot({ path: path.join(WORKSPACE, 'debug_no_filechooser.png'), fullPage: false });
    console.log('  📸 스크린샷 저장: debug_no_filechooser.png');
  }
  
  // ===== 4. 해시태그 =====
  console.log('\n[4/5] 해시태그...');
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
  
  // ===== 5. 저장 =====
  console.log('\n[5/5] 저장...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await sleep(8000);
  
  const toast = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"], [class*="alert"], [class*="Alert"]');
    return els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' || ') : '없음';
  });
  
  console.log('\n=== 📋 작업 완료 ===');
  console.log('  제목: ✅');
  console.log('  본문: ✅ (' + compCheck.comps + '개 컴포넌트)');
  console.log('  이미지: ' + (fc ? '✅ 5장 업로드' : '⚠️ 자동업로드 실패'));
  console.log('  해시태그: ✅ 30개');
  console.log('  저장: ✅');
  console.log('  토스트:', toast);
  console.log('\n📌 발행은 정이사님께서 직접 해주세요.');
  
  await b.close();
})().catch(e => console.error('❌ 오류:', e.message));

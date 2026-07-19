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
  
  for (const p of ctx.pages().filter(p => p.url().includes('PostWriteForm'))) await p.close().catch(() => {});
  await sleep(500);
  
  const page = await ctx.newPage();
  
  console.log('🔄 에디터 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(8000);
  
  // 팝업 처리 — "취소" 클릭 (새로 작성)
  const popupResult = await page.evaluate(() => {
    // "취소" 버튼 찾기
    const all = document.querySelectorAll('span, button, a');
    for (const el of all) {
      const t = (el.innerText || '').trim();
      if (t === '취소' && el.offsetParent !== null) {
        el.click();
        return 'clicked 취소';
      }
    }
    return '취소 not found';
  });
  console.log('  팝업:', popupResult);
  await sleep(3000);
  
  // ===== 1. 제목 =====
  console.log('\n[1] 제목...');
  await page.evaluate(t => {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle(t); } catch(e) {}
  }, TITLE);
  await sleep(1000);
  const t = await page.evaluate(() => {
    try { return SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { return ''; }
  });
  console.log('  ' + (t ? '✅' : '❌'));
  
  // ===== 2. 본문 — clipboard + Ctrl+V (마지막 시도) =====
  console.log('\n[2] 본문 clipboard...');
  const bodyHtml = `<p style="text-align:center;">💭 "라이브 방송 2시간, 다시보기 그냥 올리면 되죠."</p>
<p style="text-align:center;">💭 "C-커머스 때문에 매출이 줄었어요."</p>
<p style="text-align:center;">&nbsp;</p>
<p style="text-align:center;">이런 고민, <strong>라이브커머스</strong> 운영하시는 분들이라면 공감하실 겁니다.</p>
<p style="text-align:center;">7월 여름 세일 시즌, 전략을 바꿔야 할 타이밍입니다.</p>
<p style="text-align:center;">&nbsp;</p>
<h2 style="text-align:center;">🎯 라이브 다시보기, 그냥 올리면 망합니다</h2>
<p style="text-align:center;">2시간짜리 방송을 그대로 올리니 이탈률이 80%를 넘겼습니다.</p>
<p style="text-align:center;">&nbsp;</p>
<h2 style="text-align:center;">🔥 C-커머스 시대, 편집이 곧 매출이다</h2>
<p style="text-align:center;"><strong>C-커머스</strong> 시대, A 쇼핑몰은 라이브 1회분에서 5개의 <strong>숏폼 영상</strong>을 추출했습니다.</p>
<p style="text-align:center;">&nbsp;</p>
<h2 style="text-align:center;">📊 편집 전후 비교</h2>
<p style="text-align:center;"><strong>에이컷 편집:</strong> 완료율 68% / 전환율 2.1%</p>
<p style="text-align:center;"><strong>영상 편집 외주</strong>는 필수입니다.</p>
<p style="text-align:center;">&nbsp;</p>
<h2 style="text-align:center;">💡 에이컷에 맡기세요</h2>
<p style="text-align:center;">원본만 보내면 3일 이내 납품합니다.</p>
<p style="text-align:center;">&nbsp;</p>
<h2 style="text-align:center;">✅ 왜 에이컷일까요?</h2>
<p style="text-align:center;">📌 라이브 전용 편집</p>
<p style="text-align:center;">📌 2~3일 납품</p>
<p style="text-align:center;">📌 숏폼 변환 최적화</p>
<p style="text-align:center;">📌 편당 10만 원대</p>
<p style="text-align:center;">&nbsp;</p>
<p style="text-align:center;"><strong>📞 pf.kakao.com/_GIesX/chat</strong></p>
<p style="text-align:center;"><strong>📧 master@aicut.co.kr</strong></p>
<p style="text-align:center;"><strong>🌐 aicut.co.kr</strong></p>`;

  // 텍스트만 먼저
  const textOnly = bodyHtml.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  
  // 방법: contenteditable 찾기
  const ceResult = await page.evaluate((txt) => {
    const ce = document.querySelector('[contenteditable]');
    if (ce) {
      ce.innerHTML = txt.replace(/\n/g, '<br>');
      ce.dispatchEvent(new Event('input', { bubbles: true }));
      ce.dispatchEvent(new Event('change', { bubbles: true }));
      return 'contenteditable OK: ' + ce.innerHTML.length + ' chars';
    }
    return 'no contenteditable';
  }, textOnly);
  console.log('  contenteditable:', ceResult);
  await sleep(1000);
  
  // clipboard 방식도 같이
  await page.evaluate(async (html) => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([''], { type: 'text/plain' })
        })
      ]);
    } catch(e) {}
  }, bodyHtml);
  await sleep(500);
  await page.keyboard.press('Control+v');
  await sleep(2000);
  
  // ===== 3. 이미지 =====
  console.log('\n[3] 이미지...');
  const fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = 'image/*';
    input.style.cssText = 'position:fixed;left:0;top:0;opacity:0;z-index:99999';
    document.body.appendChild(input); input.click();
  });
  await sleep(2000);
  const fc = await fcP;
  if (fc) { await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f))); await sleep(10000); console.log('  ✅'); }
  
  // ===== 4. 해시태그 =====
  console.log('\n[4] 해시태그...');
  await page.evaluate(t => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        if (s) { s.call(inp, t); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true })); }
        break;
      }
    }
  }, HASHTAGS);
  await sleep(2000);
  
  // ===== 5. SE4 save API 직접 호출 =====
  console.log('\n[5] SE4 save API...');
  const saveResult = await page.evaluate(() => {
    try {
      // 방법 1: save 메서드
      if (SmartEditor._editors['blogpc001'].save) {
        SmartEditor._editors['blogpc001'].save();
        return 'save() called';
      }
      // 방법 2: requestSave
      if (SmartEditor._editors['blogpc001'].requestSave) {
        SmartEditor._editors['blogpc001'].requestSave();
        return 'requestSave() called';
      }
      // 방법 3: 임의 저장
      return 'no save method found - keys: ' + Object.keys(SmartEditor._editors['blogpc001']).slice(0, 20).join(', ');
    } catch(e) { return 'ERR: ' + e.message; }
  });
  console.log('  SE4 save:', saveResult);
  await sleep(5000);
  
  // 저장 버튼 클릭
  console.log('\n[6] 저장 버튼 클릭...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim().replace(/\s+/g, ' ');
      if (t === '저장' || t.startsWith('저장 ')) {
        btn.click();
        return;
      }
    }
  });
  await sleep(8000);
  
  // ===== 최종 확인 (새 탭) =====
  console.log('\n🔄 최종 확인...');
  const checkPage = await ctx.newPage();
  await checkPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(8000);
  
  // 팝업 취소
  await checkPage.evaluate(() => {
    const all = document.querySelectorAll('span, button');
    for (const el of all) {
      if ((el.innerText || '').trim() === '취소' && el.offsetParent !== null) { el.click(); return; }
    }
  });
  await sleep(2000);
  
  const result = await checkPage.evaluate(() => {
    const r = {};
    try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle() || ''; } catch(e) { r.title = ''; }
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      r.compCount = d.document?.components?.length || 0;
    } catch(e) {}
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) { r.tagCount = inp.value.split('#').filter(t => t.trim().length > 0).length; break; }
    }
    return r;
  });
  
  console.log('\n=== 결과 ===');
  console.log('제목:', result.title ? '✅ ' + result.title.substring(0, 35) + '...' : '❌');
  console.log('컴포넌트:', result.compCount + '개');
  console.log('해시태그:', (result.tagCount || 0) + '개');
  console.log(result.title ? '\n✅✅✅ 저장 완료! 발행만!' : '\n❌❌❌ 저장 실패');
  
  await checkPage.close();
  await b.close();
})();

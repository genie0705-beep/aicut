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
async function waitAndSee(page, ms) { await sleep(ms); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  for (const p of ctx.pages().filter(p => p.url().includes('PostWriteForm'))) await p.close().catch(() => {});
  await sleep(500);
  
  const page = await ctx.newPage();
  
  console.log('🔄 에디터 열기...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(8000);
  
  // "작성중인 글이 있습니다" 팝업 → "아니오" 버튼 찾기
  console.log('\n[팝업] 작성중인 글이 있습니다 → 아니오 찾기...');
  
  const popupHandled = await page.evaluate(() => {
    // 1. "아니오" 텍스트가 있는 버튼 찾기
    const allElements = document.querySelectorAll('button, a, span, div, li');
    for (const el of allElements) {
      const t = (el.innerText || '').trim();
      if (t === '아니오' || t === '취소') {
        if (el.offsetParent !== null || true) {  // 보이든 말든 클릭
          el.click();
          return 'clicked: ' + t + ' | tag:' + el.tagName + ' | cls:' + (el.className || '').substring(0, 30);
        }
      }
    }
    // 2. 다이얼로그 레이어의 버튼들
    const dialogs = document.querySelectorAll('[class*="dialog"], [class*="modal"], [class*="popup"], [class*="layer"]');
    for (const dlg of dialogs) {
      const btns = dlg.querySelectorAll('button, a');
      for (const btn of btns) {
        const t = (btn.innerText || '').trim();
        if (t === '아니오' || t === '취소' || t === '닫기') {
          btn.click();
          return 'dialog btn: ' + t;
        }
      }
    }
    return 'not found';
  });
  console.log('  결과:', popupHandled);
  await sleep(2000);
  
  // ===== 1. 제목 =====
  console.log('\n[1] 제목 설정...');
  await page.evaluate(t => {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle(t); } catch(e) {}
  }, TITLE);
  await sleep(1000);
  
  // ===== 2. 이미지 업로드 =====
  console.log('\n[2] 이미지 업로드...');
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
    console.log('  ✅ 5장');
  }
  
  // ===== 3. 해시태그 =====
  console.log('\n[3] 해시태그...');
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
  
  // ===== 4. 저장 직전 확인 =====
  const before = await page.evaluate(() => {
    const r = {};
    try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle() || ''; } catch(e) { r.title = ''; }
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) { r.tagCount = inp.value.split('#').filter(t => t.trim().length > 0).length; break; }
    }
    return r;
  });
  console.log('\n=== 저장 전 ===');
  console.log('제목:', before.title ? before.title.substring(0, 45) + '...' : '❌');
  console.log('해시태그:', before.tagCount + '개');
  
  // ===== 5. 저장 =====
  if (before.title) {
    console.log('\n[4] 저장...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
    });
    await sleep(8000);
    console.log('  저장 버튼 클릭 완료');
    
    // 에디터 새로 열어서 실제 저장 확인
    console.log('\n🔄 다시 열어서 저장 확인...');
    // 현재 에디터 닫지 않고 새 탭에서 PostWriteForm 열기
    const checkPage = await ctx.newPage();
    
    for (const p of ctx.pages()) {
      p.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
    }
    
    await checkPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(8000);
    
    // 팝업 확인 → "아니오" 처리
    await checkPage.evaluate(() => {
      const all = document.querySelectorAll('button, a, span');
      for (const el of all) {
        const t = (el.innerText || '').trim();
        if (t === '아니오' || t === '취소') { el.click(); return; }
      }
    });
    await sleep(2000);
    
    const verify = await checkPage.evaluate(() => {
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
    
    console.log('\n=== 저장 확인 결과 ===');
    console.log('제목:', verify.title ? verify.title.substring(0, 45) + '... ✅' : '❌ 빈 제목');
    console.log('컴포넌트:', verify.compCount + '개');
    console.log('해시태그:', (verify.tagCount || 0) + '개');
    
    const saved = verify.title && verify.compCount > 2 && (verify.tagCount || 0) >= 20;
    console.log(`\n${saved ? '✅ 정상 저장됨! 발행만 누르세요!' : '❌ 저장 실패 — 다시 시도 필요'}`);
    
    await checkPage.close();
  } else {
    console.log('\n❌ 제목 없음 → 중단');
  }
  
  await b.close();
})();

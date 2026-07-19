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
  await sleep(8000);
  
  console.log('=== 라이브커머스 포스팅 등록 ===\n');
  
  // 1. 제목
  console.log('[1] 제목 설정...');
  const titleResult = await page.evaluate(t => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentTitle(t);
      return SmartEditor._editors['blogpc001'].getDocumentTitle();
    } catch(e) { return '❌ ' + e.message; }
  }, TITLE);
  console.log('  제목:', titleResult.substring(0, 60) + '...');
  await sleep(500);
  
  // 2. 본문 HTML 붙여넣기 (clipboard + Ctrl+V)
  console.log('[2] 본문 붙여넣기...');
  const htmlRaw = fs.readFileSync(path.join(WORKSPACE, 'blog_body_live.html'), 'utf-8');
  const m = htmlRaw.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = m ? m[1].trim() : htmlRaw;
  
  const pasteResult = await page.evaluate(async (h) => {
    try {
      const htmlBlob = new Blob([h], { type: 'text/html' });
      const textBlob = new Blob([''], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
      return 'clipboard OK';
    } catch(e) { return 'clipboard ERR: ' + e.message; }
  }, bodyContent);
  console.log('  clipboard:', pasteResult);
  await sleep(500);
  
  await page.keyboard.press('Control+v');
  await sleep(3000);
  console.log('  Ctrl+V 완료');
  
  // 3. 이미지 업로드
  console.log('[3] 이미지 업로드...');
  await page.evaluate(() => {
    const btn = document.querySelector('.se-image-toolbar-button');
    if (btn) { btn.click(); return true; }
    return false;
  });
  await sleep(2000);
  
  // 사진 버튼 클릭 (팝업 내)
  const imgPos = await page.evaluate(() => {
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
  
  if (imgPos) {
    const fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    await page.mouse.click(imgPos.x, imgPos.y);
    await sleep(1500);
    const fc = await fcP;
    if (fc) {
      await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
      await sleep(5000);
      console.log('  이미지 업로드 완료:', IMAGES.length + '장');
    } else {
      console.log('  ⚠️ filechooser 이벤트 없음');
    }
  } else {
    console.log('  ⚠️ 사진 버튼 못 찾음');
  }
  
  // 4. 해시태그
  console.log('[4] 해시태그...');
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
  await sleep(1500);
  
  // 5. 저장 전 상태 확인
  console.log('\n=== 저장 전 상태 ===');
  const beforeSave = await page.evaluate(() => {
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
  console.log('  제목:', beforeSave.title ? beforeSave.title.substring(0, 50) + '... ✅' : '❌');
  console.log('  컴포넌트:', beforeSave.compCount + '개');
  console.log('  해시태그:', (beforeSave.tagCount || 0) + '개');
  
  // 6. 저장
  if (beforeSave.title && beforeSave.compCount > 2) {
    console.log('\n[5] 저장 진행...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
    });
    await sleep(8000);
    
    const afterSave = await page.evaluate(() => {
      const r = {};
      try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { r.title = ''; }
      const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
      r.toast = els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' | ') : '없음';
      return r;
    });
    
    console.log('\n=== 저장 완료 ===');
    console.log('  제목:', afterSave.title?.substring(0, 50));
    console.log('  토스트:', afterSave.toast);
    console.log('\n✅ 임시저장 완료!');
    console.log('📌 발행은 정이사님께서 직접 해주세요.');
  } else {
    console.log('\n❌ 상태 불완전 → 저장 안 함');
    console.log('  제목 또는 본문이 비어있음');
  }
  
  await b.close();
})().catch(e => console.error('❌ 오류:', e.message));

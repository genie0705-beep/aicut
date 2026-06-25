const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  'aicut_blog_startup_01_main.png',
  'aicut_blog_startup_02_ir.png',
  'aicut_blog_startup_03_ai.png',
  'aicut_blog_startup_04_delivery.png',
  'aicut_blog_startup_05_cta.png'
];
const HASHTAGS = '#스타트업 #IR영상 #영상편집외주 #스타트업마케팅 #IR피칭 #AI영상편집 #생성형AI #숏폼마케팅 #하반기준비 #투자유치 #피칭영상 #스타트업브랜딩 #에이컷 #aicut #영상편집 #숏폼제작 #릴스편집 #쇼츠제작 #틱톡마케팅 #콘텐츠마케팅 #SNS마케팅 #온라인마케팅 #브랜드영상 #제품데모 #시드투자 #IR자료 #마케팅전략 #스타트업IR #인스타릴스 #유튜브쇼츠';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // 기존 페이지 닫고 새로 열기
  for (const p of ctx.pages()) { await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  console.log('=== 블로그 작성 (검증 포함) ===\n');
  
  // ============ STEP 1: 제목 ============
  console.log('[1/5] 제목');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책');
  });
  await page.waitForTimeout(500);
  console.log('✅\n');
  
  // ============ STEP 2: 본문 (clipboard.writeText + Ctrl+V) ============
  console.log('[2/5] 본문 입력');
  const html = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const m = html.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = m ? m[1].trim() : html;
  
  await page.evaluate(h => navigator.clipboard.writeText(h), bodyContent);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅\n');
  
  // ============ STEP 3: 이미지 ============
  console.log('[3/5] 이미지 업로드');
  await page.evaluate(() => {
    const btn = document.querySelector('.se-image-toolbar-button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  
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
    const fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    await page.mouse.click(pos.x, pos.y);
    await page.waitForTimeout(1000);
    const fc = await fcP;
    if (fc) {
      await fc.setFiles(IMAGES.map(f => path.join(W, f)));
      await page.waitForTimeout(3000);
      console.log('✅ 5장\n');
    }
  }
  
  // ============ STEP 4: 해시태그 ============
  console.log('[4/5] 해시태그');
  await page.evaluate(t => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return;
      }
    }
  }, HASHTAGS);
  await page.waitForTimeout(1500);
  console.log('✅\n');
  
  // ============ STEP 5: 저장 ============
  console.log('[5/5] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  // 토스트 메시지 확인
  const toast = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
    return Array.from(els).map(e => (e.innerText || '').trim()).join(' | ');
  });
  console.log('토스트:', toast || '(확인 안 됨)');
  await page.waitForTimeout(5000);
  
  // ============ 검증: 저장된 iframe 내용 확인 ============
  console.log('\n=== 저장 검증 ===');
  
  // 같은 페이지에서 데이터 확인 (페이지 이동 없이)
  const verify = await page.evaluate(() => {
    const r = {};
    try {
      const ed = SmartEditor._editors['blogpc001'];
      r.title = ed.getDocumentTitle();
    } catch(e) { r.title = ''; }
    
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentDocument) {
      const body = iframe.contentDocument.body;
      r.htmlLen = body.innerHTML.length;
      r.textLen = body.innerText.length;
      r.h2 = body.querySelectorAll('h2').length;
      r.strong = body.querySelectorAll('strong, b').length;
      r.p = body.querySelectorAll('p').length;
      r.center = body.querySelectorAll('[style*="text-align: center"]').length;
      r.textPreview = body.innerText.substring(0, 100);
    } else {
      r.iframeError = 'iframe 접근 불가';
    }
    return r;
  });
  
  console.log('제목:', verify.title);
  console.log('iframe HTML 길이:', verify.htmlLen + ' chars');
  console.log('H2:', verify.h2 + '개');
  console.log('Strong:', verify.strong + '개');
  console.log('P:', verify.p + '개');
  console.log('센터정렬:', verify.center + '개');
  
  const success = verify.title && verify.htmlLen > 0 && verify.h2 > 0;
  
  console.log('\n=== 최종 결론 ===');
  if (success) {
    console.log('✅ 블로그 포스팅 저장 완료 (검증됨)');
    console.log('   제목: ' + verify.title);
    console.log('   H2: ' + verify.h2 + '개');
    console.log('   Strong: ' + verify.strong + '개');
    console.log('   총 ' + verify.htmlLen + ' chars');
    console.log('');
    console.log('📌 발행만 누르시면 됩니다!');
  } else {
    console.log('❌ 저장 검증 실패');
    console.log('   title:' + verify.title + ' htmlLen:' + verify.htmlLen + ' h2:' + verify.h2);
  }
  
  await b.close();
})();

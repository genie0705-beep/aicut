const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const TITLE = 'IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책';
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
  
  // 기존 에디터 닫고 새로 열기
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  console.log('=== clipboard.write 방식 (text/html) ===\n');
  
  // 1. 제목
  console.log('[1] 제목');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  await page.waitForTimeout(500);
  
  // 2. 본문 - clipboard.write()로 text/html 형식
  console.log('[2] 본문 (clipboard.write text/html)');
  const html = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const m = html.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = m ? m[1].trim() : html;
  
  await page.evaluate(async (h) => {
    const htmlBlob = new Blob([h], { type: 'text/html' });
    const textBlob = new Blob([''], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
    ]);
  }, bodyContent);
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  
  // 3. 이미지
  console.log('[3] 이미지');
  await page.evaluate(() => { const btn = document.querySelector('.se-image-toolbar-button'); if (btn) btn.click(); });
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
    if (fc) { await fc.setFiles(IMAGES.map(f => path.join(W, f))); await page.waitForTimeout(3000); }
  }
  
  // 4. 해시태그 (Enter 이벤트 포함)
  console.log('[4] 해시태그');
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
  
  // === 저장 전 상태 확인 ===
  const beforeSave = await page.evaluate(() => {
    const r = {};
    try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { r.title = ''; }
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      const comps = d.document ? d.document.components : [];
      r.compCount = comps.length;
      r.compDetail = comps.map((c, i) => {
        const info = { idx: i, type: c.type || c['@ctype'] };
        if (c.value) info.paraCount = c.value.length;
        return info;
      });
    } catch(e) { r.getDataError = e.message; }
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentDocument) {
      const body = iframe.contentDocument.body;
      r.iframeLen = body.innerHTML.length;
      r.iframeTextPreview = body.innerText.substring(0, 80);
    } else { r.iframeError = '접근불가'; }
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) { r.tagCount = inp.value.split('#').filter(t => t.trim().length > 0).length; }
    }
    return r;
  });
  
  console.log('\n=== 저장 전 상태 ===');
  console.log('제목:', beforeSave.title ? '"' + beforeSave.title + '" ✅' : '❌');
  console.log('컴포넌트:', beforeSave.compCount + '개');
  if (beforeSave.compDetail) beforeSave.compDetail.forEach(d => console.log(`  [${d.idx}] ${d.type} ${d.paraCount ? '(' + d.paraCount + ' paragraphs)' : ''}`));
  console.log('iframe:', beforeSave.iframeLen > 0 ? beforeSave.iframeLen + ' chars ✅' : '0 chars');
  if (beforeSave.iframeTextPreview) console.log('  미리보기:', beforeSave.iframeTextPreview);
  console.log('해시태그:', beforeSave.tagCount + '개');
  
  const ready = beforeSave.title && beforeSave.compCount > 2 && beforeSave.tagCount >= 30;
  console.log('\n저장 가능?', ready ? '✅ 저장 진행' : '❌ 문제 있음');
  
  if (ready) {
    // 5. 저장
    console.log('\n[5] 저장');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) { if ((btn.innerText || '').trim() === '저장') { btn.click(); return; } }
    });
    await page.waitForTimeout(8000);
    
    // 저장 후 최종 확인
    const afterSave = await page.evaluate(() => {
      const r = {};
      try { r.title = SmartEditor._editors['blogpc001'].getDocumentTitle(); } catch(e) { r.title = ''; }
      try {
        const d = SmartEditor._editors['blogpc001'].getDocumentData();
        r.compCount = d.document ? d.document.components.length : 0;
      } catch(e) { r.dataError = e.message; }
      const els = document.querySelectorAll('[class*="toast"], [class*="Toast"]');
      r.toast = els.length > 0 ? Array.from(els).map(e => (e.innerText || '').trim()).join(' | ') : '없음';
      return r;
    });
    
    console.log('\n=== 저장 완료 ===');
    console.log('제목:', afterSave.title);
    console.log('컴포넌트:', afterSave.compCount + '개');
    console.log('토스트:', afterSave.toast);
    console.log('\n✅ 저장 완료. 발행만 누르시면 됩니다.');
  } else {
    console.log('\n❌ 저장 전 상태가 불완전하여 저장하지 않음');
  }
  
  await b.close();
})();

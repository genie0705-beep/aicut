const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  
  // 모든 페이지 확인
  const pages = ctx.pages();
  console.log('=== 현재 열린 페이지 ===');
  pages.forEach((p, i) => console.log(`[${i}] ${p.url()}`));
  
  // PostWriteForm 찾기
  let page = pages.find(p => p.url().includes('PostWriteForm'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  }
  
  // === 모든 팝업/모달/다이얼로그 분석 ===
  console.log('\n=== 팝업/모달 분석 ===');
  const popups = await page.evaluate(() => {
    const results = [];
    
    // 모든 visible 요소 스캔
    const allEls = document.querySelectorAll('*');
    const popupKeywords = ['toast', 'modal', 'popup', 'dialog', 'overlay', 'alert', 'confirm', 'layer', 'snackbar', 'message'];
    
    allEls.forEach(el => {
      const cls = String(el.className || '').toLowerCase();
      const id = String(el.id || '').toLowerCase();
      const tag = el.tagName;
      
      // 팝업 관련 클래스/id가 있는지
      const matched = popupKeywords.some(k => cls.includes(k) || id.includes(k));
      
      if (matched) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          results.push({
            tag,
            class: cls.substring(0, 50),
            id: el.id,
            text: (el.innerText || '').trim().substring(0, 80),
            pos: `${Math.round(r.x)},${Math.round(r.y)} ${r.width}x${r.height}`,
            visible: r.width > 0 && r.height > 0
          });
        }
      }
    });
    
    return results;
  });
  
  if (popups.length === 0) {
    console.log('팝업/모달 없음');
  } else {
    console.log(`발견된 팝업 요소: ${popups.length}개`);
    popups.forEach((p, i) => {
      console.log(`\n[${i}] ${p.tag}.${p.class}`);
      console.log(`  text: "${p.text}"`);
      console.log(`  pos: ${p.pos}`);
    });
  }
  
  // === 모든 버튼 분석 (팝업 버튼 찾기) ===
  console.log('\n=== 모든 visible 버튼 ===');
  const btns = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('button').forEach(b => {
      const r = b.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        results.push({
          text: (b.innerText || '').trim().substring(0, 30),
          class: String(b.className || '').substring(0, 40),
          pos: `${Math.round(r.x)},${Math.round(r.y)} ${r.width}x${r.height}`
        });
      }
    });
    return results;
  });
  
  btns.forEach((b, i) => console.log(`  [${i}] "${b.text}" | class:${b.class} | pos:${b.pos}`));
  
  // === 저장 상태 확인 ===
  console.log('\n=== 저장 상태 ===');
  const state = await page.evaluate(() => {
    const r = {};
    try {
      const ed = SmartEditor._editors['blogpc001'];
      r.title = ed.getDocumentTitle();
      const d = ed.getDocumentData();
      r.comps = d.document ? d.document.components.length : 0;
    } catch(e) { r.error = e.message; }
    return r;
  });
  console.log('제목:', state.title);
  console.log('컴포넌트:', state.comps + '개');
  
  // 스크린샷
  const fs = require('fs');
  await page.screenshot({ path: 'C:\\Users\\paul\\.openclaw\\workspace\\blog_popup_check.png', fullPage: true });
  console.log('\n✅ 스크린샷 저장: blog_popup_check.png');
  
  await b.close();
})();

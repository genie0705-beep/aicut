const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // PostWriteForm 탭 찾기
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await new Promise(r => setTimeout(r, 6000));
  }
  
  console.log('=== PostWriteForm 팝업 분석 ===\n');
  
  // 모든 요소의 innerText 색인
  const allTexts = await page.evaluate(() => {
    const result = [];
    const all = document.querySelectorAll('*');
    all.forEach(el => {
      const t = (el.innerText || '').trim();
      if (t.length > 0 && t.length < 20) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          result.push({
            text: t,
            tag: el.tagName,
            cls: (el.className || '').substring(0, 50),
            visible: el.offsetParent !== null,
            rect: { w: Math.round(rect.width), h: Math.round(rect.height) }
          });
        }
      }
    });
    return result;
  });
  
  console.log('화면에 보이는 텍스트 요소들:');
  const seen = new Set();
  allTexts.forEach(item => {
    if (!seen.has(item.text) && item.visible) {
      seen.add(item.text);
      console.log(`  "${item.text}" | <${item.tag}> | ${item.cls} | ${item.rect.w}x${item.rect.h}`);
    }
  });
  
  // "아니오" 또는 "취소" 버튼 상세 분석
  console.log('\n--- "아니오"/"취소" 버튼 상세 검색 ---');
  const btnInfo = await page.evaluate(() => {
    const result = [];
    const all = document.querySelectorAll('span, button, a, div, li');
    all.forEach(el => {
      const t = (el.innerText || '').trim();
      if (t === '아니오' || t === '취소') {
        const rect = el.getBoundingClientRect();
        const computed = window.getComputedStyle(el);
        result.push({
          text: t,
          tag: el.tagName,
          cls: (el.className || '').substring(0, 60),
          id: el.id || '',
          visible: computed.display !== 'none' && computed.visibility !== 'hidden',
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          parentTag: el.parentElement?.tagName || '',
          parentCls: (el.parentElement?.className || '').substring(0, 40),
        });
      }
    });
    return result;
  });
  
  if (btnInfo.length > 0) {
    console.log('찾은 버튼:');
    btnInfo.forEach(b => console.log(`  ${b.text} | <${b.tag}> | visible:${b.visible} | (${b.rect.x},${b.rect.y}) ${b.rect.w}x${b.rect.h} | ${b.cls}`));
  } else {
    console.log('❌ "아니오" 또는 "취소" 버튼을 찾을 수 없음');
    
    // 모든 버튼 텍스트 출력
    const allBtns = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a')).map(b => ({
        text: (b.innerText || '').trim().substring(0, 20),
        visible: b.offsetParent !== null,
        cls: (b.className || '').substring(0, 30)
      })).filter(b => b.text.length > 0);
    });
    console.log('\n현재 페이지의 모든 버튼:');
    allBtns.forEach(b => console.log(`  [${b.visible ? 'V' : 'H'}] "${b.text}" | ${b.cls}`));
    
    // 팝업/레이어/모달 분석
    const layers = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('[class*="layer"], [class*="modal"], [class*="popup"], [class*="dialog"], [class*="alert"], [class*="cover"]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const computed = window.getComputedStyle(el);
          result.push({
            cls: el.className.substring(0, 60),
            visible: computed.display !== 'none',
            rect: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            zIndex: computed.zIndex,
            children: el.querySelectorAll('button, a, span').length
          });
        }
      });
      return result;
    });
    console.log('\n레이어/모달 요소:');
    layers.forEach(l => console.log(`  ${l.cls} | visible:${l.visible} | ${l.rect} | z:${l.zIndex} | children:${l.children}`));
  }
  
  await b.close();
})();

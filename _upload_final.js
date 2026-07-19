const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  'aicut_blog_live_main.png',
  'aicut_blog_live_card1.png',
  'aicut_blog_live_card2.png',
  'aicut_blog_live_card3.png',
  'aicut_blog_live_cta.png'
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  for (const p of ctx.pages()) {
    p.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  }
  
  // PostWriteForm 새로 열기
  for (const p of ctx.pages().filter(p => p.url().includes('PostWriteForm'))) await p.close().catch(() => {});
  await sleep(500);
  
  const page = await ctx.newPage();
  page.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  console.log('🔧 이미지 업로드 (floating 버튼 방식)\n');
  
  // Dialog 자동 처리
  await page.evaluate(() => {
    // se-floating-category-button-photo 버튼 찾기
    const fpBtn = document.querySelector('.se-floating-category-button-photo');
    if (fpBtn && fpBtn.offsetParent !== null) {
      const r = fpBtn.getBoundingClientRect();
      return { found: true, x: r.x, y: r.y, w: r.width, h: r.height };
    }
    return { found: false };
  });
  
  // 여러 방법 시도
  let uploaded = false;
  
  // 방법 1: floating photo 버튼 클릭
  console.log('방법 1: floating photo 버튼 클릭...');
  const fcP1 = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);
  
  await page.evaluate(() => {
    const btn = document.querySelector('.se-floating-category-button-photo');
    if (btn && btn.offsetParent !== null) { btn.click(); return true; }
    return false;
  });
  await sleep(2000);
  
  let fc = await fcP1;
  if (fc) { uploaded = true; }
  
  // 방법 2: se-image-toolbar-button → 사진 메뉴 (정확한 순서로)
  if (!uploaded) {
    console.log('방법 2: 툴바 → 사진 메뉴...');
    
    // 툴바 버튼 클릭
    await page.evaluate(() => {
      const btn = document.querySelector('.se-image-toolbar-button');
      if (btn && btn.offsetParent !== null) { btn.click(); return true; }
      return false;
    });
    await sleep(2000);
    
    // 팝업 메뉴에서 "사진" 버튼 (display/visibility 체크)
    const photoBtnVisible = await page.evaluate(() => {
      const menuPanel = document.querySelector('.se-insert-menu-panel');
      if (menuPanel) {
        // panel이 보이는지
        const panelStyle = window.getComputedStyle(menuPanel);
        if (panelStyle.display !== 'none') {
          const items = menuPanel.querySelectorAll('.se-insert-menu-item, .se-insert-menu-button, button, li');
          for (const item of items) {
            const t = (item.innerText || '').trim();
            if (t === '사진' || t.startsWith('사진')) {
              const style = window.getComputedStyle(item);
              return { visible: style.display !== 'none' && style.visibility !== 'hidden', tag: item.tagName, cls: (item.className || '').substring(0, 30) };
            }
          }
          return 'panel visible but no photo item';
        }
        return 'panel not visible';
      }
      return 'no panel';
    });
    console.log('  메뉴 상태:', JSON.stringify(photoBtnVisible));
    
    if (photoBtnVisible && photoBtnVisible.visible === true) {
      const fcP2 = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
      
      await page.evaluate(() => {
        const menuPanel = document.querySelector('.se-insert-menu-panel');
        const items = menuPanel.querySelectorAll('.se-insert-menu-item, .se-insert-menu-button, button, li');
        for (const item of items) {
          const t = (item.innerText || '').trim();
          if (t === '사진' || t.startsWith('사진')) {
            const style = window.getComputedStyle(item);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              item.click();
              return true;
            }
          }
        }
        // 강제 클릭
        const spans = menuPanel.querySelectorAll('span');
        for (const s of spans) {
          if (s.innerText?.trim() === '사진') {
            s.closest('button, li, [role="menuitem"]')?.click();
            return true;
          }
        }
        return false;
      });
      await sleep(2000);
      
      fc = await fcP2;
      if (fc) uploaded = true;
    } else {
      // insert-menu-button 직접 클릭
      const fcP2b = page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
      await page.evaluate(() => {
        const btn = document.querySelector('.se-insert-menu-button');
        if (btn) { btn.click(); return true; }
        return false;
      });
      await sleep(2000);
      fc = await fcP2b;
      if (fc) uploaded = true;
    }
  }
  
  // 방법 3: 직접 input[type=file] 생성
  if (!uploaded) {
    console.log('방법 3: input[type=file] 동적 생성...');
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();
    });
    await sleep(2000);
    
    const fcP3 = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);
    fc = await fcP3;
    if (fc) {
      uploaded = true;
      console.log('  ✅ 동적 생성 성공');
    }
  }
  
  // 방법 4: 에디터 iframe 내부에 img 직접 삽입
  if (!uploaded) {
    console.log('방법 4: iframe 직접 img 삽입...');
    const imgResult = await page.evaluate((files) => {
      const iframes = document.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc && doc.body) {
            const seModules = doc.querySelectorAll('[class*="se-module"]');
            return { iframeBodyLen: doc.body.innerHTML.length, seModules: seModules.length };
          }
        } catch(e) {}
      }
      return 'no iframe access';
    }, IMAGES);
    console.log('  iframe:', JSON.stringify(imgResult));
  }
  
  // ===== 파일 업로드 =====
  if (fc) {
    const fullPaths = IMAGES.map(f => path.join(WORKSPACE, f));
    console.log('\n📤 파일 업로드 중...');
    await fc.setFiles(fullPaths);
    await sleep(10000);
    console.log('  ✅ 이미지 5장 업로드 완료!');
    
    // 제목 설정
    await page.evaluate(t => {
      try { SmartEditor._editors['blogpc001'].setDocumentTitle(t); } catch(e) {}
    }, 'C-커머스 시대, 라이브 다시보기 편집 하나로 전환율 2.1% 올린 쇼핑몰의 비결');
    
    // 저장
    console.log('\n💾 저장 중...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
      }
    });
    await sleep(8000);
    
    console.log('\n✅ 모든 작업 완료!');
  } else {
    console.log('\n❌ 모든 방법 실패');
    console.log('📌 정이사님, 에디터 오른쪽에 떠있는 📷 포토 버튼을 클릭하시면');
    console.log('   이미지 업로드 창이 열립니다. 거기서 5개 파일 선택해주세요!');
  }
  
  await b.close();
})().catch(e => console.error('❌ 오류:', e.message));

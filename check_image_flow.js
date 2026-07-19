const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  
  if (!write) { console.log('❌ No write tab'); process.exit(1); }
  
  const fe = await write.$('#mainFrame');
  if (!fe) { console.log('❌ No iframe'); process.exit(1); }
  const f = await fe.contentFrame();
  if (!f) { console.log('❌ No frame'); process.exit(1); }

  // 팝업 구조 분석
  const popupStructure = await f.evaluate(() => {
    // 현재 표시된 popup 레이어 찾기
    const layers = document.querySelectorAll('.se-popup, [class*="se-layer"], [class*="se-popup-"]');
    const result = [];
    
    layers.forEach(l => {
      const style = getComputedStyle(l);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        result.push({
          className: l.className.substring(0, 100),
          display: style.display,
          innerText: l.innerText.substring(0, 200),
          buttons: Array.from(l.querySelectorAll('button, a, [role="button"], span.button, .se-btn, input[type="button"]')).map(b => ({
            text: (b.innerText || b.value || '').substring(0, 40),
            tag: b.tagName,
            cls: (b.className || '').substring(0, 40),
          })),
          inputs: Array.from(l.querySelectorAll('input')).map(i => ({
            type: i.type,
            accept: i.accept,
            style: i.style.display,
          })),
        });
      }
    });

    // 숨겨진 file input 찾기
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInfo = Array.from(fileInputs).map(fi => ({
      id: fi.id,
      accept: fi.accept,
      multiple: fi.multiple,
      display: getComputedStyle(fi).display,
      parentCls: (fi.parentElement?.className || '').substring(0, 50),
      rect: fi.getBoundingClientRect(),
    }));
    
    // 모든 input 요소
    const allInputs = document.querySelectorAll('input');
    const allInputInfo = Array.from(allInputs).filter(i => i.type !== 'hidden').map(i => ({
      type: i.type,
      id: i.id,
      cls: (i.className || '').substring(0, 40),
      display: getComputedStyle(i).display,
    }));
    
    return { visibleLayers: result, fileInputs: fileInfo, visibleInputs: allInputInfo };
  });

  console.log('팝업 구조:', JSON.stringify(popupStructure, null, 2));
  
  // 이미지 업로드 순서 확인: 사진 버튼 → 파일 선택 → 업로드
  console.log('\n--- 사진 버튼 클릭 → 팝업 확인 ---');
  
  // 사진 버튼 클릭
  await f.evaluate(() => {
    document.querySelector('.se-image-toolbar-button')?.click();
  });
  await f.waitForTimeout(2000);

  const afterClick = await f.evaluate(() => {
    // popup 확인
    const popups = document.querySelectorAll('[class*="se-popup"]');
    const visiblePopups = [];
    popups.forEach(p => {
      const style = getComputedStyle(p);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        visiblePopups.push({
          text: p.innerText.substring(0, 300),
          className: p.className.substring(0, 80),
          btnText: Array.from(p.querySelectorAll('button, a, [role="button"]')).slice(0,5).map(b => (b.innerText||'').substring(0,30)),
        });
      }
    });
    
    // file input
    const fi = document.querySelector('input[type="file"]');
    const fiInfo = fi ? {
      id: fi.id, accept: fi.accept, display: getComputedStyle(fi).display,
      parentText: (fi.parentElement?.innerText || '').substring(0, 100),
      closestBtn: fi.closest('button')?.innerText?.substring(0,30),
    } : '없음';
    
    // '내 PC' / '파일선택' 버튼 찾기
    const pcBtn = document.querySelector('[class*="tab"],[class*="btn"],[class*="button"]')?.innerText?.substring(0,50);
    
    return { visiblePopups, fileInput: fiInfo };
  });

  console.log('사진 버튼 클릭 후:', JSON.stringify(afterClick, null, 2));

  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

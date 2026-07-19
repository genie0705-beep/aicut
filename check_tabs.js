const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  const write = pages.find(p => p.url().includes('Redirect=Write'));
  const fe = await write.$('#mainFrame');
  const f = await fe.contentFrame();

  // 사진 버튼 클릭
  await f.evaluate(() => document.querySelector('.se-image-toolbar-button')?.click());
  await f.waitForTimeout(2000);

  // 모든 보이는 요소 분석
  const info = await f.evaluate(() => {
    // 모든 버튼과 탭 찾기
    const allButtons = Array.from(document.querySelectorAll('button, a, [role="button"], .se-btn, [tabindex]'))
      .filter(el => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      })
      .map(el => ({
        tag: el.tagName,
        text: (el.innerText || '').trim().substring(0, 30),
        cls: (el.className || '').substring(0, 50),
        role: el.getAttribute('role'),
        id: el.id,
      }));
    
    // 현재 활성 탭 확인
    const activeTabs = document.querySelectorAll('[class*="active"], [class*="selected"], [aria-selected="true"]');
    const activeTabInfo = Array.from(activeTabs).filter(el => {
      const style = getComputedStyle(el);
      return style.display !== 'none';
    }).map(el => ({
      text: (el.innerText || '').trim().substring(0, 50),
      cls: (el.className || '').substring(0, 60),
    }));
    
    // file input 상태
    const fi = document.querySelector('#hidden-file, input[type="file"]');
    const fiInfo = fi ? {
      id: fi.id,
      display: getComputedStyle(fi).display,
      parentTag: fi.parentElement?.tagName,
      parentCls: (fi.parentElement?.className || '').substring(0, 60),
      prevSibText: (fi.previousElementSibling?.innerText || '').substring(0, 40),
    } : '없음';
    
    // 이미지 업로드 레이어 구조
    const layers = document.querySelectorAll('[class*="flayer"], [class*="lyr"], [class*="layer"]');
    const layerInfo = Array.from(layers).filter(l => {
      const s = getComputedStyle(l);
      return s.display !== 'none' && s.visibility !== 'hidden';
    }).map(l => ({
      cls: (l.className || '').substring(0, 80),
      id: l.id,
      innerText: (l.innerText || '').substring(0, 200),
    }));
    
    return { allButtons: allButtons.slice(0, 30), activeTabs: activeTabInfo, fileInput: fiInfo, layers: layerInfo };
  });

  console.log('보이는 버튼들:', JSON.stringify(info.allButtons, null, 2));
  console.log('\n활성 탭:', JSON.stringify(info.activeTabs, null, 2));
  console.log('\nfile input:', JSON.stringify(info.fileInput, null, 2));
  console.log('\n레이어:', JSON.stringify(info.layers, null, 2));

  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

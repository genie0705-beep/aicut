const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';

async function waitForSE(page) {
  for (let i = 0; i < 20; i++) {
    const fe = await page.$('#mainFrame');
    if (fe) {
      const f = await fe.contentFrame();
      if (f) {
        try {
          const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
          if (ok) return f;
        } catch(e) { /* retry */ }
      }
    }
    await page.waitForTimeout(1500);
  }
  return null;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.accept(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  // 팝업 제거
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);
  
  // 1. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목 설정');

  // 2. contentEditable 찾아서 포커스
  const ceInfo = await f.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return { found: false };
    
    ce.focus();
    ce.click();
    
    // Focus 이벤트
    ce.dispatchEvent(new Event('focus', { bubbles: true }));
    ce.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    return { 
      found: true, 
      tag: ce.tagName,
      id: ce.id,
      cls: ce.className.substring(0, 40),
      parentCls: ce.parentElement?.className?.substring(0, 40),
    };
  });
  console.log('contentEditable:', JSON.stringify(ceInfo));
  
  if (!ceInfo.found) { console.log('❌ contentEditable 없음'); process.exit(1); }
  
  // 3. execCommand insertHTML 테스트
  const testResult = await f.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return 'no ce';
    
    ce.focus();
    // Select all existing content
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ce);
    sel.removeAllRanges();
    sel.addRange(range);
    
    // Try insertHTML
    const result1 = document.execCommand('insertHTML', false, '<p><b>테스트 문단입니다.</b> 잘 보이나요?</p>');
    
    // Dispatch input event
    ce.dispatchEvent(new Event('input', { bubbles: true }));
    
    return { 
      execResult: result1,
      innerHTML: ce.innerHTML.substring(0, 100),
      innerText: ce.innerText.substring(0, 50),
    };
  });
  console.log('insertHTML 테스트:', JSON.stringify(testResult));
  
  await f.waitForTimeout(1000);
  
  // 데이터 모델 확인
  const check = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const d = data.document;
    const canvas = document.querySelector('.se-canvas');
    const result = {};
    
    result.title = ed.getDocumentTitle();
    result.docKeys = Object.keys(d);
    result.canvasText = (canvas?.innerText || '').substring(0, 100);
    result.canvasTextLen = (canvas?.innerText || '').length;
    
    if (d.blocks) {
      result.blocks = d.blocks.length;
      result.firstBlocks = d.blocks.slice(0,3).map(b => ({ type: b.type, text: (b.text || '').substring(0, 40) }));
    }
    
    return result;
  });
  console.log('\n📊 확인:', JSON.stringify(check, null, 2));
  
  if (check.canvasTextLen > 5) {
    console.log('\n✅ contentEditable 입력 성공!');
  } else {
    console.log('\n❌ 입력 실패');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

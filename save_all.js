const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';

// 우선: 탭 10에 이미 52블록 1853자 데이터가 있음.
// React가 덮어쓰기 전에 HTML 주입 + 저장을 즉시 실행

async function setCanvasAndSave(frame) {
  return await frame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const blocks = d.blocks;
    if (!blocks || blocks.length === 0) return { error: 'no blocks' };
    
    const canvas = document.querySelector('.se-canvas');
    if (!canvas) return { error: 'no canvas' };
    
    // 팝업 제거
    document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove());
    
    // Wrap 생성
    let wrap = canvas.querySelector('.se-components-wrap');
    if (!wrap) {
      wrap = document.createElement('article');
      wrap.className = 'se-components-wrap';
      canvas.prepend(wrap);
    }
    
    // HTML 생성
    let html = '';
    blocks.forEach(b => {
      const t = b.text || '';
      if (b.type === 'heading2') {
        html += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><h2 style="text-align:center;">${t}</h2></div></div></div></div>`;
      } else if (b.type === 'paragraph') {
        const content = t ? t : '<br>';
        html += `<div class="se-component se-text"><div class="se-component-content"><div class="se-section se-section-text se-l-default"><div class="se-module se-module-text"><p style="text-align:center;">${content}</p></div></div></div></div>`;
      }
    });
    
    wrap.innerHTML = html;
    
    // 즉시 저장 버튼 찾아서 클릭
    const saveBtn = document.querySelector('.save_btn__bzc5B');
    if (saveBtn) {
      saveBtn.click();
      return { saved: true, chars: blocks.reduce((a,b) => a + (b.text?.length||0), 0), injected: html.length };
    }
    
    // 대체 저장 버튼
    document.querySelectorAll('button').forEach(b => {
      if (b.innerText.includes('저장')) b.click();
    });
    
    return { saved: 'alternative', chars: blocks.reduce((a,b) => a + (b.text?.length||0), 0) };
  });
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // 1. 탭 10 저장 시도
  console.log('🔍 탭 10 저장 시도...');
  try {
    const p10 = pages[10];
    const f10 = await (await p10.$('#mainFrame')).contentFrame();
    const r10 = await setCanvasAndSave(f10);
    console.log('탭 10 결과:', JSON.stringify(r10));
    
    if (r10.saved) {
      await f10.waitForTimeout(2000);
      const c = await f10.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        const d = ed.getDocumentData().document;
        const cvs = document.querySelector('.se-canvas');
        return {
          blocks: d.blocks?.length,
          chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
          canvasText: (cvs?.innerText || '').substring(0, 80),
          canvasTextLen: (cvs?.innerText || '').length,
        };
      });
      console.log('탭 10 저장 후:', JSON.stringify(c));
      if (c.canvasTextLen > 200) console.log('✅ 탭 10 성공!');
    }
  } catch(e) { console.log('탭 10 오류:', e.message); }
  
  // 2. 탭 0도 저장 (88블록)
  console.log('\n🔍 탭 0 저장 시도...');
  try {
    const p0 = pages[0];
    const f0 = await (await p0.$('#mainFrame')).contentFrame();
    const r0 = await setCanvasAndSave(f0);
    console.log('탭 0 결과:', JSON.stringify(r0));
    
    if (r0.saved) {
      await f0.waitForTimeout(2000);
      const c = await f0.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        const d = ed.getDocumentData().document;
        const cvs = document.querySelector('.se-canvas');
        return {
          blocks: d.blocks?.length,
          chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0),
          imgComps: d.components?.filter(x => x.fileName).length,
          canvasText: (cvs?.innerText || '').substring(0, 80),
          canvasTextLen: (cvs?.innerText || '').length,
        };
      });
      console.log('탭 0 저장 후:', JSON.stringify(c));
      if (c.canvasTextLen > 200) console.log('✅ 탭 0 성공!');
    }
  } catch(e) { console.log('탭 0 오류:', e.message); }
  
  // 3. 결과 요약
  const summary = [];
  for (let i = 0; i < pages.length; i++) {
    if (!pages[i].url().includes('Redirect=Write')) continue;
    try {
      const f = await (await pages[i].$('#mainFrame')).contentFrame();
      const info = await f.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        const d = ed.getDocumentData().document;
        const c = document.querySelector('.se-canvas');
        return {
          blocks: d.blocks?.length || 0,
          chars: d.blocks?.reduce((a,b) => a + (b.text?.length||0), 0) || 0,
          imgs: d.components?.filter(x => x.fileName).length || 0,
          canvasTextLen: (c?.innerText || '').length,
        };
      });
      summary.push({ tab: i, ...info });
    } catch(e) { /* skip */ }
  }
  
  console.log('\n📋 모든 탭 요약:');
  summary.forEach(s => {
    console.log(`  탭 ${s.tab}: 블록=${s.blocks} 자=${s.chars} 이미지=${s.imgs} 캔버스=${s.canvasTextLen}자`);
  });
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

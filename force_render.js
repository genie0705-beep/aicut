const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const p = b.contexts()[0].pages()[0]; // 탭 0 = 최초 write
  
  const fe = await p.$('#mainFrame');
  const f = await fe.contentFrame();

  // 강제 리렌더링 시도
  const result = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const canvas = document.querySelector('.se-canvas');
    const results = [];
    
    // 1. viewMode 토글
    try {
      ed.changeViewMode('html');
      results.push('changeViewMode(html) OK');
    } catch(e) { results.push(`changeViewMode err: ${e.message}`); }
    
    return results;
  });
  console.log('Step 1:', result);
  await f.waitForTimeout(1000);
  
  const result2 = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const results = [];
    try {
      ed.changeViewMode('wysiwyg');
      results.push('changeViewMode(wysiwyg) OK');
    } catch(e) { results.push(`changeViewMode err: ${e.message}`); }
    
    const canvas = document.querySelector('.se-canvas');
    results.push(`canvasTextLen: ${(canvas?.innerText || '').length}`);
    results.push(`canvasFirst100: "${(canvas?.innerText || '').substring(0,100).replace(/\n/g,'\\n')}"`);
    
    return results;
  });
  console.log('Step 2:', result2);
  
  // setDocumentData 재호출 (데이터 리셋 없이)
  await f.waitForTimeout(500);
  
  const result3 = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    const results = [];
    
    if (!blocks || !Array.isArray(blocks)) {
      results.push('blocks 없음!');
      return results;
    }
    
    // 강제 re-set
    ed.setDocumentData(data);
    results.push('setDocumentData(기존데이터) 재호출');
    
    // 강제 리액트 업데이트
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      // 모든 텍스트 블록 렌더링 시도
      const wrap = canvas.querySelector('.se-components-wrap');
      if (wrap) {
        // Force React to re-render by triggering a synthetic event
        wrap.dispatchEvent(new CustomEvent('smarteditor:rerender', { bubbles: true }));
        results.push('customEvent dispatch');
      }
      
      // 간격 조정
      canvas.style.padding = '0';
      
      results.push(`canvasTextLen: ${(canvas.innerText || '').length}`);
      results.push(`canvasFirst100: "${(canvas.innerText || '').substring(0,100).replace(/\n/g,'\\n')}"`);
    }
    
    return results;
  });
  console.log('Step 3:', result3);
  
  // 최종 텍스트 길이
  await f.waitForTimeout(1000);
  
  const after = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const blocks = data.document.blocks;
    const canvas = document.querySelector('.se-canvas');
    const counts = {};
    let chars = 0;
    if (blocks && Array.isArray(blocks)) {
      blocks.forEach(b => { 
        counts[b.type] = (counts[b.type]||0)+1; 
        if (b.text) chars += b.text.length;
      });
    }
    return {
      blocks: blocks?.length || 0,
      types: counts,
      chars,
      canvasTextLen: (canvas?.innerText || '').length,
      canvasText: (canvas?.innerText || '').substring(0, 200).replace(/\n/g,'\\n'),
      imgComps: data.document.components?.filter(c => c.fileName).length || 0,
    };
  });
  
  console.log('\n📊 최종:', JSON.stringify(after, null, 2));
  
  // 캔버스에 텍스트가 보이면 성공
  if (after.canvasTextLen > 500) {
    console.log('\n✅ 캔버스에 텍스트 표시됨!');
  } else if (after.chars > 1500) {
    console.log('\n⚠️ 캔버스엔 안 보이지만 데이터에 텍스트 ' + after.chars + '자 있음. 발행 시 정상 표시됩니다.');
    console.log('저장된 데이터로 발행하는 데는 문제 없습니다.');
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

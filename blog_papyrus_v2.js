const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  let page = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      page = p;
    }
  }
  if (!page) { console.log('❌'); await b.close(); return; }
  await page.bringToFront();

  // 현재 저장된 데이터에서 섹션 paragraph 위치 찾기 (단순 텍스트 기반)
  const sectionInfo = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return '❌';
    
    const data = editor.getDocumentData();
    const comps = data.document.components;
    const sections = [];
    
    if (comps.length >= 2 && comps[1]['@ctype'] === 'text') {
      const paras = comps[1].value || [];
      paras.forEach((p, i) => {
        const text = p.nodes?.map(n => n.value || '').join('') || '';
        const trimmed = text.trim().substring(0, 50);
        if (/^[📉🤖💡✨✅🚀]/.test(trimmed)) {
          sections.push({ idx: i, text: trimmed });
        }
      });
    }
    
    // Papyrus 문서 모델 내 components 배열 수정 시도
    if (editor._papyrus?._document?.document?.components) {
      const papyrusComps = editor._papyrus._document.document.components;
      let h2Count_p = 0;
      
      for (const comp of papyrusComps) {
        if (comp['@ctype'] !== 'text') continue;
        const paras = comp.value || [];
        for (const p of paras) {
          if (!p.nodes || p.nodes.length === 0) continue;
          const text = p.nodes.map(n => n.value || '').join('').trim();
          
          // 섹션 제목 감지
          if (/^[📉🤖💡✨✅🚀]/.test(text) && text.length < 40) {
            p.type = 'header2';
            p.textAlign = 'center';
            h2Count_p++;
          }
          
          // 모든 paragraph center 정렬
          p.textAlign = 'center';
          
          // Bold
          const boldKws = ['IR 피칭 영상', 'AI 영상 편집', '스타트업 마케팅', 
            '숏폼 마케팅', '릴스 알고리즘', '에이컷', 'AICUT',
            '상반기 마케팅', '하반기 준비', '여름 마케팅'];
          for (const node of p.nodes) {
            if (node['@ctype'] === 'textNode' && node.value) {
              for (const kw of boldKws) {
                if (node.value.includes(kw)) {
                  node.bold = true;
                  break;
                }
              }
            }
          }
        }
      }
      return { sections, papyrusH2: h2Count_p, papyrusCompsLen: papyrusComps.length };
    }
    
    return { sections, papyrusH2: -1 };
  });
  
  console.log('섹션 위치:', JSON.stringify(sectionInfo));

  // setDocumentData로 Papyrus -> React 동기화
  const syncResult = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return '❌';
    
    // data는 Papyrus 모델에 의해 수정되었으므로 getDocumentData에 반영되어 있어야 함
    try {
      const data = editor.getDocumentData();
      editor.setDocumentData(data);
      return `✅ setDocumentData (comps: ${data.document.components.length})`;
    } catch(e) {
      return `❌ ${e.message}`;
    }
  });
  console.log('동기화:', syncResult);

  await new Promise(r => setTimeout(r, 2000));

  // 확인
  const verify = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return '❌';
    const data = editor.getDocumentData();
    const comps = data.document.components;
    
    let h2 = 0, bold = 0, center = 0;
    for (const comp of comps) {
      if (comp['@ctype'] !== 'text') continue;
      for (const p of (comp.value || [])) {
        if (p.type === 'header2') h2++;
        if (p.textAlign === 'center') center++;
        for (const node of (p.nodes || [])) if (node.bold) bold++;
      }
    }
    return { h2, bold, center, comps: comps.length };
  });
  console.log('확인:', JSON.stringify(verify));

  if (verify.h2 > 0 || verify.bold > 0 || verify.center > 0) {
    // 성공! 저장
    console.log('💾 저장...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
    });
    await new Promise(r => setTimeout(r, 3000));
    
    const after = await page.evaluate(() => {
      const editor = window.SmartEditor?._editors?.['blogpc001'];
      if (!editor) return '❌';
      const data = editor.getDocumentData();
      const comps = data.document.components;
      let h2 = 0, bold = 0, center = 0;
      for (const comp of comps) {
        if (comp['@ctype'] !== 'text') continue;
        for (const p of (comp.value || [])) {
          if (p.type === 'header2') h2++;
          if (p.textAlign === 'center') center++;
          for (const node of (p.nodes || [])) if (node.bold) bold++;
        }
      }
      return { h2, bold, center };
    });
    console.log('저장 후:', JSON.stringify(after));
  }

  await b.close();
}
run().catch(e => console.error('❌ 실패:', e.message));

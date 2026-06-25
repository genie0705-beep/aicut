const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  // 가장 최근에 열린 PostWriteForm 탭 찾기
  let page = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      page = p;
    }
  }
  if (!page) {
    console.log('❌ PostWriteForm 탭 없음');
    await b.close();
    return;
  }
  await page.bringToFront();

  // Papyrus 내부 구조 탐색
  const papyrusInfo = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };

    const info = {};
    
    // _papyrus 객체
    if (editor._papyrus) {
      info.hasPapyrus = true;
      info.papyrusKeys = Object.keys(editor._papyrus).filter(k => !k.startsWith('_')).slice(0, 20);
      
      // _document 확인
      if (editor._papyrus._document) {
        const doc = editor._papyrus._document;
        info.docKeys = Object.keys(doc).filter(k => !k.startsWith('_')).slice(0, 20);
        
        // components 확인
        if (doc.components) {
          info.componentCount = doc.components.length;
          info.firstCompKeys = doc.components.length > 0 ? Object.keys(doc.components[0]).filter(k => !k.startsWith('_')) : [];
        }
      }
    }
    
    // 사용 가능한 메서드 목록
    info.methods = Object.getOwnPropertyNames(editor).filter(k => typeof editor[k] === 'function').slice(0, 30);
    
    // rawKeys
    info.allKeys = Object.keys(editor).filter(k => !k.startsWith('_')).slice(0, 30);

    return info;
  });

  console.log('=== Papyrus 구조 ===');
  console.log(JSON.stringify(papyrusInfo, null, 2));

  // _papyrus 메서드 더 깊이 탐색
  const methods = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor || !editor._papyrus) return {};
    
    const result = {};
    
    // callable methods on _papyrus
    const papyrusMethods = Object.getOwnPropertyNames(editor._papyrus)
      .filter(k => typeof editor._papyrus[k] === 'function')
      .slice(0, 20);
    result.papyrusMethods = papyrusMethods;
    
    // _papyrus._document methods
    if (editor._papyrus._document) {
      const docMethods = Object.getOwnPropertyNames(editor._papyrus._document)
        .filter(k => typeof editor._papyrus._document[k] === 'function')
        .slice(0, 20);
      result.docMethods = docMethods;
    }
    
    // 각 component의 keys
    if (editor._papyrus._document?.components?.length > 0) {
      const comp = editor._papyrus._document.components[0];
      result.firstCompFullKeys = Object.keys(comp);
      result.firstCompType = comp['@ctype'];
      
      if (comp.value && comp.value.length > 0) {
        const p = comp.value[0];
        result.firstParaKeys = Object.keys(p);
        result.firstParaCtype = p['@ctype'];
        result.firstParaType = p.type;
        result.firstParaLevel = p.level;
        result.firstParaTagName = p.tagName;
        result.firstParaTextAlign = p.textAlign;
      }
    }

    return result;
  });

  console.log('\n=== 메서드 & paragraph 구조 ===');
  console.log(JSON.stringify(methods, null, 2));

  // 현재 저장된 paragraph들을 H2/center로 수정하는 시도
  console.log('\n=== Papyrus _document 직접 수정 시도 ===');
  const fixResult = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor || !editor._papyrus || !editor._papyrus._document) return '❌ 접근 불가';
    
    const doc = editor._papyrus._document;
    const comps = doc.components || [];
    
    let modified = 0;
    
    for (const comp of comps) {
      if (comp['@ctype'] !== 'text') continue;
      const paras = comp.value || [];
      for (const p of paras) {
        if (!p.nodes || p.nodes.length === 0) continue;
        const text = p.nodes.map(n => n.value || '').join('').trim();
        
        // === H2 적용: 섹션 제목 ===
        const isH2 = /^[📉🤖💡✨✅🚀]/.test(text) || 
          text.includes('IR 피칭 3번의 실패') ||
          text.includes('AI 영상 편집 툴 5개') ||
          text.includes('해결은 생각보다 단순') ||
          text.includes('IR 영상 하나가 바꾼') ||
          text.includes('왜 스타트업은 에이컷') ||
          text.includes('지금, IR 영상');
        
        if (isH2) {
          p.type = 'header2';
          p.textAlign = 'center';
          modified++;
        }
        
        // === Bold 적용 ===
        const boldKeywords = ['IR 피칭 영상', 'AI 영상 편집', '스타트업 마케팅', 
          '숏폼 마케팅', '릴스 알고리즘', '에이컷', 'AICUT',
          '상반기 마케팅', '하반기 준비', '여름 마케팅'];
        
        for (const node of p.nodes) {
          if (node['@ctype'] === 'textNode' && node.value) {
            for (const kw of boldKeywords) {
              if (node.value.includes(kw)) {
                node.bold = true;
                modified++;
                break;
              }
            }
          }
        }
        
        // === Center 정렬 (모든 paragraph) ===
        p.textAlign = 'center';
        modified++;
      }
    }
    
    return `✅ ${modified}개 항목 수정 완료 (H2+bold+center)`;
  });

  console.log(fixResult);

  // setDocumentData로 업데이트
  const updateResult = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return '❌ editor 없음';
    
    const data = editor.getDocumentData();
    
    // Papyrus _document의 변경사항을 getDocumentData로 읽어서 setDocumentData로 적용
    // (Papyrus는 이미 수정되었으므로 getDocumentData에 반영되어 있어야 함)
    
    try {
      editor.setDocumentData(data);
      return '✅ setDocumentData 적용 완료';
    } catch(e) {
      return `❌ ${e.message}`;
    }
  });
  console.log(updateResult);

  await new Promise(r => setTimeout(r, 2000));

  // 검증
  const verify = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };
    const data = editor.getDocumentData();
    const comps = data.document.components;
    
    let h2 = 0, bold = 0, center = 0;
    for (const comp of comps) {
      if (comp['@ctype'] !== 'text') continue;
      for (const p of (comp.value || [])) {
        if (p.type === 'header2') h2++;
        if (p.textAlign === 'center') center++;
        for (const node of (p.nodes || [])) {
          if (node.bold) bold++;
        }
      }
    }
    return { h2, bold, center };
  });
  console.log('setDocumentData 적용 후 검증:', JSON.stringify(verify));

  if (verify.h2 > 0 || verify.center > 0) {
    // 저장
    console.log('💾 저장...');
    const saveOk = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '저장') {
          btn.click();
          return true;
        }
      }
      return false;
    });
    console.log('저장:', saveOk ? '✅' : '❌');
    await new Promise(r => setTimeout(r, 3000));
    
    // 저장 후 재확인
    const afterSave = await page.evaluate(() => {
      const editor = window.SmartEditor?._editors?.['blogpc001'];
      if (!editor) return { error: 'editor 없음' };
      const data = editor.getDocumentData();
      const comps = data.document.components;
      
      let h2 = 0, bold = 0, center = 0;
      for (const comp of comps) {
        if (comp['@ctype'] !== 'text') continue;
        for (const p of (comp.value || [])) {
          if (p.type === 'header2') h2++;
          if (p.textAlign === 'center') center++;
          for (const node of (p.nodes || [])) {
            if (node.bold) bold++;
          }
        }
      }
      return { h2, bold, center, componentCount: comps.length };
    });
    console.log('저장 후 재확인:', JSON.stringify(afterSave));
  }

  await b.close();
}
run().catch(e => console.error('❌ 실패:', e.message));

const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  let page = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) {
      page = p;
      break;
    }
  }
  if (!page) {
    console.log('❌ PostWriteForm 탭 없음');
    await b.close();
    return;
  }

  page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });
  await page.bringToFront();

  // 1. 현재 문서 구조 확보 및 수정
  const result = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };

    // 현재 데이터 백업
    const currentData = editor.getDocumentData();
    
    // 각 text component의 paragraph 순회
    const components = currentData.document.components;
    
    const results = [];
    
    // 모든 text component 처리
    for (let ci = 0; ci < components.length; ci++) {
      const comp = components[ci];
      if (comp['@ctype'] !== 'text') continue;
      
      const paragraphs = comp.value || [];
      for (let pi = 0; pi < paragraphs.length; pi++) {
        const p = paragraphs[pi];
        if (!p.nodes || p.nodes.length === 0) continue;
        
        const text = p.nodes.map(n => n.value || '').join('');
        const trimmed = text.trim();
        
        let modified = false;
        
        // === H2 적용: 섹션 제목 paragraph ===
        const sectionHeaders = [
          'IR 피칭 3번의 실패',
          'AI 영상 편집 툴 5개',
          '해결은 생각보다 단순했습니다',
          'IR 영상 하나가 바꾼 모든 것',
          '왜 스타트업은 에이컷을 선택할까요',
          '지금, IR 영상을 준비하세요'
        ];
        
        const isHeader = sectionHeaders.some(h => trimmed.includes(h));
        if (isHeader) {
          p.type = 'header2';
          p.textAlign = 'center';
          modified = true;
          results.push(`H2: "${trimmed.substring(0, 30)}..."`);
        }
        
        // === Bold 적용: 핵심 키워드 ===
        const boldKeywords = [
          'IR 피칭 영상',
          'AI 영상 편집',
          '스타트업 마케팅',
          '숏폼 마케팅',
          '릴스 알고리즘',
          '에이컷',
          'AICUT',
          '상반기 마케팅',
          '하반기 준비',
          '여름 마케팅'
        ];
        
        for (const kw of boldKeywords) {
          for (const node of p.nodes) {
            if (node.value && node.value.includes(kw) && node['@ctype'] === 'textNode') {
              node.bold = true;
              modified = true;
            }
          }
        }
        
        if (modified && p.textAlign !== 'center') {
          p.textAlign = 'center';
        }
      }
    }
    
    // === setDocumentData로 업데이트 ===
    try {
      editor.setDocumentData(currentData);
      results.push('✅ setDocumentData 업데이트 완료');
    } catch(e) {
      results.push(`❌ setDocumentData 실패: ${e.message}`);
    }
    
    return results;
  });

  console.log('=== 수정 결과 ===');
  result.forEach(r => console.log(' -', r));

  // 2. 저장
  await new Promise(r => setTimeout(r, 2000));
  
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '저장') {
        btn.click();
        return '✅ 저장 버튼 클릭';
      }
    }
    return '❌ 저장 버튼 없음';
  });
  console.log('저장:', saveResult);

  await new Promise(r => setTimeout(r, 3000));

  // 3. 저장 확인
  const verify = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };
    const data = editor.getDocumentData();
    const comps = data.document.components;
    
    // H2 개수 확인
    let h2Count = 0;
    let boldCount = 0;
    let centerCount = 0;
    
    for (const comp of comps) {
      if (comp['@ctype'] !== 'text') continue;
      for (const p of (comp.value || [])) {
        if (p.type === 'header2') h2Count++;
        if (p.textAlign === 'center') centerCount++;
        for (const node of (p.nodes || [])) {
          if (node.bold) boldCount++;
        }
      }
    }
    
    return { h2Count, boldCount, centerCount, totalParagraphs: comps.reduce((a,c) => a + (c.value?.length || 0), 0) };
  });
  console.log('저장 후 확인:', JSON.stringify(verify));

  await b.close();
}
run().catch(e => console.error('❌ 실패:', e.message));

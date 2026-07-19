const { chromium } = require('playwright');

// UUID 생성
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function seId() { return 'SE-' + uuid(); }

// 문장 분할 함수
function splitPara(text) {
  if (text.length <= 25 || text.startsWith('#')) return [text];
  
  // 마침표/물음표/느낌표 기준 분할 (단, 마지막 문장이면 유지)
  const sentences = text.split(/(?<=[.?!])\s*/);
  if (sentences.length > 1 && sentences.some(s => s.trim().length > 0)) {
    const result = sentences.map(s => s.trim()).filter(s => s);
    // 각 문장이 너무 길면 추가 분할
    const final = [];
    for (const s of result) {
      if (s.length > 30) {
        // 쉼표 기준 분할
        const commaIdx = s.lastIndexOf(',');
        if (commaIdx > 8 && commaIdx < s.length - 4) {
          final.push(s.substring(0, commaIdx).trim());
          final.push(s.substring(commaIdx + 1).trim());
        } else {
          final.push(s);
        }
      } else {
        final.push(s);
      }
    }
    return final;
  }
  
  // 쉼표 기준 분할
  const commaIdx = text.indexOf(',');
  if (commaIdx > 8 && commaIdx < text.length - 5) {
    return [text.substring(0, commaIdx).trim() + ',', text.substring(commaIdx + 1).trim()];
  }
  
  return [text];
}

// paragraph 객체 생성
function makePara(text) {
  return {
    "id": seId(),
    "nodes": [{
      "id": seId(),
      "value": text,
      "@ctype": "textNode"
    }],
    "style": {
      "align": "center",
      "@ctype": "paragraphStyle"
    },
    "@ctype": "paragraph"
  };
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  for (const p of pages) {
    if (p.url().includes('224344908395')) {
      const frame = p.frame({ name: 'mainFrame' });
      await p.waitForTimeout(500);
      
      const result = await frame.evaluate((splitFn) => {
        const ed = SmartEditor._editors['blogpc001'];
        const data = ed.getDocumentData();
        const comps = data.document.components;
        let totalSplit = 0;
        
        for (let ci = 0; ci < comps.length; ci++) {
          const comp = comps[ci];
          if (comp['@ctype'] !== 'text' || !comp.value) continue;
          
          const newValue = [];
          for (const para of comp.value) {
            if (para['@ctype'] !== 'paragraph') { newValue.push(para); continue; }
            
            const text = (para.nodes || []).map(n => n.value || '').join('').trim();
            if (!text || text.length <= 25 || text.startsWith('#')) {
              newValue.push(para);
              continue;
            }
            
            const splitParts = splitFn(text);
            if (splitParts.length > 1) {
              totalSplit += splitParts.length;
              for (let i = 0; i < splitParts.length; i++) {
                const part = splitParts[i].trim();
                if (part) {
                  // 새 paragraph 객체 생성
                  newValue.push(JSON.parse(JSON.stringify(para)));
                  const newPara = newValue[newValue.length - 1];
                  newPara.id = 'SE-' + Math.random().toString(36).substring(2, 36);
                  newPara.nodes[0].id = 'SE-' + Math.random().toString(36).substring(2, 36);
                  newPara.nodes[0].value = part;
                }
              }
              // separator
              newValue.push(JSON.parse(JSON.stringify(para)));
              const sep = newValue[newValue.length - 1];
              sep.id = 'SE-' + Math.random().toString(36).substring(2, 36);
              sep.nodes[0].id = 'SE-' + Math.random().toString(36).substring(2, 36);
              sep.nodes[0].value = '';
            } else {
              newValue.push(para);
            }
          }
          comp.value = newValue;
        }
        
        try {
          ed.setDocumentData(data);
          return { 
            success: true, 
            textLen: ed.getContentText().length,
            splitCount: totalSplit
          };
        } catch(e) {
          return { success: false, error: e.message };
        }
      }, splitPara);
      
      console.log('결과:', JSON.stringify(result));
      break;
    }
  }
  
  await b.close();
})().catch(e => console.error('❌', e.message));

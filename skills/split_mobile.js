const { chromium } = require('playwright');

function splitText(text) {
  // 25자 이하면 그대로
  if (text.length <= 25 || text.startsWith('#')) return [text];
  
  // 마침표/물음표/느낌표 기준 분할
  const parts = text.split(/(?<=[.?!])\s*/);
  if (parts.length > 1 && parts.some(p => p.trim().length > 0)) {
    return parts.map(p => p.trim()).filter(p => p);
  }
  
  // 쉼표 기준 분할 (마지막 쉼표 우선)
  const commaIdx = text.lastIndexOf(',');
  if (commaIdx > 10 && commaIdx < text.length - 5) {
    const first = text.substring(0, commaIdx).trim();
    const second = text.substring(commaIdx + 1).trim();
    if (first.length >= 8 && second.length >= 4) {
      return [first + ',', second];
    }
  }
  
  return [text];
}

function makeTextComponent(text) {
  return {
    "@ctype": "paragraph",
    "id": "SE-" + generateId(),
    "layout": "default",
    "align": "center",
    "nodes": [{
      "id": "SE-" + generateId(),
      "@ctype": "textNode",
      "value": text
    }]
  };
}

let idCounter = Date.now();
function generateId() {
  return (idCounter++).toString(16).padStart(12, '0') + '-' +
    (idCounter++).toString(16).padStart(4, '0') + '-' +
    (idCounter++).toString(16).padStart(4, '0') + '-' +
    (idCounter++).toString(16).padStart(4, '0') + '-' +
    (idCounter++).toString(16).padStart(12, '0');
}

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  for (const p of pages) {
    const url = p.url();
    if (url.includes('224344908395')) {
      const frame = p.frame({ name: 'mainFrame' });
      await p.waitForTimeout(500);
      
      // Get original document data
      const docData = await frame.evaluate(() => {
        const ed = SmartEditor._editors['blogpc001'];
        return ed.getDocumentData();
      });
      
      const components = docData.document.components;
      console.log('원본 컴포넌트 수:', components.length);
      
      // Analyze and split
      const newComponents = [];
      let splitCount = 0;
      
      for (const comp of components) {
        const ctype = comp['@ctype'] || '';
        
        if (ctype === 'paragraph' && comp.nodes) {
          const text = comp.nodes.map(n => n.value || '').join('');
          const trimmed = text.trim();
          
          if (trimmed.length > 25 && !trimmed.startsWith('#')) {
            const splitParts = splitText(trimmed);
            if (splitParts.length > 1) {
              for (const part of splitParts) {
                if (part.trim()) {
                  newComponents.push(makeTextComponent(part.trim()));
                  splitCount++;
                }
              }
              // Empty paragraph as separator
              newComponents.push(makeTextComponent(''));
              continue;
            }
          }
        }
        
        // Keep original component for short text, images, title, etc
        newComponents.push(JSON.parse(JSON.stringify(comp)));
      }
      
      console.log('분할 후 컴포넌트 수:', newComponents.length);
      console.log('분할된 문단 수:', splitCount);
      
      // Update document data
      docData.document.components = newComponents;
      
      // Apply to SE4
      const result = await frame.evaluate((data) => {
        try {
          const ed = SmartEditor._editors['blogpc001'];
          ed.setDocumentData(data);
          return { success: true, textLen: ed.getContentText().length };
        } catch(e) {
          return { success: false, error: e.message };
        }
      }, docData);
      
      console.log('적용 결과:', JSON.stringify(result));
      break;
    }
  }
  
  await b.close();
})().catch(e => console.error('❌', e.message));

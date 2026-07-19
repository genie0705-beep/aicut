const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  for (const p of pages) {
    if (p.url().includes('224344908395')) {
      const frame = p.frame({ name: 'mainFrame' });
      await p.waitForTimeout(500);
      
      const result = await frame.evaluate(() => {
        // 분할 함수 (브라우저 내에서 실행)
        function splitText(text) {
          if (text.length <= 25 || text.startsWith('#')) return [text];
          
          // 마침표/물음표/느낌표 기준
          const sents = text.split(/(?<=[.?!])\s*/);
          if (sents.length > 1 && sents.some(s => s.trim().length > 0)) {
            const result = [];
            for (const s of sents.map(s => s.trim()).filter(s => s)) {
              if (s.length > 30) {
                const cidx = s.lastIndexOf(',');
                if (cidx > 8 && cidx < s.length - 4) {
                  result.push(s.substring(0, cidx).trim() + ',');
                  result.push(s.substring(cidx + 1).trim());
                } else {
                  result.push(s);
                }
              } else {
                result.push(s);
              }
            }
            return result;
          }
          
          const cidx = text.indexOf(',');
          if (cidx > 8 && cidx < text.length - 5) {
            return [text.substring(0, cidx).trim() + ',', text.substring(cidx + 1).trim()];
          }
          
          return [text];
        }
        
        function makeId() {
          return 'SE-' + Math.random().toString(36).substring(2, 15) + 
            '-' + Math.random().toString(36).substring(2, 10);
        }
        
        function makePara(text) {
          return {
            "id": makeId(),
            "nodes": [{ "id": makeId(), "value": text, "@ctype": "textNode" }],
            "style": { "align": "center", "@ctype": "paragraphStyle" },
            "@ctype": "paragraph"
          };
        }
        
        try {
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
              
              const parts = splitText(text);
              if (parts.length > 1) {
                totalSplit += parts.length;
                for (const part of parts) {
                  if (part.trim()) newValue.push(makePara(part.trim()));
                }
                newValue.push(makePara('')); // separator
              } else {
                newValue.push(para);
              }
            }
            comp.value = newValue;
          }
          
          ed.setDocumentData(data);
          return { 
            success: true, 
            textLen: ed.getContentText().length,
            splitCount: totalSplit
          };
        } catch(e) {
          return { success: false, error: e.message, stack: e.stack };
        }
      });
      
      console.log('결과:', JSON.stringify(result, null, 2));
      break;
    }
  }
  
  await b.close();
})().catch(e => console.error('❌', e.message));

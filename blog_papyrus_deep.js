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
  if (!page) { console.log('❌ 탭 없음'); await b.close(); return; }
  await page.bringToFront();

  // Papyrus 상세 탐색
  const deep = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };

    const result = {};

    // 1. _papyrus 전체 키 (private 포함)
    if (editor._papyrus) {
      result.papyrusAllKeys = Object.getOwnPropertyNames(editor._papyrus);
      
      for (const key of result.papyrusAllKeys) {
        const val = editor._papyrus[key];
        if (val && typeof val === 'object') {
          const subKeys = Object.getOwnPropertyNames(val);
          result[`papyrus.${key}`] = { type: 'object', keys: subKeys.slice(0, 15), 
            sample: JSON.stringify(val).substring(0, 200) };
        } else if (typeof val === 'function') {
          result[`papyrus.${key}`] = { type: 'function', length: val.length };
        } else {
          result[`papyrus.${key}`] = { type: typeof val, value: String(val).substring(0, 100) };
        }
      }
    }

    // 2. getDocumentData()로 현재 저장된 components 첫 번째 text component의 첫 paragraph 상세
    const data = editor.getDocumentData();
    const comps = data?.document?.components || [];
    if (comps.length >= 2) {
      const textComp = comps[1];
      result.textCompType = textComp['@ctype'];
      result.textCompKeys = Object.keys(textComp);
      
      if (textComp.value && textComp.value.length > 0) {
        const firstP = textComp.value[0];
        result.firstParaFull = JSON.stringify(firstP).substring(0, 500);
      }
      
      // 15번째 paragraph (H2가 되어야 할 섹션 제목)
      const paras = textComp.value || [];
      for (let i = 0; i < paras.length; i++) {
        const text = paras[i]?.nodes?.map(n => n.value || '').join('') || '';
        if (text.includes('IR 피칭 3번의 실패') || text.includes('AI 영상 편집')) {
          result[`sectionPos_${i}`] = {
            text: text.substring(0, 40),
            keys: Object.keys(paras[i]),
            full: JSON.stringify(paras[i]).substring(0, 300)
          };
          break;
        }
      }
    }

    result.componentCount = comps.length;
    
    return result;
  });

  console.log('=== Papyrus 심층 분석 ===');
  console.log(JSON.stringify(deep, null, 2));

  await b.close();
}
run().catch(e => console.error('❌ 실패:', e.message));

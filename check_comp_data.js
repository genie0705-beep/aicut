const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  let target = -1;
  pages.forEach((p, i) => { if (p.url().includes('Redirect=Write')) target = i; });
  if (target < 0) { console.log('❌'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  const data = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData().document;
    const tc = d.components?.find(c => c['@ctype'] === 'text');
    if (!tc) return { error: 'no text comp' };
    
    const paras = tc.value || [];
    const types = {};
    paras.forEach(p => { types[p['@ctype']] = (types[p['@ctype']] || 0) + 1; });
    
    let boldCount = 0;
    paras.forEach(p => p.nodes?.forEach(n => { if (n.marks) boldCount += n.marks.filter(m => m['@ctype'] === 'bold').length; }));
    
    // 샘플 heading2 확인
    const h2s = paras.filter(p => p['@ctype'] === 'heading2').slice(0, 3);
    
    // 샘플 bold 확인
    const bolds = [];
    paras.forEach(p => p.nodes?.forEach(n => {
      if (n.marks && n.marks.some(m => m['@ctype'] === 'bold')) {
        bolds.push(n.value.substring(0, 30));
      }
    }));
    
    return {
      totalParas: paras.length,
      types,
      boldCount,
      h2Samples: h2s.map(h => h.nodes?.map(n => n.value).join('').substring(0, 30) || ''),
      boldSamples: bolds.slice(0, 5),
      firstParaType: paras[0]?.['@ctype'],
      firstParaCtype: paras[0]?.type,
    };
  });
  
  console.log('text component 분석:', JSON.stringify(data, null, 2));
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  let page = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm') && !p.url().includes('logNo')) {
      page = p;
      break;
    }
  }
  if (!page) {
    page = await ctx.newPage();
    page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
  } else {
    page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });
    await page.bringToFront();
  }

  // 현재 저장된 내용의 getDocumentData 상세 분석
  const fullAnalysis = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };

    const data = editor.getDocumentData();
    const comps = data.document.components;
    
    // 모든 paragraph 순회하면서 세부 분석
    const paragraphs = [];
    for (const comp of comps) {
      if (comp['@ctype'] !== 'text') continue;
      
      let prevText = '';
      for (let pi = 0; pi < (comp.value || []).length; pi++) {
        const p = comp.value[pi];
        if (!p.nodes || p.nodes.length === 0) {
          paragraphs.push({ type: 'blank' });
          continue;
        }
        
        const text = p.nodes.map(n => n.value || '').join('');
        const trimmed = text.trim();
        
        const hasBold = p.nodes.some(n => n.bold);
        const hasH2 = p.type === 'header2' || p.tagName === 'h2';
        const align = p.textAlign || 'none';
        
        // 이전 노드와 연결되면 같은 문단
        const isNewSection = trimmed.startsWith('💭') || trimmed.startsWith('📉') || trimmed.startsWith('🤖') || 
          trimmed.startsWith('💡') || trimmed.startsWith('✨') || trimmed.startsWith('✅') || 
          trimmed.startsWith('🚀');
        
        paragraphs.push({ 
          text: trimmed.substring(0, 60), 
          isSection: isNewSection || /^[📉🤖💡✨✅🚀📌]/.test(trimmed),
          hasBold, 
          isH2: hasH2,
          align,
          len: text.length
        });
      }
    }

    // SEO 점수 계산
    const h2Count = paragraphs.filter(p => p.isH2).length;
    const boldCount = paragraphs.filter(p => p.hasBold).length;
    const centerCount = paragraphs.filter(p => p.align === 'center').length;
    const sectionCount = paragraphs.filter(p => p.isSection).length;
    const totalText = paragraphs.reduce((a, p) => a + p.len, 0);

    // 이미지 component 확인
    const imgCount = comps.filter(c => c['@ctype'] === 'image').length;

    return {
      componentCount: comps.length,
      totalParagraphs: paragraphs.length,
      sectionCount,
      h2Count,
      boldCount,
      centerCount,
      imgCount,
      totalTextLen: totalText,
      paragraphs: paragraphs.slice(0, 20) // 처음 20개만
    };
  });

  console.log('=== SEO 전체 분석 ===');
  console.log(JSON.stringify(fullAnalysis, null, 2));

  // 화면 표시 상태
  const screenState = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return 'iframe 없음';
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return 'doc 없음';
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return 'editable 없음';
    const html = body.innerHTML;
    return {
      hasH2Tag: html.includes('<h2'),
      hasStrongTag: html.includes('<strong'),
      hasCenter: html.includes('text-align: center') || html.includes('align="center"'),
      htmlPreview: html.substring(0, 500)
    };
  });
  console.log('\n=== 화면 HTML 상태 ===');
  console.log(JSON.stringify(screenState, null, 2));

  await b.close();
}
run().catch(e => console.error('❌ 실패:', e.message));

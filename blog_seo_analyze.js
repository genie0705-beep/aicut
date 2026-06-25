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
    // 새로 접속
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(5000);
  }

  // SmartEditor 데이터 전체 분석
  const data = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };

    const title = editor.getDocumentTitle ? editor.getDocumentTitle() : 'N/A';
    const docData = editor.getDocumentData ? editor.getDocumentData() : null;
    
    // components 상세 분석
    const components = docData?.document?.components || [];
    const detail = components.map((comp, i) => {
      if (comp['@ctype'] === 'text') {
        const paragraphs = comp.value || [];
        const texts = paragraphs.map(p => {
          const nodes = p.nodes || [];
          const text = nodes.map(n => n.value || '').join('');
          const hasBold = nodes.some(n => n.bold || n['@ctype'] === 'bold');
          return { text: text.substring(0, 80), hasBold, ctype: p['@ctype'] || 'paragraph' };
        });
        return { idx: i, type: 'text', paragraphs: texts, paragraphCount: paragraphs.length };
      }
      if (comp['@ctype'] === 'image') {
        return { idx: i, type: 'image', src: (comp.src || '').substring(0, 50) };
      }
      return { idx: i, type: comp['@ctype'] || 'unknown' };
    });

    // 전체 텍스트 길이
    const fullText = docData?.document?.components
      ?.filter(c => c['@ctype'] === 'text')
      ?.flatMap(c => c.value || [])
      ?.flatMap(p => p.nodes || [])
      ?.map(n => n.value || '')
      ?.join('') || '';

    return {
      title,
      componentCount: components.length,
      detail,
      fullTextLength: fullText.length,
      fullTextPreview: fullText.substring(0, 300)
    };
  });

  console.log('=== SmartEditor 데이터 분석 ===');
  console.log(JSON.stringify(data, null, 2));
  
  // 추가: 페이지 화면 텍스트 확인
  const screenText = await page.evaluate(() => document.body.innerText);
  console.log('\n=== 화면 텍스트 (뒤 500자) ===');
  console.log(screenText.substring(screenText.length - 1000));
  
  await b.close();
}
run().catch(e => console.error('❌ 실패:', e.message));

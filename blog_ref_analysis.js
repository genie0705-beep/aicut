const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });

  // 기존 발행된 포스팅 접속 (6/17 스마트스토어 포스팅)
  await page.goto('https://blog.naver.com/PostView.naver?blogId=aicut&logNo=224318774', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('포스팅 URL:', page.url());

  // 수정 페이지로 이동
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut&logNo=224318774', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  console.log('수정 URL:', page.url());

  // SmartEditor 데이터 분석
  const refData = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };
    
    const docData = editor.getDocumentData ? editor.getDocumentData() : null;
    const components = docData?.document?.components || [];
    
    // 첫 5개 components의 상세 구조
    const detail = components.slice(0, 10).map((comp, i) => {
      if (comp['@ctype'] === 'text') {
        const paragraphs = (comp.value || []).slice(0, 5).map(p => {
          const nodes = p.nodes || [];
          return {
            type: p['@ctype'],
            headingType: p.type || p.heading || p.level || null,
            textAlign: p.textAlign || null,
            nodes: nodes.map(n => ({
              ctype: n['@ctype'],
              value: (n.value || '').substring(0, 50),
              bold: n.bold || false,
              fontSize: n.fontSize || null
            }))
          };
        });
        return { idx: i, type: 'text', paragraphs, hasBold: paragraphs.some(p => p.nodes.some(n => n.bold)) };
      }
      if (comp['@ctype'] === 'image') {
        return { idx: i, type: 'image', src: (comp.src || '').substring(0, 60), alt: (comp.alt || '').substring(0, 60) };
      }
      return { idx: i, type: comp['@ctype'] };
    });

    return {
      componentCount: components.length,
      detail,
      // 첫 text component의 전체 구조 (키-값 전체)
      rawSample: JSON.stringify(components[1] || components[0]).substring(0, 500)
    };
  });

  console.log('=== 레퍼런스 포스팅 데이터 ===');
  console.log(JSON.stringify(refData, null, 2));

  await b.close();
}
run().catch(e => console.error('❌ 실패:', e.message));

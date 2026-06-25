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
  if (!page) { console.log('❌'); await b.close(); return; }
  await page.bringToFront();

  // 새 탭 열어서 에디터 이미지 캡처
  const shotPage = await ctx.newPage();
  shotPage.on('dialog', async d => { await d.dismiss().catch(()=>{}); });
  
  // 현재 PostWriteForm URL로 접속
  const url = page.url();
  await shotPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await shotPage.waitForTimeout(5000);
  
  await shotPage.screenshot({ path: 'editor_screenshot.png', fullPage: true });
  console.log('✅ editor_screenshot.png 캡처 완료');
  
  // iframe 캡처도 시도
  const iframeShot = await shotPage.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return '❌ iframe 없음';
    return { w: iframe.offsetWidth, h: iframe.offsetHeight, visible: iframe.offsetParent !== null };
  });
  console.log('iframe 상태:', JSON.stringify(iframeShot));

  // getDocumentData로 최종 확인 (text component만)
  const finalData = await shotPage.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return '❌';
    const data = editor.getDocumentData();
    const comps = data.document.components;
    
    const result = { componentCount: comps.length, detail: [] };
    for (const comp of comps) {
      if (comp['@ctype'] === 'text') {
        const paras = comp.value || [];
        const firstTexts = paras.slice(0, 30).map(p => {
          const t = p.nodes?.map(n => n.value || '').join('') || '';
          return { t: t.substring(0, 40), type: p.type || 'paragraph', align: p.textAlign || 'none', bold: p.nodes?.some(n => n.bold) };
        });
        result.detail.push({ type: 'text', paragraphs: paras.length, first30: firstTexts });
      } else if (comp['@ctype'] === 'documentTitle') {
        result.detail.push({ type: 'documentTitle', value: comp.value });
      } else {
        result.detail.push({ type: comp['@ctype'] });
      }
    }
    return result;
  });
  console.log('최종 데이터:', JSON.stringify(finalData, null, 2));

  await b.close();
}
run().catch(e => console.error('❌ 실패:', e.message));

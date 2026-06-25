const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  
  let page = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  
  if (!page) {
    console.log('새 PostWriteForm 탭 생성');
    page = await ctx.newPage();
    page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
  }
  
  const title = '구독자 5만 유튜버가 편집 외주로 바꾼 후, 업로드 주기가 3배 빨라진 이유';
  
  const editorOk = await page.evaluate((t) => {
    const e = window.SmartEditor?._editors?.['blogpc001'];
    if (!e) return false;
    if (e.setDocumentTitle) e.setDocumentTitle(t);
    return true;
  }, title);
  console.log('제목:', editorOk ? '✅' : '❌');
  await delay(500);
  
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return;
    body.focus();
    body.innerHTML = '';
  });
  await delay(500);
  
  await page.keyboard.press('Control+V');
  await delay(3000);
  
  const check = await page.evaluate(() => {
    const e = window.SmartEditor?._editors?.['blogpc001'];
    if (!e) return 'n/a';
    const d = e.getDocumentData();
    let t = '';
    for (const c of d.document.components) {
      if (c['@ctype'] !== 'text') continue;
      for (const pa of (c.value || [])) {
        for (const n of (pa.nodes || [])) if (n.value) t += n.value;
      }
    }
    return { len: t.length, hasGIesX: t.includes('GIesX'), hasCreator: t.includes('크리에이터') };
  });
  console.log('본문:', JSON.stringify(check));
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
  });
  await delay(3000);
  console.log('저장: ✅');
  
  process.exit(0);
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
run().catch(e => { console.error('❌', e.message); process.exit(1); });

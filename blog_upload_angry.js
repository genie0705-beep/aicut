const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });

  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);

  const title = '영상 편집, 진짜 빡쳐본 사람만 아는 현타 이야기';
  const body = fs.readFileSync('blog_body_angry.txt', 'utf8');

  // 제목
  await page.evaluate((t) => {
    const e = window.SmartEditor?._editors?.['blogpc001'];
    if (e?.setDocumentTitle) e.setDocumentTitle(t);
  }, title);
  console.log('제목: ✅');
  await sleep(500);

  // iframe 비우고 focus
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return;
    body.focus();
    body.innerHTML = '';
    // select all + delete
    doc.execCommand('selectAll');
    doc.execCommand('delete');
  });
  await sleep(500);

  // clipboard
  await page.evaluate((text) => navigator.clipboard.writeText(text), body);
  await sleep(300);

  // paste via execCommand (SmartEditor가 인식하는 방식)
  const pasteResult = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return 'iframe 없음';
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return 'doc 없음';
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return 'body 없음';
    body.focus();
    const result = doc.execCommand('paste');
    return 'paste: ' + result;
  });
  console.log('paste:', pasteResult);
  await sleep(3000);

  // 확인
  const check = await page.evaluate(() => {
    const e = window.SmartEditor?._editors?.['blogpc001'];
    if (!e) return 'n/a';
    const d = e.getDocumentData();
    let t = '';
    for (const c of d.document.components) {
      if (c['@ctype'] !== 'text') continue;
      for (const p of (c.value || [])) {
        for (const n of (p.nodes || [])) if (n.value) t += n.value;
      }
    }
    return { len: t.length, hasGIesX: t.includes('GIesX'), hasMaster: t.includes('master@') };
  });
  console.log('확인:', JSON.stringify(check));

  if (check.len > 500) {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
    });
    await sleep(3000);
    console.log('저장: ✅');
  } else {
    // clipboard.writeText 실패 시 Ctrl+V 시도
    console.log('내용 부족, Ctrl+V 시도...');
    const focusOk = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[id^="input_buffer"]');
      const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
      doc?.querySelector('[contenteditable="true"]')?.focus();
      return true;
    });
    await page.keyboard.press('Control+v');
    await sleep(3000);
    
    const check2 = await page.evaluate(() => {
      const e = window.SmartEditor?._editors?.['blogpc001'];
      if (!e) return { len: 0 };
      const d = e.getDocumentData();
      let t = '';
      for (const c of d.document.components) {
        if (c['@ctype'] !== 'text') continue;
        for (const p of (c.value || [])) {
          for (const n of (p.nodes || [])) if (n.value) t += n.value;
        }
      }
      return { len: t.length };
    });
    console.log('Ctrl+V 후:', JSON.stringify(check2));
    
    if (check2.len > 500) {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
      });
      await sleep(3000);
      console.log('저장: ✅');
    }
  }

  process.exit(0);
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
run().catch(e => { console.error('❌', e.message); process.exit(1); });

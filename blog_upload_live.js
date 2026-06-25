const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(4000);
  }

  const title = '라이브 커머스 다시보기 영상, 편집 하나로 구매전환율 3배 차이';
  const body = fs.readFileSync('blog_body_live.txt', 'utf8');

  // 제목
  const titleOk = await page.evaluate((t) => {
    const e = window.SmartEditor?._editors?.['blogpc001'];
    if (e?.setDocumentTitle) { e.setDocumentTitle(t); return true; }
    return false;
  }, title);
  console.log('제목:', titleOk ? '✅' : '❌');
  await sleep(800);

  // iframe focus + 비우기
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
  await sleep(500);

  // keyboard.type
  await page.keyboard.type(body, { delay: 2 });
  await sleep(3000);
  console.log('본문: ✅');

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
    return { len: t.length, hasGIesX: t.includes('GIesX'), hasMaster: t.includes('master@'), hasShop: t.includes('쇼핑몰') };
  });
  console.log('확인:', JSON.stringify(check));

  // 저장
  if (check.len > 500) {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
    });
    await sleep(3000);
    console.log('저장: ✅');
  }

  process.exit(0);
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
run().catch(e => { console.error('❌', e.message); process.exit(1); });

const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = 'IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책';

async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  const page = pages.length > 0 ? pages[0] : await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });

  if (!page.url().includes('PostWriteForm')) {
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
  }
  console.log('에디터:', page.url().includes('PostWriteForm') ? '✅' : '❌');

  // 제목
  await page.evaluate((t) => {
    const e = window.SmartEditor?._editors?.['blogpc001'];
    if (e?.setDocumentTitle) e.setDocumentTitle(t);
  }, TITLE);
  console.log('제목: ✅');
  await delay(500);

  // 본문
  const body = fs.readFileSync('blog_body_edited.txt', 'utf8');
  console.log('본문:', body.length, '자');

  // iframe 클리어 후 focus
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const b = doc.querySelector('[contenteditable="true"]');
    if (!b) return;
    b.focus();
    b.innerHTML = '';
  });
  await delay(500);

  // keyboard.type
  await page.keyboard.type(body, { delay: 2 });
  await delay(2000);
  console.log('본문: ✅');

  // 저장
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
  });
  await delay(3000);
  console.log('저장: ✅');

  // 이메일 확인
  const emailCheck = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return '❌ editor';
    const data = editor.getDocumentData();
    let found = '';
    for (const c of data.document.components) {
      if (c['@ctype'] !== 'text') continue;
      for (const p of (c.value || [])) {
        for (const n of (p.nodes || [])) {
          if (n.value?.includes('master@')) found = 'master@aicut.co.kr';
          if (n.value?.includes('gmail')) found += ' (gmail있음)';
        }
      }
    }
    return found || '⚠️ 확인불가';
  });
  console.log('이메일:', emailCheck);

  process.exit(0);
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
run().catch(e => { console.error('❌', e.message); process.exit(1); });

const { chromium } = require('playwright');
const CONTENT = require('./blog_post_content.js');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) { target = p; break; }
  }
  if (!target) { console.log('NO_TAB'); b.close(); return; }
  
  target.on('dialog', async d => { await d.dismiss(); });
  await target.bringToFront();
  await sleep(2000);

  // Build center-aligned mobile-friendly HTML
  const lines = CONTENT.body.split('\n');
  const parts = [];
  for (const line of lines) {
    const txt = line.trim();
    if (!txt) {
      parts.push('<p style="text-align:center"><br></p>');
    } else {
      parts.push('<p style="text-align:center">' + txt + '</p>');
    }
  }
  parts.push('<p style="text-align:center"><br></p>');
  parts.push('<p style="text-align:center;color:#888;font-size:12px">' + CONTENT.hashtags + '</p>');
  const html = parts.join('\n');

  // Set title
  await target.evaluate((title) => {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle(title); } catch(e) {}
  }, CONTENT.title);
  await sleep(500);

  // Clear & focus
  await target.evaluate(() => {
    const ce = document.querySelector('.se-component-content [contenteditable]');
    if (ce) { ce.focus(); ce.innerHTML = ''; }
  });
  await sleep(500);

  // Clipboard write + paste
  const clipOk = await target.evaluate((h) => {
    return new Promise((resolve) => {
      try {
        const blob = new Blob([h], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => resolve(true));
      } catch(e) { resolve(false); }
    });
  }, html);
  console.log('CLIPBOARD:', clipOk ? 'OK' : 'FAIL');
  if (!clipOk) { b.close(); return; }

  await target.keyboard.press('Control+v');
  await sleep(5000);

  const after = await target.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      return { len: ed.getContentText().length };
    } catch(e) { return { err: e.message }; }
  });
  console.log('AFTER PASTE:', JSON.stringify(after));

  // Save
  let saved = false;
  for (let i = 0; i < 8; i++) {
    saved = await target.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) {
          btn.click(); return true;
        }
      }
      return false;
    });
    if (saved) { console.log('SAVE CLICKED'); break; }
    await sleep(1000);
  }
  await sleep(4000);

  const final = await target.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      return { len: ed.getContentText().length };
    } catch(e) { return { err: e.message }; }
  });
  console.log('FINAL:', JSON.stringify(final));
  b.close();
})();

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CONTENT = require('./blog_post_content.js');
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const LOGNO = '224326361515';
const IMG_FILES = [
  'aicut_blog_5q_thumb.png',
  'aicut_blog_5q_q1.png',
  'aicut_blog_5q_q2.png',
  'aicut_blog_5q_q3.png',
  'aicut_blog_5q_q4.png'
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  
  // Find post view or open modify page
  let target = null;
  for (const p of pages) {
    if (p.url().includes('PostView') && p.url().includes(LOGNO)) { target = p; break; }
  }
  
  if (!target) {
    // Open modify page
    target = await b.contexts()[0].newPage();
    await target.goto('https://blog.naver.com/PostUpdate.nhn?blogId=aicut&logNo=' + LOGNO, { timeout: 30000 });
    await sleep(5000);
  } else {
    await target.goto('https://blog.naver.com/PostUpdate.nhn?blogId=aicut&logNo=' + LOGNO, { timeout: 30000 });
    await sleep(5000);
  }
  
  target.on('dialog', async d => { await d.dismiss(); });
  await target.bringToFront();
  await sleep(2000);
  
  // Check if SmartEditor is available
  const edCheck = await target.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      return { ok: true, title: ed.getDocumentTitle(), len: ed.getContentText().length };
    } catch(e) {
      return { ok: false, err: e.message };
    }
  });
  console.log('EDITOR:', JSON.stringify(edCheck));
  
  if (!edCheck.ok) {
    console.log('Editor not available on this page');
    await target.screenshot({ path: 'blog_modify_error.png' });
    b.close(); return;
  }
  
  // Build clean HTML (no duplicate)
  const lines = CONTENT.body.split('\n');
  const parts = [];
  for (const line of lines) {
    const txt = line.trim();
    if (!txt) { parts.push('<p style="text-align:center"><br></p>'); continue; }
    parts.push('<p style="text-align:center">' + txt + '</p>');
  }
  parts.push('<p style="text-align:center"><br></p>');
  parts.push('<p style="text-align:center;color:#888;font-size:12px">' + CONTENT.hashtags + '</p>');
  const html = parts.join('\n');
  
  // Set title
  await target.evaluate((title) => {
    try { SmartEditor._editors['blogpc001'].setDocumentTitle(title); } catch(e) {}
  }, CONTENT.title);
  console.log('Title updated');
  
  // Clear all content and re-paste
  // First, clear the contenteditable text components
  await target.evaluate(() => {
    const textComps = document.querySelectorAll('.se-component.se-text .se-component-content [contenteditable]');
    textComps.forEach(el => { el.innerHTML = ''; });
  });
  await sleep(500);
  
  // Focus the first text component
  await target.evaluate(() => {
    const firstText = document.querySelector('.se-component.se-text .se-component-content [contenteditable]');
    if (firstText) firstText.focus();
  });
  await sleep(300);
  
  // Clipboard approach
  const clipOk = await target.evaluate((h) => {
    return new Promise((resolve) => {
      try {
        const blob = new Blob([h], { type: 'text/html' });
        navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => resolve(true));
      } catch(e) { resolve(false); }
    });
  }, html);
  console.log('CLIPBOARD:', clipOk ? 'OK' : 'FAIL');
  
  if (clipOk) {
    await target.keyboard.press('Control+v');
    await sleep(5000);
    
    const after = await target.evaluate(() => {
      try {
        const ed = SmartEditor._editors['blogpc001'];
        return { len: ed.getContentText().length };
      } catch(e) { return { err: e.message }; }
    });
    console.log('AFTER PASTE:', JSON.stringify(after));
  }
  
  // Now try to upload images to the image components
  console.log('\n=== IMAGE UPLOAD ===');
  
  // Find image components and try to click them to add images
  const imgCompInfo = await target.evaluate(() => {
    const imgs = document.querySelectorAll('.se-component.se-image');
    return Array.from(imgs).map((el, i) => {
      const ce = el.querySelector('[contenteditable]');
      const hasImg = !!el.querySelector('img');
      return {
        index: i,
        hasContentEditable: !!ce,
        hasActualImg: hasImg,
        innerText: el.innerText.replace(/\s+/g, ' ').trim().substring(0, 60)
      };
    });
  });
  console.log('IMAGE COMPONENTS:', JSON.stringify(imgCompInfo, null, 2));
  
  // Click on each empty image component to trigger upload
  for (let i = 0; i < Math.min(imgCompInfo.length, IMG_FILES.length); i++) {
    if (imgCompInfo[i].hasActualImg) {
      console.log(`  Image ${i+1}: already has image, skipping`);
      continue;
    }
    
    const imgEl = (await target.$$('.se-component.se-image'))[i];
    if (!imgEl) { console.log(`  Image ${i+1}: element not found`); continue; }
    
    // Click center of image component to trigger upload
    const [fc] = await Promise.all([
      target.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
      imgEl.click({ position: { x: 200, y: 100 } })
    ]);
    
    if (fc) {
      const imgPath = path.join(__dirname, IMG_FILES[i]);
      console.log(`  Image ${i+1} (${IMG_FILES[i]}): file chooser opened, setting file...`);
      await fc.setFiles([imgPath]);
      await sleep(5000);
    } else {
      // Try clicking the contenteditable area inside
      const ce = await imgEl.$('[contenteditable]');
      if (ce) {
        const [fc2] = await Promise.all([
          target.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null),
          ce.click()
        ]);
        if (fc2) {
          const imgPath = path.join(__dirname, IMG_FILES[i]);
          console.log(`  Image ${i+1}: file chooser opened (CE click), setting file...`);
          await fc2.setFiles([imgPath]);
          await sleep(5000);
        } else {
          console.log(`  Image ${i+1}: no file chooser`);
        }
      }
    }
  }
  
  // Check final state
  const final = await target.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const imgs = document.querySelectorAll('.se-component.se-image img');
      return {
        title: ed.getDocumentTitle(),
        len: ed.getContentText().length,
        imgCount: imgs.length
      };
    } catch(e) { return { err: e.message }; }
  });
  console.log('\nFINAL:', JSON.stringify(final));
  
  // Save
  console.log('Saving...');
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
    if (saved) { console.log('SAVED'); break; }
    await sleep(1000);
  }
  await sleep(3000);
  
  b.close();
  console.log('\n=== DONE ===');
})().catch(e => console.log('FATAL: ' + e.message.substring(0, 300)));

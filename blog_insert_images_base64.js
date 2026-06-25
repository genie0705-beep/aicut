const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const IMAGES = [
  { file: 'aicut_blog_5q_thumb.png', desc: '대표 이미지' },
  { file: 'aicut_blog_5q_q1.png', desc: '질문1: 브랜드 이해' },
  { file: 'aicut_blog_5q_q2.png', desc: '질문2: 수정 범위' },
  { file: 'aicut_blog_5q_q3.png', desc: '질문3: 납품 일정' },
  { file: 'aicut_blog_5q_q4.png', desc: '질문4+5: 저작권·사례' }
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let t = null;
  for (const p of pages) {
    if (p.url().includes('PostWriteForm')) { t = p; break; }
  }
  if (!t) { console.log('NO_TAB'); b.close(); return; }
  
  t.on('dialog', async d => { await d.dismiss(); });
  await t.bringToFront();
  await new Promise(r => setTimeout(r, 2000));

  console.log('=== 이미지 Base64 삽입 시작 ===');

  // Read all images to base64
  const imgDataList = IMAGES.map(img => {
    const imgPath = path.join(__dirname, img.file);
    if (!fs.existsSync(imgPath)) {
      console.log('  MISSING:', img.file);
      return null;
    }
    const b64 = fs.readFileSync(imgPath).toString('base64');
    return {
      ...img,
      fileSize: fs.statSync(imgPath).size,
      dataUrl: 'data:image/png;base64,' + b64
    };
  }).filter(Boolean);

  console.log('  Loaded', imgDataList.length, 'images');

  // Insert images into contenteditable
  for (let i = 0; i < imgDataList.length; i++) {
    const img = imgDataList[i];
    console.log(`  [${i+1}/${imgDataList.length}] ${img.desc} (${(img.fileSize/1024).toFixed(0)}KB)`);
    
    const imgHtml = `<p style="text-align:center"><br></p>
<p style="text-align:center"><img src="${img.dataUrl}" style="max-width:100%;width:800px;" /></p>
<p style="text-align:center"><br></p>`;

    const result = await t.evaluate((html) => {
      try {
        const ce = document.querySelector('.se-component-content [contenteditable]');
        if (!ce) return 'NO_CE';
        ce.focus();
        
        // Create temp div and parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Insert at cursor position (end of content)
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ce);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Insert via execCommand or DOM
        const children = ce.children;
        if (children.length > 0) {
          const last = children[children.length - 1];
          while (temp.firstChild) {
            last.parentNode.insertBefore(temp.firstChild, last.nextSibling);
          }
        } else {
          while (temp.firstChild) {
            ce.appendChild(temp.firstChild);
          }
        }
        
        return 'OK';
      } catch(e) {
        return 'ERR: ' + e.message.substring(0, 100);
      }
    }, imgHtml);
    
    if (result === 'OK') {
      console.log(`    ✅ 삽입 완료`);
    } else {
      console.log(`    ❌ ${result}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }

  // Verify
  const verify = await t.evaluate(() => {
    const ce = document.querySelector('.se-component-content [contenteditable]');
    const imgs = ce ? ce.querySelectorAll('img') : [];
    return { imgCount: imgs.length };
  });
  console.log('\n  최종 이미지 수:', verify.imgCount);

  // Check content length
  const contentCheck = await t.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      return { len: ed.getContentText().length };
    } catch(e) { return { err: e.message }; }
  });
  console.log('  콘텐츠 길이:', JSON.stringify(contentCheck));

  b.close();
  console.log('=== 완료 ===');
})().catch(e => console.log('FATAL: ' + e.message.substring(0, 200)));

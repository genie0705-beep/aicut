const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let t = null;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { t = p; break } }
  if (!t) { console.log('NO_TAB'); b.close(); return; }
  t.on('dialog', async d => { await d.dismiss() });
  await t.bringToFront();
  await new Promise(r => setTimeout(r, 2000));

  // Get all file input elements on page
  const inputsBefore = await t.evaluate(() => {
    return Array.from(document.querySelectorAll('input[type=file]')).map(i => ({ 
      id: i.id, 
      cls: i.className.substring(0, 50),
      accept: i.accept
    }));
  });
  console.log('FILE INPUTS BEFORE:', JSON.stringify(inputsBefore));

  // Listen for new file inputs
  await t.evaluate(() => {
    window.__fileInputs = [];
    const obs = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(n => {
          if (n.tagName === 'INPUT' && n.type === 'file') {
            window.__fileInputs.push({ id: n.id, cls: n.className });
          }
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  });

  // Click the image toolbar button
  const btn = t.locator('button.se-image-toolbar-button');
  console.log('Clicking image button...');
  
  // Set up file chooser listener BEFORE clicking
  const fcPromise = t.waitForEvent('filechooser', { timeout: 15000 });

  await btn.click();
  
  const fc = await fcPromise.catch(() => null);
  
  if (!fc) {
    console.log('NO FILE CHOOSER');
    // Check what opened
    const afterClick = await t.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type=file]')).map(i => ({
        id: i.id,
        cls: i.className.substring(0, 50),
        accept: i.accept
      }));
      const newInputs = window.__fileInputs || [];
      return { inputs, newInputs };
    });
    console.log('AFTER CLICK:', JSON.stringify(afterClick));
  } else {
    console.log('FILE CHOOSER RECEIVED');
    console.log('Chooser info:', JSON.stringify({
      elementTag: fc.element()?.tagName,
      elementClass: await fc.element()?.getAttribute('class')
    }));
    
    const imgPaths = [
      path.join(__dirname, 'aicut_blog_5q_thumb.png'),
      path.join(__dirname, 'aicut_blog_5q_q1.png'),
      path.join(__dirname, 'aicut_blog_5q_q2.png'),
      path.join(__dirname, 'aicut_blog_5q_q3.png'),
      path.join(__dirname, 'aicut_blog_5q_q4.png')
    ];
    
    console.log('Setting files...');
    await fc.setFiles(imgPaths);
    console.log('Files set!');
    
    // Wait longer for upload
    console.log('Waiting 15s for upload...');
    await new Promise(r => setTimeout(r, 15000));
    
    // Check for upload progress or images
    const status = await t.evaluate(() => {
      const imgs = document.querySelector('.se-component-content')?.querySelectorAll('img')?.length || 0;
      const loading = document.querySelectorAll('[class*="loading"],[class*="progress"],[class*="upload"]');
      const text = document.body.innerText.substring(0, 1000);
      return { imgs, loadings: loading.length, text: text.replace(/\s+/g, ' ').trim().substring(0, 300) };
    });
    console.log('UPLOAD STATUS:', JSON.stringify(status));
  }

  b.close();
})().catch(e => console.log('ERR: ' + e.message.substring(0, 300)));

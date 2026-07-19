const { chromium } = require('playwright');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let ig = ctx.pages().find(p => p.url().includes('instagram'));
  if (!ig) { console.log('No IG'); await b.close(); return; }
  ig.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  // Go to main feed
  await ig.goto('https://www.instagram.com/', {waitUntil:'load',timeout:20000});
  await ig.waitForTimeout(5000);
  
  // Check all SVG aria-labels for create button
  const labels = await ig.evaluate(() => {
    return Array.from(document.querySelectorAll('svg')).map(s => s.getAttribute('aria-label')).filter(Boolean);
  }).catch(() => []);
  console.log('SVG labels:', labels.slice(0, 10));
  
  // Try to find the create button by common identifiers
  const possible = ['New post', 'Create', '새 게시물', 'plus'];
  for (const label of possible) {
    const btn = ig.locator('[aria-label*="' + label + '"], svg[aria-label*="' + label + '"]').first();
    const vis = await btn.isVisible().catch(() => false);
    if (vis) {
      console.log('Found:', label);
      await btn.click();
      await ig.waitForTimeout(2000);
      break;
    }
  }
  
  // After clicking create, wait for file upload dialog
  const fcP = ig.waitForEvent('filechooser', {timeout:8000}).catch(() => null);
  // Try clicking anywhere to trigger file picker
  await ig.keyboard.press('Enter');
  await ig.waitForTimeout(1000);
  
  const fc = await fcP;
  if (fc) {
    await fc.setFiles(path.join(W, 'aicut_blog_estate_main.png'));
    console.log('Uploaded!');
  } else {
    // Try direct file input
    const fi = ig.locator('input[type=file]').first();
    if (await fi.isVisible().catch(() => false)) {
      await fi.setInputFiles(path.join(W, 'aicut_blog_estate_main.png'));
      console.log('File set!');
    } else {
      console.log('Could not upload automatically');
      console.log('Please upload manually: aicut_blog_estate_main.png');
      console.log('Caption:');
      console.log('---');
      console.log('피부과·성형외과 원장님들을 위한 여름 숏폼 마케팅 전략!');
      console.log('');
      console.log('여름만 되면 피부 관리 수요는 폭발하는데,');
      console.log('환자들은 병원보다 인스타그램을 먼저 검색합니다');
      console.log('');
      console.log('시술 소개, 비포에프터, 원장님 일상');
      console.log('숏폼 영상 하나로 예약률을 올리는 방법,');
      console.log('에이컷과 함께 준비하세요');
      console.log('');
      console.log('#병원마케팅 #여름마케팅 #피부과 #성형외과 #숏폼마케팅');
    }
  }
  
  await b.close();
})();

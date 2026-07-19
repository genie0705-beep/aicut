const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  if (!page) { console.log('PostWriteForm not found'); return; }
  
  // Get image URLs from DOM
  const imageData = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img.se-image-resource');
    return Array.from(imgs).map(i => ({
      src: i.getAttribute('src'),
      alt: i.getAttribute('alt') || '',
    }));
  });
  
  // Map by filename in alt
  const imgMap = {};
  imageData.forEach(img => {
    if (img.alt.includes('main')) imgMap.main = img.src;
    else if (img.alt.includes('card1')) imgMap.card1 = img.src;
    else if (img.alt.includes('card2')) imgMap.card2 = img.src;
    else if (img.alt.includes('card3')) imgMap.card3 = img.src;
    else if (img.alt.includes('cta')) imgMap.cta = img.src;
  });
  
  console.log('Image map:', Object.keys(imgMap).length, 'found');
  Object.entries(imgMap).forEach(([k, v]) => console.log('  ' + k + ': ' + v.slice(0, 80)));
  
  if (Object.keys(imgMap).length < 5) {
    console.log('❌ Not all images found');
    return;
  }
  
  // Read v3 base HTML
  let html = fs.readFileSync(path.join(__dirname, 'blog_realestate_body_v3.html'), 'utf8');
  
  // Helper: create img paragraph
  const imgP = (src, alt, width) => 
    `<p style="text-align: center;"><img src="${src}" alt="${alt}" style="width:100%;max-width:${width}px;border-radius:12px;margin:16px 0;"></p>\n\n`;
  
  // === INSERT IMAGES IN CORRECT ORDER ===
  
  // 1. MAIN (700px) — 도입부 끝, 첫 H2 앞
  const firstH2 = html.indexOf('<h2');
  html = html.slice(0, firstH2) + '\n\n' + imgP(imgMap.main, '부동산 영상 마케팅 숏폼 편집 아웃소싱 에이컷', 700) + html.slice(firstH2);
  
  // 2. CARD1 (600px) — "영상, 진짜 효과 있을까요?" 섹션, 2배 사례 후
  const marker1 = '문의가 두 배로 늘었습니다.</p>';
  const pos1 = html.indexOf(marker1) + marker1.length;
  html = html.slice(0, pos1) + '\n\n' + imgP(imgMap.card1, '부동산 중개법인 매물 영상 릴스 마케팅', 600) + html.slice(pos1);
  
  // 3. CARD2 (600px) — "그래서 저희가 합니다" 섹션 앞
  const marker2 = '<h2 style="text-align: center;">📱 그래서 저희가 합니다</h2>';
  const pos2 = html.indexOf(marker2);
  html = html.slice(0, pos2) + imgP(imgMap.card2, '숏폼 영상 편집 아웃소싱 프로세스 D+1 납품', 600) + html.slice(pos2);
  
  // 4. CARD3 (600px) — "하반기, 지금 시작해야 하는 이유" 앞
  const marker3 = '<h2 style="text-align: center;">📈 하반기, 지금 시작해야 하는 이유</h2>';
  const pos3 = html.indexOf(marker3);
  html = html.slice(0, pos3) + imgP(imgMap.card3, '하반기 부동산 분양 마켕팅 숏폼 전략', 600) + html.slice(pos3);
  
  // 5. CTA (600px) — 연락처 바로 앞
  const marker4 = '<p style="text-align: center;">💬 <strong>카카오톡 문의:</strong>';
  const pos4 = html.indexOf(marker4);
  html = html.slice(0, pos4) + imgP(imgMap.cta, '영상 편집 아웃소싱 무료 상담 에이컷', 600) + html.slice(pos4);
  
  // Save v4 HTML
  fs.writeFileSync(path.join(__dirname, 'blog_realestate_body_v4.html'), html);
  console.log('✅ v4 HTML saved');
  
  // === PASTE INTO SE4 ===
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const plainText = html.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');
  
  await page.evaluate(async ({html, text}) => {
    const htmlBlob = new Blob([html], {type: 'text/html'});
    const textBlob = new Blob([text], {type: 'text/plain'});
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
    ]);
  }, { html, text: plainText });
  console.log('✅ Clipboard set');
  await page.waitForTimeout(500);
  
  // Select all and paste
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001']._canvasScrollingService.focusFirstText();
  });
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+A');
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+V');
  await page.waitForTimeout(3000);
  console.log('✅ Content replaced');
  
  // Verify images in document
  const verify = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img.se-image-resource, img[src]');
    const imgSrcs = Array.from(imgs).map(i => i.getAttribute('src')?.slice(0, 60));
    const count = imgs.length;
    // Also check document data for image count
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData ? ed.getDocumentData() : {};
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    return { domImages: count, imgSrcs };
  });
  console.log('Verify images:', JSON.stringify(verify, null, 2));
  
  // Save
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText.trim() === '저장' || b.innerText.includes('저장')) {
        b.click();
        return;
      }
    }
  });
  await page.waitForTimeout(2000);
  console.log('✅ Saved!');
  
  await page.screenshot({ path: 'blog_final_with_images.png', fullPage: false });
  console.log('Screenshot saved');
})();

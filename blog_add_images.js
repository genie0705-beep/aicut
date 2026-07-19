const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const context = browser.contexts()[0];
  let page = context.pages().find(p => p.url().includes('PostWriteForm'));
  
  if (!page) {
    console.log('PostWriteForm not found');
    return;
  }
  
  // 1. Check if images already exist in the document
  const existingImages = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData ? ed.getDocumentData() : {};
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Extract all img tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    const imgs = [];
    let m;
    while ((m = imgRegex.exec(dataStr)) !== null) {
      imgs.push({
        src: m[1].slice(0, 120),
        alt: m[0].match(/alt=["']([^"']*)["']/)?.[1] || '',
      });
    }
    return { dataLength: dataStr.length, imageCount: imgs.length, images: imgs.slice(0, 10) };
  });
  console.log('Existing images:', JSON.stringify(existingImages, null, 2));
  
  const imageDir = __dirname;
  const imageFiles = [
    path.join(imageDir, 'aicut_blog_realestate_main.png'),
    path.join(imageDir, 'aicut_blog_realestate_card1.png'),
    path.join(imageDir, 'aicut_blog_realestate_card2.png'),
    path.join(imageDir, 'aicut_blog_realestate_card3.png'),
    path.join(imageDir, 'aicut_blog_realestate_cta.png'),
  ];
  
  // 이미지 개수 확인
  if (existingImages.imageCount < 5) {
    console.log(`Only ${existingImages.imageCount} images found. Need to upload more.`);
    
    // Upload missing images using file chooser
    for (let i = existingImages.imageCount; i < 5; i++) {
      // Position cursor at the right spot before each upload
      await page.evaluate((imgIndex) => {
        const ed = SmartEditor._editors['blogpc001'];
        const data = ed.getDocumentData ? ed.getDocumentData() : '';
        const dataStr = typeof data === 'string' ? data : '';
        
        // We'll place images at the end for now, then reorder in the final HTML
        ed._canvasScrollingService.focusFirstText();
      }, i);
      await page.waitForTimeout(300);
      
      // Move cursor to end of document
      await page.keyboard.press('Control+End');
      await page.waitForTimeout(200);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      
      // Click image upload button and upload file
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null),
        page.evaluate(() => {
          const btns = document.querySelectorAll('button, [role="button"], span');
          for (const b of btns) {
            const title = (b.getAttribute('title') || '').toLowerCase();
            const text = (b.innerText || '').toLowerCase();
            const cls = (b.className || '').toLowerCase();
            if (title.includes('사진') || text.includes('사진') || cls.includes('photo') || cls.includes('image-toolbar')) {
              b.click();
              return 'clicked';
            }
          }
          // Try direct span
          const spans = document.querySelectorAll('.se-image-toolbar-button span');
          for (const s of spans) {
            if (s.innerText.includes('사진')) { s.click(); return 'clicked span'; }
          }
          return 'not found';
        })
      ]);
      
      if (fileChooser) {
        await fileChooser.setFiles([imageFiles[i]]);
        console.log(`✅ Image ${i+1} uploaded`);
        await page.waitForTimeout(3000);
      }
    }
  }
  
  // 2. After upload, get all image URLs from the document
  const allImages = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData ? ed.getDocumentData() : {};
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*\/?>/g;
    const imgs = [];
    let m;
    while ((m = imgRegex.exec(dataStr)) !== null) {
      imgs.push(m[1]);
    }
    return imgs;
  });
  console.log('\nAll image URLs:', allImages.map((s, i) => `  ${i+1}. ${s.slice(0, 100)}`).join('\n'));
  
  if (allImages.length >= 5) {
    // 3. Build new HTML with images properly placed
    const v3Html = fs.readFileSync(path.join(__dirname, 'blog_realestate_body_v3.html'), 'utf8');
    
    // 이미지 배치 계획:
    // main image (idx 0): 도입부 직후, H2 "🏢 영상, 진짜 효과 있을까요?" 바로 앞
    // card1 (idx 1): "🏢 영상" 섹션 내 실제 사례(릴스 2배) 설명 후
    // card2 (idx 2): H2 "📱 그래서 저희가 합니다" 바로 앞
    // card3 (idx 3): H2 "📈 하반기, 지금 시작해야 하는 이유" 바로 앞
    // cta (idx 4): 체크리스트 후, 연락처 바로 앞
    
    // v3 본문에 이미지 태그 삽입
    let v4Html = v3Html;
    
    // 1) main image: 첫 번째 <h2> 앞 (= 도입부와 본격 내용 사이)
    const firstH2 = v4Html.indexOf('<h2');
    v4Html = v4Html.slice(0, firstH2) + 
      `<p style="text-align: center;"><img src="${allImages[0]}" alt="부동산 영상 마케팅 숏폼 편집 아웃소싱" style="width:100%;max-width:700px;border-radius:12px;"></p>\n\n` +
      v4Html.slice(firstH2);
    
    // 2) card1: "🏢 영상" 섹션 내, "문의가 두 배로 늘었습니다." 뒤
    const insert1 = `문의가 두 배로 늘었습니다.</p>`;
    const pos1 = v4Html.indexOf(insert1) + insert1.length;
    v4Html = v4Html.slice(0, pos1) +
      `\n\n<p style="text-align: center;"><img src="${allImages[1]}" alt="부동산 중개법인 매물 영상 마케팅" style="width:100%;max-width:600px;border-radius:12px;"></p>` +
      v4Html.slice(pos1);
    
    // 3) card2: H2 "📱 그래서 저희가 합니다" 앞
    const target2 = `<h2 style="text-align: center;">📱 그래서 저희가 합니다</h2>`;
    const pos2 = v4Html.indexOf(target2);
    v4Html = v4Html.slice(0, pos2) +
      `<p style="text-align: center;"><img src="${allImages[2]}" alt="숏폼 영상 편집 아웃소싱 프로세스" style="width:100%;max-width:600px;border-radius:12px;"></p>\n\n` +
      v4Html.slice(pos2);
    
    // 4) card3: H2 "📈 하반기" 앞
    const target3 = `<h2 style="text-align: center;">📈 하반기, 지금 시작해야 하는 이유</h2>`;
    const pos3 = v4Html.indexOf(target3);
    v4Html = v4Html.slice(0, pos3) +
      `<p style="text-align: center;"><img src="${allImages[3]}" alt="하반기 부동산 분양 마케팅 전략" style="width:100%;max-width:600px;border-radius:12px;"></p>\n\n` +
      v4Html.slice(pos3);
    
    // 5) cta image: 연락처 바로 앞
    const target5 = `<p style="text-align: center;">💬 <strong>카카오톡 문의:</strong>`;
    const pos5 = v4Html.indexOf(target5);
    v4Html = v4Html.slice(0, pos5) +
      `<p style="text-align: center;"><img src="${allImages[4]}" alt="영상 편집 아웃소싱 무료 상담" style="width:100%;max-width:600px;border-radius:12px;"></p>\n\n` +
      v4Html.slice(pos5);
    
    // 4. Save the new HTML and paste into SE4
    fs.writeFileSync(path.join(__dirname, 'blog_realestate_body_v4.html'), v4Html);
    console.log('\n✅ v4 HTML saved with images');
    
    // 5. Set clipboard with v4
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const plainText = v4Html.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n');
    
    await page.evaluate(async ({html, text}) => {
      const htmlBlob = new Blob([html], {type: 'text/html'});
      const textBlob = new Blob([text], {type: 'text/plain'});
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
      ]);
    }, { html: v4Html, text: plainText });
    console.log('✅ Clipboard set with v4');
    await page.waitForTimeout(500);
    
    // 6. Replace all content
    await page.evaluate(() => {
      SmartEditor._editors['blogpc001']._canvasScrollingService.focusFirstText();
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+A');
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+V');
    await page.waitForTimeout(3000);
    console.log('✅ Content replaced');
    
    // 7. Save
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
    console.log('✅ Saved');
    
    // 8. Verify
    const finalCheck = await page.evaluate(() => {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData ? ed.getDocumentData() : '';
      const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
      const imgCount = (dataStr.match(/<img[^>]+>/g) || []).length;
      return { dataLength: dataStr.length, imageCount: imgCount };
    });
    console.log('Final check:', JSON.stringify(finalCheck));
    
  } else {
    console.log('❌ Not enough images uploaded');
  }
  
  await page.screenshot({ path: 'blog_with_images.png', fullPage: false });
  console.log('Screenshot saved');
})();

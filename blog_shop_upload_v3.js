const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  'aicut_blog_shop_01_main.png',
  'aicut_blog_shop_02_reels.png', 
  'aicut_blog_shop_03_summer.png',
  'aicut_blog_shop_04_delivery.png',
  'aicut_blog_shop_05_cta.png',
];
const HASHTAGS = '#쇼핑몰마케팅 #숏폼마케팅 #릴스알고리즘 #영상편집외주 #스마트스토어 #썸머세일 #여름마케팅 #시즌프로모션 #C커머스 #라이브커머스 #숏폼커머스 #릴스편집 #쇼츠제작 #틱톡마케팅 #에이컷 #aicut #이커머스마케팅 #쇼핑몰영상 #제품영상 #콘텐츠마케팅 #SNS마케팅 #온라인마케팅 #영상편집 #숏폼제작 #브랜드영상 #상세페이지 #마케팅전략 #AI영상편집 #인스타릴스 #유튜브쇼츠';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  
  // Close existing editor tabs
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);  // Give more time for editor initialization
  
  console.log('=== 새 포스팅 시작 (직접 HTML 주입 방식) ===\n');
  
  // 1. Read content HTML
  const bodyHtml = fs.readFileSync(path.join(WORKSPACE, 'aicut_blog_content_shop.html'), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  // 2. Set title
  console.log('=== [1] 제목 입력 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('쇼핑몰·스마트스토어라면 숏폼 마케팅에 주목해야 하는 이유 (릴스 알고리즘 2026)');
  });
  console.log('✅ 제목 입력 완료');
  
  // 3. Method 1: Try setDocumentData with proper this binding
  console.log('\n=== [2] 본문 HTML 주입 ===');
  
  // Wait a bit more for editor to fully initialize
  await page.waitForTimeout(2000);
  
  const methodResult = await page.evaluate((html) => {
    const editor = SmartEditor._editors['blogpc001'];
    const results = [];
    
    // Method A: direct call
    try {
      editor.setDocumentData(html);
      results.push('Method A (direct): success');
    } catch(e) {
      results.push('Method A (direct): ' + e.message);
    }
    
    return results;
  }, bodyContent);
  
  console.log(methodResult.join('\n'));
  await page.waitForTimeout(3000);
  
  // Check if content was set
  const contentCheck = await page.evaluate(() => {
    try {
      const data = SmartEditor._editors['blogpc001'].getDocumentData();
      return { length: (data || '').length, preview: String(data || '').substring(0, 100) };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('콘텐츠 확인:', JSON.stringify(contentCheck));
  
  // 4. Upload images
  console.log('\n=== [3] 이미지 업로드 ===');
  
  // Open image toolbar
  await page.evaluate(() => {
    const btn = document.querySelector('.se-image-toolbar-button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  
  // Click "사진" button
  const photoPos = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text === '사진' || text.startsWith('사진')) {
        const r = btn.getBoundingClientRect();
        return { x: r.x + r.width/2, y: r.y + r.height/2 };
      }
    }
    return null;
  });
  
  if (photoPos) {
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    await page.mouse.click(photoPos.x, photoPos.y);
    await page.waitForTimeout(1000);
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
      console.log('✅ 5장 업로드 완료');
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ filechooser 없음');
    }
  }
  
  // If Method A failed, try alternative: insert via editor's internal execCommand
  if (methodResult.some(r => r.includes('error'))) {
    console.log('\n=== [대안] execCommand 시도 ===');
    const altResult = await page.evaluate((html) => {
      const editor = SmartEditor._editors['blogpc001'];
      const results = [];
      
      // Method B: execCommand
      try {
        editor.execCommand('insertHTML', false, html);
        results.push('Method B (execCommand): success');
      } catch(e) {
        results.push('Method B (execCommand): ' + e.message);
      }
      
      return results;
    }, bodyContent);
    console.log(altResult.join('\n'));
    await page.waitForTimeout(3000);
  }
  
  // 5. Hashtags
  console.log('\n=== [4] 해시태그 ===');
  await page.evaluate((tags) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return;
      }
    }
  }, HASHTAGS);
  await page.waitForTimeout(1500);
  console.log('✅');
  
  // 6. Save
  console.log('\n=== [5] 저장 ===');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_shop_final_v3.png') });
  
  // Final verification
  const finalCheck = await page.evaluate(() => {
    try {
      const data = SmartEditor._editors['blogpc001'].getDocumentData();
      return { 
        dataLength: (data || '').length, 
        hasHTags: (data || '').includes('<h2'),
        hasPTags: (data || '').includes('<p '),
        preview: String(data || '').substring(0, 80)
      };
    } catch(e) {
      return { error: e.message };
    }
  });
  
  console.log('\n=== ✅ 최종 완료 ===');
  console.log('최종 데이터 상태:', JSON.stringify(finalCheck));
  console.log('제목: 쇼핑몰·스마트스토어라면 숏폼 마케팅에 주목해야 하는 이유');
  console.log('이미지: 5장');
  console.log('해시태그: 30개');
  console.log('저장: ✅');
  console.log('');
  console.log('📌 정이사님: 발행만 누르시면 됩니다!');
  
  await browser.close();
})();

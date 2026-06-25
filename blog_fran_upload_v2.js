const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  'aicut_blog_fran_01_main.png',
  'aicut_blog_fran_02_why.png', 
  'aicut_blog_fran_03_summer.png',
  'aicut_blog_fran_04_delivery.png',
  'aicut_blog_fran_05_cta.png',
];
const HASHTAGS = '#프랜차이즈 #영상마케팅 #숏폼마케팅 #영상편집외주 #가맹모집 #창업트렌드 #소자본창업 #썸머시즌 #여름마케팅 #하계프로모션 #릴스편집 #쇼츠제작 #틱톡마케팅 #에이컷 #aicut #프랜차이즈마케팅 #가맹점홍보 #영상편집 #숏폼제작 #콘텐츠마케팅 #SNS마케팅 #프랜차이즈본사 #브랜드영상 #메뉴홍보 #시즌프로모션 #가맹점모집 #온라인마케팅 #영상제작 #비즈니스영상 #AI영상편집';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  
  // Close existing editor tabs
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  console.log('=== 프랜차이즈 블로그 포스팅 (v2) ===');
  
  // 1. Title
  console.log('\n=== [1/5] 제목 입력 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('프랜차이즈 본사라면 영상 마케팅 아웃소싱이 답인 이유 (feat. 썸머 시즌)');
  });
  console.log('✅');
  
  // 2. Paste body first
  console.log('\n=== [2/5] 본문 붙여넣기 ===');
  const bodyHtml = fs.readFileSync(path.join(WORKSPACE, 'aicut_blog_content_fran.html'), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  await page.evaluate((html) => navigator.clipboard.writeText(html), bodyContent);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅');
  
  // 3. Upload images
  console.log('\n=== [3/5] 이미지 업로드 (5장) ===');
  
  // Step 3a: Click image toolbar button to open panel
  await page.evaluate(() => {
    const btn = document.querySelector('.se-image-toolbar-button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  
  // Step 3b: Click "사진" button in panel
  const photoBtnPos = await page.evaluate(() => {
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
  
  if (photoBtnPos) {
    console.log('사진 버튼 위치:', photoBtnPos);
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    await page.mouse.click(photoBtnPos.x, photoBtnPos.y);
    await page.waitForTimeout(1000);
    
    const fc = await fcPromise;
    if (fc) {
      const filePaths = IMAGES.map(f => path.join(WORKSPACE, f));
      await fc.setFiles(filePaths);
      console.log('✅ 5장 업로드 완료');
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ filechooser 없음');
    }
  } else {
    console.log('❌ 사진 버튼 못 찾음');
  }
  
  // 4. Hashtags
  console.log('\n=== [4/5] 해시태그 입력 ===');
  const tagResult = await page.evaluate((tags) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return '글감 입력됨';
      }
    }
    return '글감 input 못 찾음';
  }, HASHTAGS);
  console.log(tagResult);
  await page.waitForTimeout(1500);
  
  // 5. Save
  console.log('\n=== [5/5] 저장 ===');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_fran_v2_final.png') });
  
  console.log('\n=== ✅ 완료 ===');
  console.log('제목: 프랜차이즈 본사라면 영상 마케팅 아웃소싱이 답인 이유');
  console.log('이미지: 5장 처리');
  console.log('본문: 붙여넣기');
  console.log('해시태그: 30개');
  console.log('저장: ✅');
  
  await browser.close();
})();

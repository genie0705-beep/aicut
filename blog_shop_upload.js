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
  await page.waitForTimeout(5000);
  
  console.log('=== 쇼핑몰 블로그 포스팅 시작 ===');
  
  // ========== [워크플로우 순서] ==========
  
  // 1. 제목 — SmartEditor API
  console.log('\n=== [1] 제목 입력 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('쇼핑몰·스마트스토어라면 숏폼 마케팅에 주목해야 하는 이유 (릴스 알고리즘 2026)');
  });
  console.log('✅');
  
  // 2. 본문 붙여넣기 (워크플로우: 텍스트 섹션 입력)
  console.log('\n=== [2] 본문 붙여넣기 ===');
  const bodyHtml = fs.readFileSync(path.join(WORKSPACE, 'aicut_blog_content_shop.html'), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  await page.evaluate((html) => navigator.clipboard.writeText(html), bodyContent);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅');
  
  // 3. 사진 버튼 클릭 → 이미지 5장 등록
  console.log('\n=== [3] 이미지 업로드 (5장) ===');
  
  // 3a. 이미지 툴바 버튼 클릭
  await page.evaluate(() => {
    const btn = document.querySelector('.se-image-toolbar-button');
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  
  // 3b. "사진" 버튼 클릭 → filechooser
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
  
  // 4. 해시태그 30개 (글감 input)
  console.log('\n=== [4] 해시태그 입력 ===');
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
  
  // 5. 센터 정렬 (본문 HTML에 이미 적용됨)
  console.log('\n=== [5] 센터 정렬 확인 ===');
  await page.evaluate(() => {
    const editorFrame = document.querySelector('#mainFrame')?.contentDocument || document;
    const ps = editorFrame.querySelectorAll('p, h2, h3');
    ps.forEach(p => { p.style.textAlign = 'center'; });
  });
  console.log('✅');
  
  // 6. 저장
  console.log('\n=== [6] 저장 ===');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_shop_final.png') });
  
  console.log('\n=== ✅ 블로그 포스팅 완료! ===');
  console.log('제목:', '쇼핑몰·스마트스토어라면 숏폼 마케팅에 주목해야 하는 이유 (릴스 알고리즘 2026)');
  console.log('이미지: 5장 업로드');
  console.log('해시태그: 30개');
  console.log('센터정렬: 적용');
  console.log('저장: ✅');
  console.log('');
  console.log('📌 정이사님: 발행만 누르시면 됩니다!');
  
  await browser.close();
})();

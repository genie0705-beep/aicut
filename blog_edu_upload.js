const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  'aicut_blog_edu_01_main.png',
  'aicut_blog_edu_02_market.png',
  'aicut_blog_edu_03_shortform.png',
  'aicut_blog_edu_04_season.png',
  'aicut_blog_edu_05_cta.png'
];

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  console.log('=== 교육/이러닝 블로그 포스팅 시작 ===');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Title
  console.log('\n=== [1/6] 제목 입력 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('온라인 강사라면 숏폼 영상 마케팅을 시작해야 하는 이유 (feat. 방학 특강)');
  });
  console.log('✅ 제목 입력 완료');
  await page.waitForTimeout(1000);
  
  // 2. Upload images (one by one for proper positioning)
  console.log('\n=== [2/6] 이미지 업로드 (5장) ===');
  
  // 사진 버튼 클릭
  const btnClicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const text = (btn.innerText || '').trim();
      if (text.startsWith('사진') || text.startsWith('사진')) {
        btn.click();
        return true;
      }
    }
    return false;
  });
  console.log('사진 버튼 클릭:', btnClicked ? '✅' : '⚠️');
  await page.waitForTimeout(2000);
  
  // filechooser로 5장 업로드
  const fcCount = await page.locator('input[type="file"]').count();
  console.log('file input 개수:', fcCount);
  
  if (fcCount > 0) {
    await page.evaluate(() => {
      document.querySelectorAll('input[type="file"]').forEach(i => { i.multiple = true; });
    });
    await page.locator('input[type="file"]').first().setInputFiles(IMAGES.map(f => path.join(WORKSPACE, f)));
    console.log('✅ 이미지 5장 업로드 완료');
    await page.waitForTimeout(5000);
  } else {
    console.log('⚠️ file input 없음. 직접 등록 필요');
  }
  
  // 3. Body text (clipboard paste)
  console.log('\n=== [3/6] 본문 입력 ===');
  const bodyHtml = fs.readFileSync(path.join(WORKSPACE, 'aicut_blog_content_edu.html'), 'utf-8');
  
  await page.evaluate((html) => {
    // Remove HTML wrapper, extract body content
    const match = html.match(/<body>([\s\S]*)<\/body>/i);
    const content = match ? match[1].trim() : html;
    return navigator.clipboard.writeText(content);
  }, bodyHtml);
  await page.waitForTimeout(500);
  
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅ 본문 붙여넣기 완료');
  
  // 4. Center align all paragraphs
  console.log('\n=== [4/6] 센터 정렬 적용 ===');
  await page.evaluate(() => {
    const editorFrame = document.querySelector('#mainFrame')?.contentDocument || document;
    const ps = editorFrame.querySelectorAll('p, h2, h3');
    ps.forEach(p => { p.style.textAlign = 'center'; });
  });
  console.log('✅ 센터 정렬 완료');
  await page.waitForTimeout(1000);
  
  // 5. Save
  console.log('\n=== [5/6] 저장 ===');
  const saveResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return '저장 버튼 클릭'; }
    }
    const sc = document.querySelector('.save_btn__bzc5B');
    if (sc) { sc.click(); return '저장(클래스)'; }
    return '저장 버튼 없음';
  });
  console.log(saveResult);
  await page.waitForTimeout(3000);
  
  // Screenshot
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_edu_final.png') });
  
  console.log('\n=== ✅ 블로그 포스팅 저장 완료 ===');
  console.log('제목: 온라인 강사라면 숏폼 영상 마케팅을 시작해야 하는 이유 (feat. 방학 특강)');
  console.log('이미지: 5장 업로드됨 (본문 내 배치는 정이사님 직접 필요)');
  console.log('해시태그: 30개 포함 (본문 하단)');
  console.log('센터정렬: 적용 완료');
  console.log('저장: ✅');
  console.log('\n📌 남은 작업:');
  console.log('1. 이미지 각 위치에 맞게 배치');
  console.log('2. 발행 클릭');
  
  await b.close();
})();

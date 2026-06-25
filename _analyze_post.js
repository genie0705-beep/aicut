const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const fs = require('fs');
const path = require('path');
const W = 'C:\\Users\\paul\\.openclaw\\workspace';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  
  // 1. 기존 발행 포스팅 열기
  console.log('=== 기존 발행 포스팅 분석 ===\n');
  await page.goto('https://blog.naver.com/aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const postUrl = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    for (const a of links) {
      const h = a.href;
      if (h.match(/\/aicut\/\d+$/) && !h.includes('PostWriteForm') && !h.includes('Profile')) {
        return h;
      }
    }
    return null;
  });
  console.log('첫 번째 포스팅:', postUrl);
  
  if (!postUrl) {
    console.log('포스팅을 찾을 수 없음');
    await b.close();
    return;
  }
  
  await page.goto(postUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // 2. 포스팅 HTML 구조 분석
  const postData = await page.evaluate(() => {
    const r = {};
    const viewer = document.querySelector('.se-viewer') || document.querySelector('.se-main-container');
    if (!viewer) { r.error = 'no viewer'; return r; }
    
    r.html = viewer.innerHTML;
    r.text = viewer.innerText;
    r.imgCount = viewer.querySelectorAll('img').length;
    r.h2Count = viewer.querySelectorAll('h2').length;
    r.h3Count = viewer.querySelectorAll('h3').length;
    r.strongCount = viewer.querySelectorAll('strong').length;
    r.pCount = viewer.querySelectorAll('p').length;
    
    // 샘플 H2와 p 태그
    const h2s = viewer.querySelectorAll('h2');
    r.h2Samples = [];
    h2s.forEach(h2 => {
      if (r.h2Samples.length < 5) r.h2Samples.push(h2.innerText.substring(0, 50));
    });
    
    // 이미지 정보
    const imgs = viewer.querySelectorAll('img');
    r.imgSamples = [];
    imgs.forEach(img => {
      if (r.imgSamples.length < 3) {
        r.imgSamples.push({
          alt: img.alt?.substring(0, 50),
          src: img.src?.substring(0, 80),
          width: img.width,
          height: img.height
        });
      }
    });
    
    // CTA 확인 (맨 아래 텍스트)
    const allP = viewer.querySelectorAll('p');
    const lastTexts = [];
    for (let i = allP.length - 1; i >= Math.max(0, allP.length - 5); i--) {
      const t = allP[i].innerText?.trim();
      if (t) lastTexts.unshift(t.substring(0, 60));
    }
    r.lastParagraphs = lastTexts;
    
    return r;
  });
  
  if (postData.error) {
    console.log('뷰어 없음, body로 확인');
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Body:', bodyText);
  } else {
    console.log('H2 수:', postData.h2Count);
    console.log('H3 수:', postData.h3Count);
    console.log('Strong 수:', postData.strongCount);
    console.log('p 수:', postData.pCount);
    console.log('이미지 수:', postData.imgCount);
    console.log('\nH2 샘플:');
    postData.h2Samples.forEach((s, i) => console.log(`  ${i+1}. ${s}`));
    console.log('\n마지막 문단:');
    postData.lastParagraphs.forEach(s => console.log(`  ${s}`));
    console.log('\n이미지 샘플:');
    postData.imgSamples.forEach((s, i) => console.log(`  ${i+1}. alt:${s.alt}, ${s.width}x${s.height}`));
    
    // HTML 저장
    fs.writeFileSync(path.join(W, 'reference_post.html'), postData.html);
    console.log('\n✅ 참조 HTML 저장 완료');
  }
  
  // 3. 새 에디터를 열어서 setDocumentData + execCommand 비교 실험
  console.log('\n=== SmartEditor 데이터 구조 실험 ===');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  const testHtml = '<p style="text-align: center;">테스트 문단입니다.</p><h2 style="text-align: center;">테스트 제목</h2>';
  
  // Method A: execCommand('insertHTML')
  const resultA = await page.evaluate((html) => {
    const editor = SmartEditor._editors['blogpc001'];
    const results = {};
    try {
      editor.focusFirstText();
      editor.execCommand('insertHTML', false, html);
      results.method = 'execCommand';
      results.status = 'success';
      
      // 데이터 확인
      const data = editor.getDocumentData();
      results.components = data.document ? data.document.components.length : 0;
      results.dataPreview = JSON.stringify(data).substring(0, 200);
    } catch(e) {
      results.status = 'error: ' + e.message;
    }
    return results;
  }, testHtml);
  console.log('Method A (execCommand):', resultA.status);
  console.log('컴포넌트:', resultA.components);
  
  await page.waitForTimeout(2000);
  
  // Method B: clipboard.writeText
  const resultB = await page.evaluate(async (html) => {
    const results = {};
    try {
      await navigator.clipboard.writeText(html);
      results.method = 'writeText';
      results.status = 'clipboard OK';
    } catch(e) {
      results.status = 'error: ' + e.message;
    }
    return results;
  }, testHtml);
  console.log('\nMethod B (writeText):', resultB.status);
  
  await b.close();
})();

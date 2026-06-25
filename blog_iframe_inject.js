const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  'aicut_blog_startup_01_main.png',
  'aicut_blog_startup_02_ir.png',
  'aicut_blog_startup_03_ai.png',
  'aicut_blog_startup_04_delivery.png',
  'aicut_blog_startup_05_cta.png'
];
const TITLE = 'IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  console.log('=== iframe 직접 HTML 주입 ===\n');
  
  // 제목
  console.log('[1] 제목');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅\n');
  
  // HTML 가져오기
  const raw = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const m = raw.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = m ? m[1].trim() : raw;
  
  // iframe body에 직접 HTML 설정
  console.log('[2] iframe body.innerHTML 직접 주입');
  const injectResult = await page.evaluate((html) => {
    try {
      const iframe = document.querySelector('iframe');
      if (!iframe || !iframe.contentDocument) return 'no iframe';
      iframe.contentDocument.body.innerHTML = html;
      return 'ok, length=' + html.length;
    } catch(e) { return 'error: ' + e.message; }
  }, bodyContent);
  console.log('주입 결과:', injectResult);
  await page.waitForTimeout(2000);
  
  // 확인
  const verify = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentDocument) return { error: 'no iframe' };
    const body = iframe.contentDocument.body;
    const h2 = body.querySelectorAll('h2').length;
    const strong = body.querySelectorAll('strong, b').length;
    const p = body.querySelectorAll('p').length;
    const centers = body.querySelectorAll('[style*="text-align: center"]').length;
    const totalLen = body.innerHTML.length;
    return { h2, strong, p, centers, totalLen };
  });
  console.log('확인:', JSON.stringify(verify));
  
  // 이미지 업로드 (iframe에 설정 후, 이미지는 사진 버튼으로)
  console.log('\n[3] 이미지 업로드');
  // [이미지1]~[이미지5] 위치를 찾기 위해 섹션 분할
  const sections = bodyContent.split(/\[이미지\d+\]/);
  
  for (let i = 0; i < sections.length - 1 && i < IMAGES.length; i++) {
    // 사진 버튼 클릭
    await page.evaluate(() => {
      const btn = document.querySelector('.se-image-toolbar-button');
      if (btn) btn.click();
    });
    await page.waitForTimeout(2000);
    
    const pos = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = (b.innerText || '').trim();
        if (t === '사진' || t.startsWith('사진')) {
          const r = b.getBoundingClientRect();
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (pos) {
      const fcP = page.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
      await page.mouse.click(pos.x, pos.y);
      await page.waitForTimeout(1000);
      const fc = await fcP;
      if (fc) {
        await fc.setFiles([path.join(W, IMAGES[i])]);
        await page.waitForTimeout(3000);
        console.log(`  이미지 ${i+1}: ✅`);
      }
    }
  }
  
  // 해시태그
  console.log('\n[4] 해시태그');
  const tags = '#스타트업 #IR영상 #영상편집외주 #스타트업마케팅 #IR피칭 #AI영상편집 #생성형AI #숏폼마케팅 #하반기준비 #투자유치 #피칭영상 #스타트업브랜딩 #에이컷 #aicut #영상편집 #숏폼제작 #릴스편집 #쇼츠제작 #틱톡마케팅 #콘텐츠마케팅 #SNS마케팅 #온라인마케팅 #브랜드영상 #제품데모 #시드투자 #IR자료 #마케팅전략 #스타트업IR #인스타릴스 #유튜브쇼츠';
  await page.evaluate(t => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return;
      }
    }
  }, tags);
  await page.waitForTimeout(1500);
  console.log('✅\n');
  
  // 저장
  console.log('[5] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(8000);
  
  // === 최종 확인 ===
  console.log('\n=== 최종 확인 ===');
  const final = await page.evaluate(() => {
    const r = {};
    try {
      const ed = SmartEditor._editors['blogpc001'];
      r.title = ed.getDocumentTitle();
    } catch(e) { r.title = ''; }
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentDocument) {
      const body = iframe.contentDocument.body;
      r.htmlLen = body.innerHTML.length;
      r.textLen = body.innerText.length;
      r.h2 = body.querySelectorAll('h2').length;
      r.strong = body.querySelectorAll('strong, b').length;
      r.p = body.querySelectorAll('p').length;
      r.center = body.querySelectorAll('[style*="text-align: center"]').length;
      r.img = body.querySelectorAll('img').length;
      r.textPreview = body.innerText.substring(0, 100);
    }
    return r;
  });
  
  console.log('제목:', final.title);
  console.log('iframe HTML 길이:', final.htmlLen + ' chars');
  console.log('H2:', final.h2 + '개');
  console.log('Strong:', final.strong + '개');
  console.log('P:', final.p + '개');
  console.log('센터정렬:', final.center + '개');
  console.log('이미지:', final.img + '개');
  console.log('텍스트 미리보기:', final.textPreview);
  
  console.log('\n=== 완료 ===');
  
  await b.close();
})();

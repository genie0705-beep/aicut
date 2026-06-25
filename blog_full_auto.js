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
const HASHTAGS = '#스타트업 #IR영상 #영상편집외주 #스타트업마케팅 #IR피칭 #AI영상편집 #생성형AI #숏폼마케팅 #하반기준비 #투자유치 #피칭영상 #스타트업브랜딩 #에이컷 #aicut #영상편집 #숏폼제작 #릴스편집 #쇼츠제작 #틱톡마케팅 #콘텐츠마케팅 #SNS마케팅 #온라인마케팅 #브랜드영상 #제품데모 #시드투자 #IR자료 #마케팅전략 #스타트업IR #인스타릴스 #유튜브쇼츠';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { if (p.url().includes('PostWriteForm')) await p.close(); }
  
  const page = await ctx.newPage();
  
  console.log('=== 블로그 작성 (텍스트+이미지 순차 입력) ===\n');
  
  // 에디터 열기
  console.log('[0] 에디터 로딩...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  console.log('✅\n');
  
  // ============ HTML 파일 읽고 섹션 분할 ============
  const bodyHtml = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  // [이미지1]~[이미지5] 마커 기준으로 텍스트 섹션 분할
  const sections = bodyContent.split(/\[이미지\d+\]/).map(s => {
    // HTML 태그 제거 → 순수 텍스트
    return s
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/h2>/gi, '\n')
      .replace(/<\/h3>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }).filter(s => s.length > 0);
  
  console.log(`분할된 섹션: ${sections.length}개`);
  sections.forEach((s, i) => console.log(`  [${i+1}] ${s.substring(0, 60)}...`));
  
  // ============ 1. 제목 ============
  console.log('\n[1/5] 제목');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('스타트업 IR 피칭 영상, AI 시대에도 전문 편집이 필요한 이유');
  });
  await page.waitForTimeout(1000);
  console.log('✅\n');
  
  // ============ 2~3. 텍스트 + 이미지 순차 입력 ============
  console.log('[2/5] 텍스트 + 이미지 순차 입력');
  
  for (let i = 0; i < sections.length; i++) {
    // 텍스트 섹션 붙여넣기
    console.log(`  텍스트 ${i+1}/${sections.length}...`);
    await page.evaluate((text) => navigator.clipboard.writeText(text), sections[i]);
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(2000);
    console.log(`  ✅`);
    
    // 이미지 업로드 (마지막 섹션 제외: 마지막은 CTA + 해시태그)
    if (i < sections.length - 1 && i < IMAGES.length) {
      console.log(`  이미지 ${i+1}/${IMAGES.length}: ${IMAGES[i]}...`);
      
      // 탑메뉴 좌측 사진 버튼 클릭
      await page.evaluate(() => {
        const btn = document.querySelector('.se-image-toolbar-button');
        if (btn) btn.click();
      });
      await page.waitForTimeout(2000);
      
      // "사진" 버튼 클릭
      const pos = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          const t = (btn.innerText || '').trim();
          if (t === '사진' || t.startsWith('사진')) {
            const r = btn.getBoundingClientRect();
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
          console.log(`  ✅`);
        } else {
          console.log(`  ❌ filechooser`);
        }
      }
    }
  }
  console.log('✅ 텍스트+이미지 입력 완료\n');
  
  // ============ 4. 해시태그 ============
  console.log('[3/5] 해시태그');
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
  await page.waitForTimeout(2000);
  console.log('✅\n');
  
  // ============ 5. 저장 ============
  console.log('[4/5] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  console.log('\n=== ✅ 블로그 작성 완료 ===');
  console.log('방식: 순수 텍스트(HTML 없음) + 이미지 순차 업로드');
  console.log('텍스트 섹션:', sections.length + '개');
  console.log('이미지:', IMAGES.length + '장 직접 업로드');
  console.log('해시태그: 30개');
  console.log('');
  console.log('📌 정이사님: 발행만 누르시면 됩니다!');
  
  await b.close();
})();

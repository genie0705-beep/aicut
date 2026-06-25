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
  
  console.log('=== 블로그 새로 작성 (순수 텍스트 방식) ===\n');
  
  // 에디터 열기
  console.log('[0] 에디터 로딩...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  console.log('✅\n');
  
  // ============ HTML 파일 읽기 ============
  const bodyHtml = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  // HTML 태그 제거 → 순수 텍스트 (이미지 마커는 유지)
  const plainText = bodyContent
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
  
  console.log('=== 순수 텍스트 미리보기 ===');
  console.log(plainText.substring(0, 300) + '...\n');
  
  // ============ 1. 제목 ============
  console.log('[1/5] 제목');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('스타트업 IR 피칭 영상, AI 시대에도 전문 편집이 필요한 이유');
  });
  await page.waitForTimeout(1000);
  console.log('✅\n');
  
  // ============ 2. 본문 (순수 텍스트 붙여넣기) ============
  console.log('[2/5] 본문 (순수 텍스트)');
  await page.evaluate((text) => navigator.clipboard.writeText(text), plainText);
  await page.waitForTimeout(500);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(5000);  // 충분히 기다림
  console.log('✅\n');
  
  // ============ 3. 해시태그 ============
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
  
  // ============ 4. 저장 ============
  console.log('[4/5] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  console.log('\n=== ✅ 저장 완료 ===');
  console.log('본문 방식: 순수 텍스트 (HTML 태그 제거) → HTML 코드 노출 없음');
  console.log('');
  console.log('📌 정이사님께서 하실 일:');
  console.log('1. [이미지 등록] 탑메뉴 좌측 첫번째 사진 버튼 → 순서대로 하나씩');
  console.log('   ① aicut_blog_startup_01_main.png (대표)');
  console.log('   ② aicut_blog_startup_02_ir.png (IR 마케팅)');
  console.log('   ③ aicut_blog_startup_03_ai.png (AI 시대)');
  console.log('   ④ aicut_blog_startup_04_delivery.png (정기납품)');
  console.log('   ⑤ aicut_blog_startup_05_cta.png (CTA)');
  console.log('2. [발행]');
  
  await b.close();
})();

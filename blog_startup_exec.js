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
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  
  // 기존 에디터 탭 정리
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) await p.close();
  }
  
  const page = await ctx.newPage();
  
  console.log('=== 블로그 작성 시작 (execCommand 방식) ===\n');
  
  // 에디터 열기 (충분히 대기)
  console.log('[0] 에디터 로딩 중...');
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);  // 충분한 로딩 시간
  console.log('✅ 에디터 로딩 완료');
  
  // ============ 1. 제목 ============
  console.log('\n[1/5] 제목 입력');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('스타트업 IR 피칭 영상, AI 시대에도 전문 편집이 필요한 이유');
  });
  await page.waitForTimeout(1000);
  console.log('✅');
  
  // ============ 2. 본문 (execCommand('insertHTML') 방식) ============
  console.log('\n[2/5] 본문 입력 (execCommand)');
  
  const bodyHtml = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  // execCommand('insertHTML')로 HTML 직접 삽입
  const execResult = await page.evaluate((html) => {
    const editor = SmartEditor._editors['blogpc001'];
    try {
      editor.focusFirstText();
      editor.execCommand('insertHTML', false, html);
      return { status: 'success' };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }, bodyContent);
  console.log('execCommand:', execResult.status);
  await page.waitForTimeout(3000);
  
  // 삽입 결과 확인
  const verifyContent = await page.evaluate(() => {
    try {
      const editor = SmartEditor._editors['blogpc001'];
      const data = editor.getDocumentData();
      const comps = data.document ? data.document.components : [];
      return { componentCount: comps.length, firstTypes: comps.slice(0, 3).map(c => c.type).join(', ') };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('컴포넌트:', verifyContent.componentCount, '개');
  console.log('✅');
  
  // ============ 3. 이미지 ============
  console.log('\n[3/5] 이미지 업로드');
  console.log('   (정이사님께서 직접 등록: 사진 버튼 → 하나씩 순서대로)');
  console.log('   이미지 파일:');
  IMAGES.forEach((f, i) => console.log(`   ${i+1}. ${f}`));
  
  // ============ 4. 해시태그 ============
  console.log('\n[4/5] 해시태그 30개');
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
  console.log('✅');
  
  // ============ 5. 저장 ============
  console.log('\n[5/5] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(3000);
  
  console.log('\n=== ✅ 저장 완료 ===');
  console.log('');
  console.log('📌 남은 작업:');
  console.log('1. [이미지 등록] 탑메뉴 좌측 첫번째 사진 버튼 → 아래 순서대로 하나씩 등록');
  console.log('   순서: 대표(01_main) → 시장분석(02_ir) → AI시대(03_ai) →');
  console.log('         정기납품(04_delivery) → CTA(05_cta)');
  console.log('2. [발행] 등록 후 발행 버튼 클릭');
  
  await browser.close();
})();

const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const TITLE = 'IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책';
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
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  console.log('=== blog_fran_upload_v2 방식 ===\n');
  
  // 1. 제목
  console.log('[1] 제목');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  await page.waitForTimeout(500);
  console.log('✅\n');
  
  // 2. 본문 - clipboard.writeText (어제 방식 그대로)
  console.log('[2] 본문');
  const html = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const m = html.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = m ? m[1].trim() : html;
  
  await page.evaluate(h => navigator.clipboard.writeText(h), bodyContent);
  await page.waitForTimeout(300);
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅\n');
  
  // 3. 이미지
  console.log('[3] 이미지');
  await page.evaluate(() => { const btn = document.querySelector('.se-image-toolbar-button'); if (btn) btn.click(); });
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
      await fc.setFiles(IMAGES.map(f => path.join(W, f)));
      await page.waitForTimeout(3000);
      console.log('✅ 5장\n');
    }
  }
  
  // 4. 해시태그 (Enter 이벤트 필수)
  console.log('[4] 해시태그');
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
  }, HASHTAGS);
  await page.waitForTimeout(1500);
  
  // 해시태그 확인
  const tagCheck = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        return inp.value.split('#').filter(t => t.trim().length > 0).length;
      }
    }
    return 0;
  });
  console.log('태그 수:', tagCheck + '개 ' + (tagCheck >= 30 ? '✅' : '❌'));
  
  // 5. 저장
  console.log('\n[5] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  
  // 저장 완료 대기 (autosave_message 확인)
  await page.waitForTimeout(3000);
  let toastFound = false;
  for (let i = 0; i < 30; i++) {
    const toast = await page.evaluate(() => {
      const el = document.querySelector('[class*="autosave"]');
      return el ? (el.innerText || '').trim() : '';
    });
    if (toast) {
      console.log('토스트:', toast);
      toastFound = true;
      break;
    }
    await page.waitForTimeout(1000);
  }
  if (!toastFound) console.log('토스트: (확인 안 됨 - 30초 대기)');
  
  // 저장 완료 후 추가 대기
  await page.waitForTimeout(5000);
  
  console.log('\n✅ 저장 완료! (브라우저 유지 중)');
  if (toastFound) console.log('📌 저장 확인됨. 서버 저장 대기 중...');
  
  // 저장 완료 후 추가 대기 (브라우저 연결 유지)
  await page.waitForTimeout(15000);
  console.log('✅ 15초 추가 대기 완료');
  
  // 브라우저 닫지 않음 (저장 요청 완료 보장)
  // await b.close(); 는 제거됨
})();

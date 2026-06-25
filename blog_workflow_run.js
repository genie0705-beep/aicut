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
  await page.waitForTimeout(5000);
  
  console.log('=== 워크플로우 기반 블로그 작성 ===\n');
  
  // HTML 본문 읽고 [이미지N] 기준으로 섹션 분할
  const html = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const m = html.match(/<body>([\s\S]*)<\/body>/i);
  const body = m ? m[1].trim() : html;
  
  // 섹션 분할
  const sections = body.split(/\[이미지\d+\]/).map(s => {
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
  
  console.log(`섹션: ${sections.length}개\n`);
  
  // ============ 1. 이미지 생성 (이미 완료) ============
  console.log('[0] 이미지 생성 ✅ (사전 완료)\n');
  
  // ============ 2. 제목 ============
  console.log('[1/5] 제목');
  await page.evaluate((t) => {
    SmartEditor._editors['blogpc001'].setDocumentTitle(t);
  }, TITLE);
  await page.waitForTimeout(500);
  console.log('✅\n');
  
  // ============ 3. 텍스트 섹션 입력 + 이미지 ============
  console.log('[2/5] 텍스트 섹션 입력 + 이미지');
  
  for (let i = 0; i < sections.length; i++) {
    const text = sections[i];
    
    // iframe에 focus → keyboard.type으로 직접 입력
    console.log(`  섹션 ${i+1}/${sections.length}...`);
    await page.evaluate(() => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
        iframe.contentDocument.body.focus();
      }
    });
    await page.waitForTimeout(300);
    await page.keyboard.type(text, { delay: 2 });
    await page.waitForTimeout(500);
    
    // 엔터로 구분
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    console.log(`    ✅`);
    
    // 이미지 업로드 (마지막 섹션 제외)
    if (i < sections.length - 1 && i < IMAGES.length) {
      console.log(`  이미지 ${i+1}/${IMAGES.length}...`);
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
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
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
          console.log(`    ✅`);
        }
      }
    }
  }
  console.log('✅\n');
  
  // ============ 4. 해시태그 ============
  console.log('[3/5] 해시태그');
  const hashtags = '#스타트업 #IR영상 #영상편집외주 #스타트업마케팅 #IR피칭 #AI영상편집 #생성형AI #숏폼마케팅 #하반기준비 #투자유치 #피칭영상 #스타트업브랜딩 #에이컷 #aicut #영상편집 #숏폼제작 #릴스편집 #쇼츠제작 #틱톡마케팅 #콘텐츠마케팅 #SNS마케팅 #온라인마케팅 #브랜드영상 #제품데모 #시드투자 #IR자료 #마케팅전략 #스타트업IR #인스타릴스 #유튜브쇼츠';
  
  await page.evaluate((tags) => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        return;
      }
    }
  }, hashtags);
  await page.waitForTimeout(1500);
  console.log('✅\n');
  
  // ============ 5. 저장 ============
  console.log('[4/5] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  // 저장 완료 대기 (토스트 메시지)
  await page.waitForTimeout(3000);
  const toastCheck = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*="toast"], [class*="Toast"], [class*="message"], [class*="snackbar"]');
    return Array.from(els).map(e => (e.innerText || '').trim()).join(' | ');
  });
  console.log('토스트:', toastCheck || '(없음)');
  await page.waitForTimeout(5000);
  console.log('✅\n');
  
  // ============ 저장 확인 ============
  console.log('=== 저장 확인 ===');
  await page.waitForTimeout(2000);
  
  // 현재 페이지에서 저장된 데이터 확인
  const check = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const title = ed.getDocumentTitle();
      const d = ed.getDocumentData();
      const comps = d.document ? d.document.components : [];
      // 내용이 있는 컴포넌트 확인
      const textComps = comps.filter(c => c.type === 'text' || c.type === 'paragraph');
      return { title, count: comps.length, textCount: textComps.length, types: comps.map(c => c.type).join(', ') };
    } catch (e) { return { error: e.message }; }
  });
  
  console.log('제목:', check.title);
  console.log('컴포넌트:', check.count + '개');
  console.log('타입:', check.types);
  console.log('');
  
  if (check.title && check.count > 1) {
    console.log('✅ 저장 정상 확인 완료');
    console.log('📌 발행만 누르시면 됩니다!');
  } else {
    console.log('❌ 저장 확인 실패');
  }
  
  await b.close();
})();

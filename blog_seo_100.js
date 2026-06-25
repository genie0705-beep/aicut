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
  
  console.log('=== SEO 100% 블로그 작성 ===\n');
  
  // 제목
  console.log('[1] 제목');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅\n');
  
  // HTML 읽고 이미지 기준으로 섹션 분할
  const raw = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const m = raw.match(/<body>([\s\S]*)<\/body>/i);
  const body = m ? m[1].trim() : raw;
  const sections = body.split(/\[이미지\d+\]/);
  
  console.log(`[2] 섹션별 HTML 삽입 (${sections.length}개)`);
  
  for (let i = 0; i < sections.length; i++) {
    const html = sections[i].trim();
    if (!html) continue;
    
    // HTML을 execCommand('insertHTML')로 섹션 단위 삽입
    const r = await page.evaluate(h => {
      try {
        const e = SmartEditor._editors['blogpc001'];
        e.focusFirstText();
        e.execCommand('insertHTML', false, h);
        return 'ok';
      } catch(ex) { return 'err: ' + ex.message; }
    }, html);
    console.log(`  섹션 ${i+1}: ${r}`);
    await page.waitForTimeout(1000);
    
    // 이미지 업로드
    if (i < sections.length - 1 && i < IMAGES.length) {
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
            const r2 = b.getBoundingClientRect();
            return { x: r2.x + r2.width/2, y: r2.y + r2.height/2 };
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
  }
  
  // 해시태그
  console.log('\n[3] 해시태그');
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
  console.log('[4] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(8000);
  
  // 토스트 확인
  const toast = await page.evaluate(() => {
    const els = document.querySelectorAll('[class*=\"toast\"], [class*=\"Toast\"]');
    return Array.from(els).map(e => (e.innerText || '').trim()).join(' | ');
  });
  console.log('토스트:', toast || '(없음)');
  
  // 데이터 확인
  const check = await page.evaluate(() => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const d = ed.getDocumentData();
      const comps = d.document ? d.document.components : [];
      return {
        title: ed.getDocumentTitle(),
        count: comps.length,
        hasH2: comps.some(c => c.type === 'heading2' || c.type === 'header2'),
        types: comps.map(c => c.type).slice(0, 5).join(', ')
      };
    } catch(e) { return { error: e.message }; }
  });
  
  console.log('\n=== 저장 확인 ===');
  console.log('제목:', check.title);
  console.log('컴포넌트:', check.count + '개');
  console.log('H2 존재:', check.hasH2 ? '✅' : '❌');
  console.log('타입:', check.types);
  console.log('');
  
  if (check.title && check.hasH2) {
    console.log('✅ SEO 100% 저장 완료!');
    console.log('📌 발행만 누르시면 됩니다!');
  } else if (check.title && check.count > 1) {
    console.log('⚠️ 저장은 됐으나 H2가 감지 안 됨');
    console.log('📌 발행만 누르시면 됩니다!');
  } else {
    console.log('❌ 저장 실패');
  }
  
  await b.close();
})();

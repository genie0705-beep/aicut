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
const TITLE = 'IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책';

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  for (const p of ctx.pages()) { await p.close(); }
  
  const page = await ctx.newPage();
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(8000);
  
  console.log('=== setDocumentData 방식 ===\n');
  
  // 1. 제목
  console.log('[1] 제목');
  await page.evaluate(t => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅\n');
  
  // 2. 본문 HTML을 SmartEditor 컴포넌트 구조로 변환하여 setDocumentData
  console.log('[2] setDocumentData');
  
  const bodyHtml = fs.readFileSync(path.join(W, 'aicut_blog_content_startup.html'), 'utf-8');
  const bodyMatch = bodyHtml.match(/<body>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : bodyHtml;
  
  // 텍스트 섹션 분할 ([이미지N] 마커 기준)
  const sections = bodyContent.split(/\[이미지\d+\]/).map(s => {
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
  
  // 빈 문서 템플릿 가져오기
  const templateStr = await page.evaluate(() => {
    const d = SmartEditor._editors['blogpc001'].getDocumentData();
    return JSON.stringify(d);
  });
  const template = JSON.parse(templateStr);
  
  console.log('템플릿 컴포넌트:', template.document.components.length + '개');
  
  // sections를 SmartEditor 컴포넌트로 변환
  let seq = 0;
  const newComps = [];
  
  for (const section of sections) {
    // 문단별 분할
    const paragraphs = section.split('\n\n').filter(p => p.trim().length > 0);
    
    for (const para of paragraphs) {
      const lines = para.split('\n').filter(l => l.trim().length > 0);
      
      for (const line of lines) {
        const text = line.trim();
        if (!text || text === '[이미지]') continue;
        
        // H2 여부 판단 (이모티콘으로 시작하거나 특정 패턴)
        const isH2 = /^[📈🤖📦✨📞💭☀️🔥]/.test(text);
        
        const comp = {
          id: 'SE-auto-' + (seq++),
          layout: 'default',
          value: [{
            id: 'SE-auto-p-' + seq,
            nodes: [{
              id: 'SE-auto-n-' + seq,
              value: text,
              '@ctype': isH2 ? 'heading2' : 'textNode'
            }],
            '@ctype': isH2 ? 'heading2' : 'paragraph'
          }],
          '@ctype': 'text'
        };
        newComps.push(comp);
      }
    }
  }
  
  console.log('생성된 컴포넌트:', newComps.length + '개');
  
  // documentTitle 컴포넌트는 유지하고 나머지 교체
  template.document.components = [template.document.components[0], ...newComps];
  
  // setDocumentData 호출
  const setResult = await page.evaluate((data) => {
    try {
      SmartEditor._editors['blogpc001'].setDocumentData(data);
      return 'ok';
    } catch(e) { return 'error: ' + e.message; }
  }, template);
  console.log('setDocumentData:', setResult);
  await page.waitForTimeout(3000);
  
  // 3. 데이터 확인
  console.log('\n[3] 데이터 확인');
  const check = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const d = ed.getDocumentData();
    const comps = d.document ? d.document.components : [];
    return {
      title: ed.getDocumentTitle(),
      count: comps.length,
      types: comps.map(c => c.type || c['@ctype']).join(', ')
    };
  });
  console.log('제목:', check.title);
  console.log('컴포넌트:', check.count + '개');
  console.log('타입:', check.types);
  
  // 4. 이미지 업로드
  console.log('\n[4] 이미지 업로드');
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
      await fc.setFiles(IMAGES.map(f => path.join(W, f)));
      await page.waitForTimeout(3000);
      console.log('✅ 5장');
    }
  }
  
  // 5. 해시태그
  console.log('\n[5] 해시태그');
  await page.evaluate(t => {
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('글감')) {
        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        s.call(inp, t);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
  }, HASHTAGS);
  await page.waitForTimeout(1500);
  console.log('✅');
  
  // 6. 저장
  console.log('\n[6] 저장');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if ((btn.innerText || '').trim() === '저장') { btn.click(); return; }
    }
  });
  await page.waitForTimeout(8000);
  
  // 최종 검증
  console.log('\n=== 최종 검증 ===');
  const final = await page.evaluate(() => {
    const r = {};
    try {
      const ed = SmartEditor._editors['blogpc001'];
      r.title = ed.getDocumentTitle();
      const d = ed.getDocumentData();
      r.comps = d.document ? d.document.components.length : 0;
    } catch(e) { r.error = e.message; }
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentDocument) {
      const body = iframe.contentDocument.body;
      r.htmlLen = body.innerHTML.length;
      r.textLen = body.innerText.length;
      r.h2 = body.querySelectorAll('h2').length;
      r.textPreview = body.innerText.substring(0, 100);
    }
    return r;
  });
  
  console.log('제목:', final.title);
  console.log('컴포넌트:', final.comps + '개');
  console.log('iframe HTML:', final.htmlLen > 0 ? final.htmlLen + ' chars ✅' : '0 chars ❌');
  console.log('H2:', final.h2 + '개');
  
  if (final.title && final.htmlLen > 0) {
    console.log('\n✅ 저장 정상 완료!');
    console.log('📌 발행만 누르시면 됩니다.');
  } else {
    console.log('\n❌ 저장 검증 실패');
  }
  
  await b.close();
})();

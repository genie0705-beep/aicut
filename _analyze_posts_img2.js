const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // Dialog 자동 처리
  ctx.on('page', p => {
    p.on('dialog', async d => {
      try { await d.accept(); } catch(e) {}
    });
  });
  for (const p of ctx.pages()) {
    p.on('dialog', async d => {
      try { await d.accept(); } catch(e) {}
    });
  }
  
  // 1. 기존 포스팅 이미지 구조 분석
  const page = await ctx.newPage();
  console.log('📖 기존 포스팅 이미지 분석...\n');
  
  const posts = [
    { name: '장마기간', url: 'https://blog.naver.com/aicut/224339329768' },
  ];
  
  for (const post of posts) {
    try {
      await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      
      const imgs = await page.evaluate(() => {
        const result = [];
        // 모든 img 태그 수집
        document.querySelectorAll('img').forEach((img, i) => {
          const src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          const w = img.naturalWidth || img.width || 0;
          const h = img.naturalHeight || img.height || 0;
          const style = img.getAttribute('style') || '';
          if (src.includes('blogfiles') || src.includes('naver')) {
            result.push({ idx: i, w, h, alt: alt.substring(0, 40), style: style.substring(0, 80), src: src.substring(0, 80) });
          }
        });
        return result;
      });
      
      console.log(`[${post.name}] 블로그 이미지 ${imgs.length}장`);
      imgs.forEach(img => {
        console.log(`  ${img.idx}: ${img.w}x${img.h} | alt="${img.alt}" | ${img.src}`);
      });
      
      // 이미지의 부모 구조 분석
      const structure = await page.evaluate(() => {
        const result = [];
        const imgContainers = document.querySelectorAll('.se-module-image, [class*="se-module"]');
        imgContainers.forEach((c, i) => {
          const cls = c.className.substring(0, 50);
          const imgs = c.querySelectorAll('img');
          const style = c.getAttribute('style') || '';
          const align = c.getAttribute('align') || '';
          result.push({ idx: i, class: cls, imgCount: imgs.length, style: style.substring(0, 60), align });
        });
        return result.slice(0, 10);
      });
      console.log('  이미지 컨테이너:', JSON.stringify(structure, null, 2));
      
    } catch(e) {
      console.log(`[${post.name}] ❌ ${e.message}`);
    }
  }
  
  // 2. 6/28 피부과 포스팅도 확인
  try {
    await page.goto('https://blog.naver.com/aicut/224329284493', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(3000);
    
    const refImgs = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('img').forEach((img, i) => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        if (src.includes('blogfiles') || src.includes('naver')) {
          result.push({ idx: i, w, h, alt: alt.substring(0, 40) });
        }
      });
      return result;
    });
    console.log('\n[피부과 레퍼런스] 이미지:', refImgs.length + '장');
    refImgs.forEach(img => {
      console.log(`  ${img.idx}: ${img.w}x${img.h} alt="${img.alt}"`);
    });
  } catch(e) {
    console.log('레퍼런스 ❌', e.message);
  }
  
  await page.close();
  
  // 3. PostWriteForm 에디터 분석 (새 탭)
  console.log('\n🔍 SE4 에디터 분석...');
  const editorPage = await ctx.newPage();
  editorPage.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  
  await editorPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  const editorAnalysis = await editorPage.evaluate(() => {
    const r = {};
    
    // 1. SE4 모듈 구조
    const modules = document.querySelectorAll('[class*="se-module"]');
    r.moduleTypes = {};
    modules.forEach(m => {
      const cls = Array.from(m.classList).join(' ');
      const firstCls = cls.split(/\s+/).find(c => c.startsWith('se-module')) || 'unknown';
      r.moduleTypes[firstCls] = (r.moduleTypes[firstCls] || 0) + 1;
    });
    
    // 2. iframe 접근
    const iframes = document.querySelectorAll('iframe');
    r.iframes = iframes.length;
    iframes.forEach((f, i) => {
      try {
        const doc = f.contentDocument || f.contentWindow?.document;
        if (doc) {
          r['iframe' + i + '_bodyLen'] = doc.body?.innerHTML?.length || 0;
          r['iframe' + i + '_bodyText'] = (doc.body?.innerText || '').substring(0, 50);
        }
      } catch(e) { r['iframe' + i + '_err'] = e.message; }
    });
    
    // 3. 이미지 업로드 관련 요소
    const allEls = document.querySelectorAll('button, li, [role="menuitem"], [class*="menu"]');
    r.imageRelated = [];
    allEls.forEach(el => {
      const t = (el.innerText || '').trim();
      const cls = (el.className || '') + '';
      if (t.includes('사진') || t.includes('이미지') || cls.includes('image') || cls.includes('photo')) {
        r.imageRelated.push({ text: t.substring(0, 15), cls: cls.substring(0, 30), tag: el.tagName, visible: el.offsetParent !== null });
      }
    });
    
    // 4. file input
    r.fileInputs = document.querySelectorAll('input[type="file"]').length;
    
    return r;
  });
  
  console.log('  모듈:', JSON.stringify(editorAnalysis.moduleTypes));
  console.log('  iframes:', editorAnalysis.iframes);
  console.log('  이미지 관련:', JSON.stringify(editorAnalysis.imageRelated));
  console.log('  file inputs:', editorAnalysis.fileInputs);
  if (editorAnalysis.iframe0_bodyLen) {
    console.log('  iframe0 body:', editorAnalysis.iframe0_bodyLen + ' chars');
  }
  
  // 4. 이미지 추가 버튼 클릭 테스트
  console.log('\n🔧 이미지 업로드 버튼 테스트...');
  
  // 하단 툴바 찾기
  const toolbarInfo = await editorPage.evaluate(() => {
    // SE 툴바 버튼
    const seToolbar = document.querySelector('[class*="toolbar"]');
    if (seToolbar) {
      const btns = seToolbar.querySelectorAll('button, a');
      return Array.from(btns).map(b => ({
        text: (b.innerText || '').trim().substring(0, 10),
        cls: (b.className || '').substring(0, 30),
        tag: b.tagName
      }));
    }
    return 'no toolbar found';
  });
  console.log('  툴바:', JSON.stringify(toolbarInfo).substring(0, 300));
  
  // 이미지 버튼 찾기
  const imgBtnInfo = await editorPage.evaluate(() => {
    // "사진"이라는 텍스트를 가진 모든 요소
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.offsetParent === null) continue;
      const t = (el.innerText || '').trim();
      if (t === '사진') {
        const rect = el.getBoundingClientRect();
        return { text: t, tag: el.tagName, cls: (el.className || '').substring(0, 40), x: rect.x, y: rect.y, w: rect.width, h: rect.height };
      }
    }
    return null;
  });
  console.log('  사진 버튼 위치:', JSON.stringify(imgBtnInfo));
  
  await b.close();
  console.log('\n✅ 분석 완료');
})().catch(e => console.error('❌ 오류:', e.message));

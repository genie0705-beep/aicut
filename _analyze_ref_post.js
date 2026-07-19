const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const REF_URL = 'https://m.blog.naver.com/aicut/224329573617';
const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  for (const p of ctx.pages()) {
    p.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  }
  
  const page = await ctx.newPage();
  
  // 1. 레퍼런스 포스팅 열기
  console.log('📖 레퍼런스 포스팅 분석:', REF_URL);
  await page.goto(REF_URL, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(4000);
  
  // 모바일 페이지의 전체 HTML 구조 분석
  const pageInfo = await page.evaluate(() => {
    return {
      url: location.href,
      title: document.title,
      meta: Array.from(document.querySelectorAll('meta[property]')).map(m => ({ p: m.getAttribute('property'), c: m.getAttribute('content')?.substring(0, 100) })),
    };
  });
  console.log('  Title:', pageInfo.title);
  
  // 모든 이미지 상세 분석
  const imgs = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('img').forEach((img, i) => {
      const src = img.getAttribute('src') || '';
      if (src && src.length > 10 && !src.includes('icon') && !src.includes('logo') && !src.includes('blank')) {
        const parent = img.parentElement;
        const grandParent = parent?.parentElement;
        result.push({
          idx: i,
          src: src.substring(0, 120),
          alt: (img.getAttribute('alt') || '').substring(0, 50),
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          parentTag: parent?.tagName || '',
          parentClass: (parent?.className || '').substring(0, 60),
          grandClass: (grandParent?.className || '').substring(0, 60),
          style: (img.getAttribute('style') || '').substring(0, 100),
        });
      }
    });
    return result;
  });
  
  console.log(`\n  총 ${imgs.length}개 이미지 발견`);
  imgs.forEach(img => {
    console.log(`  [${img.idx}] ${img.width}x${img.height}`);
    console.log(`       src: ${img.src}`);
    console.log(`       alt: ${img.alt}`);
    console.log(`       parent: <${img.parentTag} class="${img.parentClass}">`);
    console.log(`       grand: <${img.grandClass}>`);
    console.log(`       style: ${img.style}`);
    console.log('');
  });
  
  // 블로그 본문 영역 찾기
  const articleHtml = await page.evaluate(() => {
    // 모바일 본문 영역
    const article = document.querySelector('.se-main-container, .post-content, article, .content, #content, .se-section');
    if (article) {
      return {
        tag: article.tagName,
        class: article.className.substring(0, 80),
        htmlLen: article.innerHTML.length,
        textLen: article.innerText.length,
        imgCount: article.querySelectorAll('img').length,
      };
    }
    return null;
  });
  console.log('본문 영역:', JSON.stringify(articleHtml));
  
  // 2. PC버전도 확인
  console.log('\n📖 PC 버전도 확인...');
  const pcUrl = REF_URL.replace('m.blog', 'blog');
  await page.goto(pcUrl, { waitUntil: 'networkidle', timeout: 20000 });
  await sleep(4000);
  
  const pcImgs = await page.evaluate(() => {
    const result = [];
    document.querySelectorAll('img').forEach((img, i) => {
      const src = img.getAttribute('src') || '';
      if (src && src.length > 10 && !src.includes('icon') && !src.includes('blank') && !src.includes('pstatic')) {
        result.push({
          idx: i,
          src: src.substring(0, 120),
          alt: (img.getAttribute('alt') || '').substring(0, 40),
          w: img.naturalWidth || img.width,
          h: img.naturalHeight || img.height,
          style: (img.getAttribute('style') || '').substring(0, 80),
        });
      }
    });
    return result;
  });
  
  console.log(`PC 이미지 ${pcImgs.length}개`);
  pcImgs.forEach(img => {
    console.log(`  [${img.idx}] ${img.w}x${img.h} | ${img.src}`);
  });
  
  // 3. PC버전 본문 HTML 구조 (이미지 주변 태그)
  if (pcImgs.length > 0) {
    const imgStructure = await page.evaluate(() => {
      const result = [];
      const seModules = document.querySelectorAll('[class*="se-module"]');
      seModules.forEach((mod, i) => {
        const cls = Array.from(mod.classList).join(' ');
        const imgs = mod.querySelectorAll('img');
        const align = mod.getAttribute('style') || mod.getAttribute('align') || '';
        result.push({ idx: i, class: cls.split(/\s+/).slice(0, 3).join(' '), imgCount: imgs.length, align: align.substring(0, 60) });
      });
      return result;
    });
    console.log('\nSE 모듈 구조:');
    imgStructure.forEach(s => console.log(`  [${s.idx}] ${s.class} | img:${s.imgCount} | ${s.align}`));
  }
  
  // 4. SE4 에디터 데이터 구조 분석 (PostWriteForm 열기)
  console.log('\n🔍 SE4 에디터 이미지 구조 분석...');
  
  // PostWriteForm 열기
  const editorPage = await ctx.newPage();
  editorPage.on('dialog', async d => { try { await d.accept(); } catch(e) {} });
  await editorPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  // "작성중인 글이 있습니다" dialog 처리
  // Dialog 자동 accept 설정되어 있으니 자동 처리됨
  await sleep(2000);
  
  // SE4 API로 빈 에디터의 컴포넌트 구조 확인
  const emptyEditor = await editorPage.evaluate(() => {
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      const comps = d.document?.components || [];
      return {
        compCount: comps.length,
        types: comps.map(c => ({ type: c.type || c['@ctype'], keys: Object.keys(c).join(',') }))
      };
    } catch(e) { return { error: e.message }; }
  });
  console.log('현재 에디터:', JSON.stringify(emptyEditor));
  
  // 5. 이미지 추가 시도 - "사진" floating 버튼
  console.log('\n🔧 floating 이미지 버튼 찾기...');
  const floatingBtns = await editorPage.evaluate(() => {
    const result = [];
    const all = document.querySelectorAll('button, [role="button"], a');
    all.forEach(el => {
      const cls = (el.className || '') + '';
      const t = (el.innerText || '').trim();
      if (cls.includes('floating') && el.offsetParent !== null) {
        result.push({ tag: el.tagName, cls: cls.substring(0, 50), text: t.substring(0, 10) });
      }
    });
    return result;
  });
  console.log('Floating 버튼:', JSON.stringify(floatingBtns));
  
  // floating category button photo 찾기
  const fpBtn = await editorPage.evaluate(() => {
    const btn = document.querySelector('.se-floating-category-button-ph, [class*="floating"][class*="photo"]');
    if (btn && btn.offsetParent !== null) {
      const r = btn.getBoundingClientRect();
      return { found: true, x: r.x, y: r.y, w: r.width, h: r.height };
    }
    return { found: false };
  });
  console.log('Floating photo 버튼:', JSON.stringify(fpBtn));
  
  await page.close();
  await editorPage.close();
  await b.close();
  
  console.log('\n✅ 분석 완료');
})().catch(e => console.error('❌ 오류:', e.message));

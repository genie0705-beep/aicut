const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 기존 블로그 포스팅 분석
  const page = await ctx.newPage();
  
  // 1. 기존 발행된 포스팅 열기 (싸이 흠뻑쇼 - 가장 최근 Blokey 포스팅)
  console.log('📖 기존 포스팅 이미지 분석중...\n');
  
  const posts = [
    { name: '싸이 흠뻑쇼 2026', url: 'https://blog.naver.com/aicut/224339358618' },
    { name: '장마기간', url: 'https://blog.naver.com/aicut/224339329768' },
    { name: '빅뱅 콘서트 2026', url: 'https://blog.naver.com/aicut/224339329908' }
  ];
  
  for (const post of posts) {
    try {
      await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(3000);
      
      const imgInfo = await page.evaluate((name) => {
        const imgs = document.querySelectorAll('#post-area img, .se-module-image img, img[src*="blogfiles"]');
        const result = [];
        imgs.forEach((img, i) => {
          const src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          const w = img.naturalWidth || img.width || 0;
          const h = img.naturalHeight || img.height || 0;
          const style = img.getAttribute('style') || '';
          result.push({ idx: i, w, h, alt: alt.substring(0, 40), style: style.substring(0, 80), srcPrefix: src.substring(0, 60) });
        });
        return result;
      }, post.name);
      
      console.log(`[${post.name}] 이미지 ${imgInfo.length}장:`);
      imgInfo.forEach(img => {
        console.log(`  ${img.idx}: ${img.w}x${img.h} alt="${img.alt}" style="${img.style}"`);
      });
      console.log('');
    } catch(e) {
      console.log(`[${post.name}] ❌ ${e.message}`);
    }
  }
  
  // 2. PostWriteForm에서 빈 에디터의 이미지 구조 분석
  console.log('🔍 SE4 에디터 분석...');
  
  // 이미지 등록을 위한 에디터 검사
  const editorPage = await ctx.newPage();
  await editorPage.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(10000);
  
  // "작성 중인 글이 있습니다" 알림 처리
  const alertHandled = await editorPage.evaluate(() => {
    // 다이얼로그 확인 버튼
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t === '확인' || t === '네' || t === '예') {
        btn.click();
        return 'clicked ' + t;
      }
    }
    return 'no confirm btn';
  });
  console.log('  알림 처리:', alertHandled);
  await sleep(3000);

  // SE4 에디터 컴포넌트 구조 분석
  const editorInfo = await editorPage.evaluate(() => {
    const r = {};
    try {
      const d = SmartEditor._editors['blogpc001'].getDocumentData();
      const comps = d.document ? d.document.components : [];
      r.compCount = comps.length;
      r.types = comps.map((c, i) => {
        const type = c.type || c['@ctype'] || '?';
        let detail = '';
        if (type === 'image' || type === 'multimedia') detail = 'image_file';
        if (type === 'text') detail = (c.text || '').substring(0, 30);
        if (type === 'heading') detail = 'heading:' + (c.text || '').substring(0, 20);
        return `${i}:${type} ${detail}`;
      });
    } catch(e) { r.error = e.message; }
    
    // 에디터 UI 구조
    r.ui = {};
    const imgs = document.querySelectorAll('img[class*="image"], .se-image, [class*="se-module-image"]');
    r.ui.imgElements = imgs.length;
    
    // toolbar buttons
    const toolbarBtns = document.querySelectorAll('[class*="toolbar"] button, [class*="toolbar"] a');
    r.ui.toolbarBtns = toolbarBtns.length;
    
    return r;
  });
  
  console.log('\n  에디터 상태:', JSON.stringify(editorInfo, null, 2).substring(0, 500));
  
  // 3. 이미지 업로드 메커니즘 분석
  console.log('\n🔧 이미지 업로드 메커니즘 분석...');
  
  const uploadInfo = await editorPage.evaluate(() => {
    const r = {};
    
    // SE-module-image 컴포넌트 찾기
    const modules = document.querySelectorAll('[class*="se-module"]');
    r.moduleTypes = {};
    modules.forEach(m => {
      const cls = Array.from(m.classList).join(' ');
      const key = cls.split(/\s+/)[0] || 'unknown';
      r.moduleTypes[key] = (r.moduleTypes[key] || 0) + 1;
    });
    
    // 이미지 관련 버튼들
    const allBtns = document.querySelectorAll('button');
    r.imgBtns = [];
    allBtns.forEach(b => {
      const t = (b.innerText || '').trim();
      const cls = b.className || '';
      if (t.includes('사진') || t.includes('이미지') || cls.includes('image') || cls.includes('photo')) {
        r.imgBtns.push({ text: t.substring(0, 20), cls: cls.substring(0, 40) });
      }
    });
    
    // file input
    r.fileInputs = document.querySelectorAll('input[type="file"]').length;
    
    return r;
  });
  
  console.log('  모듈:', JSON.stringify(uploadInfo.moduleTypes));
  console.log('  이미지 버튼:', JSON.stringify(uploadInfo.imgBtns));
  console.log('  file inputs:', uploadInfo.fileInputs);
  
  await b.close();
  console.log('\n✅ 분석 완료');
})().catch(e => console.error('❌ 오류:', e.message));

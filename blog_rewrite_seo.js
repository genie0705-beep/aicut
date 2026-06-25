const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = 'IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책';

// 순수 텍스트 본문 (HTML 태그 없음, keyboard.type용)
const BODY_TEXT = fs.readFileSync('blog_body.txt', 'utf8');

async function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();

  let page;
  if (pages.length > 0) { page = pages[0]; }
  else { page = await ctx.newPage(); }
  page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });

  // 에디터 접속
  if (!page.url().includes('PostWriteForm')) {
    await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
  }
  console.log('URL:', page.url().substring(0, 80));

  // 제목 설정
  await page.evaluate((t) => {
    const e = window.SmartEditor?._editors?.['blogpc001'];
    if (e && e.setDocumentTitle) e.setDocumentTitle(t);
  }, TITLE);
  console.log('제목: ✅');
  await delay(500);

  // 기존 내용 삭제 (전체 선택 후 Delete)
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    const body = doc.querySelector('[contenteditable="true"]');
    if (!body) return;
    body.focus();
    body.innerHTML = '';
  });
  await delay(500);

  // keyboard.type으로 본문 입력 (React 이벤트 직접 처리)
  console.log('keyboard.type 입력 시작 (2,376자)...');
  const start = Date.now();
  await page.keyboard.type(BODY_TEXT, { delay: 2 });
  const sec = Math.round((Date.now() - start) / 1000);
  console.log(`본문 입력 완료 (${sec}초)`);
  await delay(2000);

  // Papyrus 문서 모델 직접 수정 (H2 + bold + center)
  console.log('Papyrus 수정 중...');
  const fixResult = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return 'editor 없음';
    
    // getDocumentData로 현재 데이터 조회
    const data = editor.getDocumentData();
    const comps = data.document.components;
    
    let h2Count = 0, boldCount = 0, centerCount = 0;
    
    for (const comp of comps) {
      if (comp['@ctype'] !== 'text') continue;
      const paras = comp.value || [];
      
      for (let pi = 0; pi < paras.length; pi++) {
        const p = paras[pi];
        if (!p.nodes || p.nodes.length === 0) continue;
        
        const text = p.nodes.map(n => n.value || '').join('').trim();
        
        // === H2: 섹션 제목 감지 ===
        const isSectionHeader = /^[📉🤖💡✨✅🚀]/.test(text);
        if (isSectionHeader) {
          p.type = 'header2';
          p.textAlign = 'center';
          h2Count++;
        }
        
        // === Bold: 키워드 포함 노드 ===
        const boldKws = ['IR 피칭 영상', 'AI 영상 편집', '스타트업 마케팅', 
          '숏폼 마케팅', '릴스 알고리즘', '에이컷', 'AICUT',
          '상반기 마케팅', '하반기 준비', '여름 마케팅', '전문 에디터'];
        
        for (const node of p.nodes) {
          if (node['@ctype'] === 'textNode' && node.value) {
            for (const kw of boldKws) {
              if (node.value.includes(kw)) {
                node.bold = true;
                boldCount++;
                break;
              }
            }
          }
        }
        
        // === Center: 모든 paragraph ===
        if (text.length > 0) {
          p.textAlign = 'center';
          centerCount++;
        }
      }
    }
    
    // === setDocumentData로 적용 ===
    try {
      editor.setDocumentData(data);
      return { h2: h2Count, bold: boldCount, center: centerCount, status: 'ok' };
    } catch(e) {
      return { error: e.message, h2: h2Count };
    }
  });
  console.log('수정 결과:', JSON.stringify(fixResult));
  await delay(1000);

  // 저장
  if (fixResult.h2 > 0 || fixResult.center > 0) {
    console.log('저장 중...');
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent.trim() === '저장') { btn.click(); return; }
      }
    });
    await delay(3000);
    
    // 저장 후 재확인
    const after = await page.evaluate(() => {
      const editor = window.SmartEditor?._editors?.['blogpc001'];
      if (!editor) return '❌';
      const data = editor.getDocumentData();
      const comps = data.document.components;
      let h2 = 0, bold = 0, center = 0, textLen = 0;
      for (const c of comps) {
        if (c['@ctype'] !== 'text') continue;
        for (const p of (c.value || [])) {
          if (p.type === 'header2') h2++;
          if (p.textAlign === 'center') center++;
          for (const n of (p.nodes || [])) {
            if (n.bold) bold++;
            textLen += (n.value || '').length;
          }
        }
      }
      return { h2, bold, center, textLen, comps: comps.length };
    });
    console.log('저장 후:', JSON.stringify(after));
  }

  // 이미지 등록 시도
  console.log('\n이미지 등록 시도...');
  const imgs = ['aicut_blog_startup_thumb.png','aicut_blog_startup_problem.png','aicut_blog_startup_compare.png','aicut_blog_startup_insight.png','aicut_blog_startup_cta.png'];
  const imgDir = 'C:\\Users\\paul\\.openclaw\\workspace';
  
  for (let i = 0; i < imgs.length; i++) {
    console.log(`  ${i+1}/${imgs.length}: ${imgs[i]}`);
    const clicked = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const t = btn.textContent.trim();
        if (t === '사진' || t === '사진 추가') { btn.click(); return true; }
      }
      return false;
    });
    if (!clicked) { console.log('   ❌ 사진 버튼 없음'); break; }
    await delay(1500);
    const [fc] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
      delay(500)
    ]);
    if (fc) {
      await fc.setFiles([imgDir + '\\' + imgs[i]]);
      console.log('   ✅ 업로드');
      await delay(3000);
    } else {
      console.log('   ❌ filechooser 없음 - 직접 등록 필요');
      await page.keyboard.press('Escape');
      await delay(500);
      break;
    }
  }

  console.log('\n✅ 완료! (browser.disconnect()로 연결만 종료)');
  await b.disconnect();
}

run().catch(e => {
  console.error('❌ 실패:', e.message);
  process.exit(1);
});

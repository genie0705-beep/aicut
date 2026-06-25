const { chromium } = require('playwright');
const fs = require('fs');

const TITLE = 'IR 피칭 3번 실패하고 AI 툴 5개 써본 스타트업이 찾은 해결책';
const BODY_TEXT = fs.readFileSync('blog_body.txt', 'utf8');

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  
  // 새 탭 (깨끗한 상태)
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss().catch(()=>{}); });

  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(4000);
  console.log('에디터:', page.url().includes('PostWriteForm') ? '✅' : '❌');

  // 제목
  await page.evaluate((t) => {
    const e = window.SmartEditor?._editors?.['blogpc001'];
    if (e?.setDocumentTitle) e.setDocumentTitle(t);
  }, TITLE);
  console.log('제목: ✅');
  await delay(500);

  // keyboard.type
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[id^="input_buffer"]');
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
    doc?.querySelector('[contenteditable="true"]')?.focus();
  });
  await delay(300);
  
  console.log('본문 입력...');
  await page.keyboard.type(BODY_TEXT, { delay: 2 });
  await delay(2000);
  console.log('본문: ✅');

  // setDocumentData로 H2/bold/center 적용
  console.log('SEO 구조 적용...');
  const applyResult = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return { error: 'editor 없음' };
    
    const data = editor.getDocumentData();
    const comps = data.document.components;
    let h2 = 0, bold = 0, center = 0;
    
    for (const comp of comps) {
      if (comp['@ctype'] !== 'text') continue;
      for (const p of (comp.value || [])) {
        if (!p.nodes || p.nodes.length === 0) continue;
        const text = p.nodes.map(n => n.value || '').join('').trim();
        
        // H2
        if (/^[📉🤖💡✨✅🚀]/.test(text)) {
          p.type = 'header2'; p.textAlign = 'center'; h2++;
        }
        
        // Bold
        const kws = ['IR 피칭 영상','AI 영상 편집','스타트업 마케팅','숏폼 마케팅','릴스 알고리즘','에이컷','AICUT','상반기 마케팅','하반기 준비','여름 마케팅','전문 에디터'];
        for (const node of p.nodes) {
          if (node['@ctype'] === 'textNode' && node.value) {
            for (const kw of kws) { if (node.value.includes(kw)) { node.bold = true; bold++; break; } }
          }
        }
        
        // Center
        p.textAlign = 'center'; center++;
      }
    }
    
    try {
      editor.setDocumentData(data);
      return { h2, bold, center, status: 'ok' };
    } catch(e) {
      return { error: e.message, h2, bold, center };
    }
  });
  console.log('적용:', JSON.stringify(applyResult));
  await delay(1000);

  // getDocumentData 재확인
  const verify = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return {};
    const data = editor.getDocumentData();
    let h2 = 0, bold = 0, center = 0;
    for (const c of data.document.components) {
      if (c['@ctype'] !== 'text') continue;
      for (const p of (c.value || [])) {
        if (p.type === 'header2') h2++;
        if (p.textAlign === 'center') center++;
        for (const n of (p.nodes || [])) if (n.bold) bold++;
      }
    }
    return { h2, bold, center };
  });
  console.log('확인:', JSON.stringify(verify));

  // 저장 후 setDocumentData로 보강 후 저장 반복
  if (verify.h2 > 0 || verify.bold > 0) {
    console.log('setDocumentData 적용 확인됨. 저장 시도...');
    
    // 저장 버튼 클릭
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
    });
    await delay(4000);
    
    // 저장 후 React가 덮어썼는지 확인
    const afterSave = await page.evaluate(() => {
      const editor = window.SmartEditor?._editors?.['blogpc001'];
      if (!editor) return {};
      const data = editor.getDocumentData();
      let h2 = 0, bold = 0;
      for (const c of data.document.components) {
        if (c['@ctype'] !== 'text') continue;
        for (const p of (c.value || [])) {
          if (p.type === 'header2') h2++;
          for (const n of (p.nodes || [])) if (n.bold) bold++;
        }
      }
      return { h2, bold };
    });
    console.log('저장 후 확인:', JSON.stringify(afterSave));
    
    // React가 덮어썼으면 다시 setDocumentData + 저장 반복
    if (afterSave.h2 === 0 && verify.h2 > 0) {
      console.log('React가 덮어씀. setDocumentData 재적용 + 저장 재시도...');
      
      for (let attempt = 0; attempt < 3; attempt++) {
        // 재적용
        await page.evaluate(() => {
          const editor = window.SmartEditor?._editors?.['blogpc001'];
          if (!editor) return;
          const data = editor.getDocumentData();
          for (const comp of data.document.components) {
            if (comp['@ctype'] !== 'text') continue;
            for (const p of (comp.value || [])) {
              if (!p.nodes || p.nodes.length === 0) continue;
              const text = p.nodes.map(n => n.value || '').join('').trim();
              if (/^[📉🤖💡✨✅🚀]/.test(text)) { p.type = 'header2'; p.textAlign = 'center'; }
              p.textAlign = 'center';
              const kws = ['IR 피칭 영상','AI 영상 편집','스타트업 마케팅','숏폼 마케팅','릴스 알고리즘','에이컷','AICUT','전문 에디터'];
              for (const node of p.nodes) {
                if (node['@ctype'] === 'textNode' && node.value) {
                  for (const kw of kws) { if (node.value.includes(kw)) { node.bold = true; break; } }
                }
              }
            }
          }
          try { editor.setDocumentData(data); } catch(e) {}
        });
        await delay(500);
        
        // 저장
        await page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
        });
        await delay(3000);
      }
      
      // 최종 확인
      const final = await page.evaluate(() => {
        const editor = window.SmartEditor?._editors?.['blogpc001'];
        if (!editor) return {};
        const data = editor.getDocumentData();
        let h2 = 0, bold = 0;
        for (const c of data.document.components) {
          if (c['@ctype'] !== 'text') continue;
          for (const p of (c.value || [])) {
            if (p.type === 'header2') h2++;
            for (const n of (p.nodes || [])) if (n.bold) bold++;
          }
        }
        return { h2, bold };
      });
      console.log('최종:', JSON.stringify(final));
    }
  } else {
    console.log('setDocumentData 적용 실패');
  }

  // close/disconnect 호출 금지! 브라우저 유지
  console.log('\n✅ 브라우저 연결 유지 중');
}

run().catch(e => {
  console.error('❌ 실패:', e.message);
  process.exit(1);
});

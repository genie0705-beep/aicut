const { chromium } = require('playwright');
async function run() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('PostWriteForm')) { page = p; break; }
  }
  if (!page) { console.log('❌ 에디터 탭 없음'); return; }

  const imgDir = 'C:/Users/paul/.openclaw/workspace';
  const imgs = [
    'aicut_blog_live_thumb.png',
    'aicut_blog_live_problem.png',
    'aicut_blog_live_solution.png',
    'aicut_blog_live_compare.png',
    'aicut_blog_live_cta.png'
  ];

  let successCount = 0;

  for (let i = 0; i < imgs.length; i++) {
    console.log(`\n[${i+1}/${imgs.length}] ${imgs[i]}`);

    // 사진 버튼 클릭
    await page.bringToFront();
    const btnResult = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const t = btn.textContent.trim();
        if (t === '사진' || t === '사진 추가') { btn.click(); return true; }
      }
      return false;
    });
    console.log('  사진 버튼:', btnResult ? '✅' : '❌');
    await new Promise(r => setTimeout(r, 2000));

    // file input 찾기
    const fi = await page.$('input[type="file"]');
    if (fi) {
      await fi.setInputFiles(imgDir + '/' + imgs[i]);
      console.log('  ✅ 파일 업로드 성공');
      await new Promise(r => setTimeout(r, 3000));
      successCount++;
    } else {
      // MYBOX가 열렸을 수 있음 - ESC로 닫기
      console.log('  ❌ file input 없음 (MYBOX)');
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 1000));
      break;
    }
  }

  // 저장
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) if (btn.textContent.trim() === '저장') { btn.click(); return; }
  });
  await new Promise(r => setTimeout(r, 3000));

  // 이미지 component 확인
  const verify = await page.evaluate(() => {
    const editor = window.SmartEditor?._editors?.['blogpc001'];
    if (!editor) return 'n/a';
    const data = editor.getDocumentData();
    let imgCount = 0, textLen = 0;
    for (const c of data.document.components) {
      if (c['@ctype'] === 'image') imgCount++;
      if (c['@ctype'] === 'text') {
        for (const p of (c.value || [])) {
          for (const n of (p.nodes || [])) textLen += (n.value || '').length;
        }
      }
    }
    return { images: imgCount, textLen };
  });
  console.log(`\n✅ ${successCount}/${imgs.length}개 등록`);
  console.log('최종:', JSON.stringify(verify));
  process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });

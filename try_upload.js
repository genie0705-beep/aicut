const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 1400, height: 1000 });

  // PostWrite로 바로 이동 (두 번째 글)
  await p.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await p.waitForTimeout(3000);

  // 에디터 비어있는지 확인
  const hasContent = await p.evaluate(() => {
    const ed = SmartEditor?._editors?.['blogpc001'];
    return {
      title: ed?.getDocumentTitle ? ed.getDocumentTitle() : 'N/A',
      hasContent: !!ed?.getDocumentData ? ed.getDocumentData().length > 100 : 'N/A'
    };
  });
  console.log('현재 편집기 상태:', JSON.stringify(hasContent));

  // 대표 이미지 삽입 (에디터 상단에 커서 위치 후 이미지 업로드)
  // 사진 버튼 클릭 → filechooser 이벤트
  // 실제 파일 업로드 트리거
  console.log('\n🖼️ 이미지 업로드 준비...');
  
  // 첫번째 사진 버튼 찾기
  const uploadBtn = await p.$('button:has-text("사진"), span:has-text("사진")');
  if (uploadBtn) {
    console.log('사진 버튼 발견');
    const fileChooserPromise = p.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);
    await uploadBtn.click();
    const fileChooser = await fileChooserPromise;
    if (fileChooser) {
      const imgPath = 'C:\\Users\\paul\\.openclaw\\workspace\\aicut_blog_shop.png';
      await fileChooser.setFiles(imgPath);
      console.log('파일 선택됨');
      await p.waitForTimeout(3000);
    } else {
      console.log('filechooser 이벤트 없음');
    }
  }

  // 페이지 상태
  const state = await p.evaluate(() => document.body.innerText.substring(0, 300));
  console.log('현재 상태:', state.replace(/\n/g, ' ').substring(0, 200));

  await p.close();
  await b.close();
})().catch(e => console.error('❌', e.message));

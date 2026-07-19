const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => d.dismiss());

  console.log('1. 저장된 글 다시 열기...');
  await page.goto('https://blog.naver.com/PostList.naver?blogId=aicut', {
    waitUntil: 'domcontentloaded', timeout: 15000
  });
  await page.waitForTimeout(3000);

  // 목록에서 첫 번째 글(방금 저장한 글)의 수정 링크 찾기
  const editLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    const editUrls = [];
    links.forEach(a => {
      const href = a.href || '';
      // 수정 링크 패턴: PostView.naver?blogId=aicut&logNo=... 다음 수정 버튼
      if (href.includes('Redirect=Modify') || href.includes('modify') || href.includes('Modify')) {
        editUrls.push(href);
      }
    });
    return editUrls.slice(0, 3);
  });

  console.log(`   수정 링크: ${JSON.stringify(editLinks)}`);

  // 글쓰기로 다시 열기 (저장된 글이 수정 모드로 열림)
  await page.evaluate(() => {
    const btn = document.querySelector('a[href*="Redirect=Write"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(5000);

  console.log(`   현재 URL: ${page.url()}`);

  // iframe 찾기
  const frames = page.frames();
  let editorFrame = null;
  for (const f of frames) {
    try {
      if (await f.evaluate(() => typeof SmartEditor !== 'undefined')) {
        editorFrame = f;
        break;
      }
    } catch(e) {}
  }

  if (!editorFrame) {
    console.log('❌ SmartEditor 못 찾음');
    return;
  }

  console.log('✅ 에디터 발견\n');

  // 현재 내용 확인
  const currentContent = await editorFrame.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const text = ed.getContentText();
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    return { textLength: text.length, paraCount: paras, preview: text.substring(0, 100) };
  });
  console.log(`현재 상태: ${JSON.stringify(currentContent)}`);

  if (currentContent.textLength === 0) {
    console.log('⚠️ 내용이 없습니다. 다시 입력이 필요합니다.');
    return;
  }

  // 간격 조정
  console.log('\n2. 간격 조정...');
  const result = await editorFrame.evaluate(() => {
    const paras = document.querySelectorAll('.se-text-paragraph');
    let adjusted = 0;
    let sectionsFound = 0;

    paras.forEach((p, i) => {
      const text = p.innerText.trim();
      
      // 기본 문단 간격 8px (너무 크면 SE4가 잘라낼 수 있음)
      p.style.marginBottom = '8px';
      adjusted++;

      // 섹션 헤더 위 간격
      if (text.includes('코스') || text.includes('서울식물원') || text.includes('안국동') ||
          text.includes('여의도') || text.includes('송파') || text.includes('서교') ||
          text.includes('영상으로')) {
        p.style.marginTop = '24px';
        p.style.marginBottom = '12px';
        sectionsFound++;
      }

      // 정보 라인 간격 좁게
      if (text.match(/[📍🚇🕘💰🅿️🎯🍽️💡🎵]/)) {
        p.style.marginBottom = '4px';
        p.style.marginTop = '2px';
      }

      // 구분선
      if (text === '---') {
        p.style.marginTop = '30px';
        p.style.marginBottom = '30px';
      }

      // 해시태그
      if (text.startsWith('#')) {
        p.style.marginTop = '30px';
      }
      
      // CTA
      if (text.includes('@aicut.co.kr') || text.includes('pf.kakao') || text.includes('aicut.co.kr')) {
        p.style.marginTop = '6px';
      }
    });

    // SE4에 변경 알림
    const canvas = document.querySelector('.se-canvas');
    if (canvas) {
      canvas.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
    }

    return { total: paras.length, adjusted, sections: sectionsFound };
  });

  console.log(`   ${JSON.stringify(result)}`);

  // 저장
  await editorFrame.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.innerText.trim() === '저장') { btn.click(); break; }
    }
  });

  console.log('\n✅ 간격 조정 + 저장 완료!');
  console.log('브라우저에서 확인해주세요.');
})();

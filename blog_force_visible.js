// contenteditable 강제 visible + execCommand
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.accept(); } catch(e) {} });

  let page = null;
  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) { page = p; break; }
  }
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut/postwrite').catch(() => {});
    await page.waitForTimeout(5000);
  } else {
    await page.goto('https://blog.naver.com/aicut/postwrite').catch(() => {});
    await page.waitForTimeout(5000);
  }

  // 팝업 & dim 제거
  await page.evaluate(() => {
    document.querySelectorAll('[class*="dim"],[class*="popup"],[class*="layer"]').forEach(el => el.remove());
  });
  await page.waitForTimeout(1000);

  // contenteditable 강제 visible
  await page.evaluate(() => {
    const eds = document.querySelectorAll('[contenteditable]');
    eds.forEach(el => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      el.style.opacity = '1';
      el.style.position = 'relative';
      el.style.zIndex = '9999';
      el.style.minHeight = '200px';
      el.style.backgroundColor = '#fff';
      el.style.color = '#000';
    });
  });
  await page.waitForTimeout(500);

  // 제목
  await page.evaluate(() => {
    const el = document.querySelector('.se-title-text');
    if (el) {
      el.focus();
      el.innerText = '변호사·세무사·보험설계사라면 왜 월 정기 영상 편집이 필요할까';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  console.log('✅ 제목');

  // contenteditable 포커스 + execCommand
  await page.evaluate(() => {
    const ed = document.querySelector('[contenteditable="true"]');
    if (!ed) return 'no-editor';

    ed.focus();
    ed.style.display = 'block';
    ed.style.visibility = 'visible';
    ed.style.opacity = '1';

    // Selection
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ed);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    const text = [
      '"저도 영상이 필요하다는 건 아는데… 누가 하죠?"',
      '',
      '변호사, 세무사, 보험설계사, 공인중개사, 금융FP.',
      '전문직이라면 누구나 하는 고민이다.',
      '',
      '영상 마케팅이 중요하다는 건 안다.',
      '하지만 직접 찍고 편집할 시간이 없다.',
      '그렇다고 전담 인력을 채용하자니 부담스럽다.',
      '',
      '이 글에서는 전문직이 영상 마케팅을',
      '효과적으로 운영하는 현실적인 방법을 이야기한다.',
      '',
      '──────────',
      '',
      '전문직이 영상에 진심이어야 하는 이유',
      '',
      '네이버에 "변호사 추천"을 검색해보자.',
      '검색 결과 상단에 영상 콘텐츠가 노출된다.',
      '네이버 알고리즘이 영상을 선호하기 때문이다.',
      '',
      '신뢰가 중요한 업종일수록',
      '얼굴을 보여주고 설명하는 영상이 효과적이다.',
      '',
      '──────────',
      '',
      '문제는 실행이다',
      '',
      '"해야 한다는 걸 아는 것"이 아니라 "누가 하느냐"가 문제다.',
      '',
      '직접 하기엔 시간이 없고,',
      '프리랜서는 퀄리티가 들쭉날쭉하고,',
      '채용은 부담스럽다.',
      '',
      '월 정기 편집 파트너는 이 문제를 해결한다.',
      '',
      '──────────',
      '',
      '전문직에게 딱 맞는 이유',
      '',
      '전담 에디터 1:1 배정',
      '브랜드 가이드를 한 번 저장하면 매번 설명 불필요.',
      '',
      'D+1 납기',
      '원본만 보내면 24시간 이내 1차 편집본 완성.',
      '',
      '부담 없는 계약',
      '첫 달 사용해보고 맞지 않으면 언제든 해지 가능.',
      '',
      '──────────',
      '',
      '마무리',
      '',
      '전문직의 신뢰는 콘텐츠에서 나온다.',
      '꾸준히 얼굴을 보여주는 영상이',
      '가장 강력한 마케팅 채널이 된다.',
      '',
      '월 정기 편집 파트너와 함께라면',
      '편집은 맡기고, 본업에 집중할 수 있다.',
      '',
      '지금 바로 무료 상담 신청하세요.',
      '👉 aicut.co.kr',
    ].join('\n');

    document.execCommand('insertText', false, text);
    ed.dispatchEvent(new Event('input', { bubbles: true }));
    ed.dispatchEvent(new Event('change', { bubbles: true }));
    return 'done';
  }).then(r => console.log('execCommand:', r));

  await page.waitForTimeout(1000);

  // 확인
  const result = await page.evaluate(() => {
    const t = document.querySelector('.se-title-text');
    const title = t ? t.innerText || '' : '';
    const eds = document.querySelectorAll('[contenteditable]');
    let body = '';
    for (const ed of eds) {
      const txt = ed.innerText || '';
      if (txt.length > body.length) body = txt;
    }
    return { title: title.substring(0, 40), bodyLen: body.length, bodyPrev: body.substring(0, 80) };
  }).catch(() => ({}));

  console.log('\n=== 최종 ===');
  console.log('제목:', result.title || '(비어있음)');
  console.log('본문:', result.bodyLen > 0 ? `✅ ${result.bodyLen}자` : '❌ 비어있음');
  if (result.bodyLen > 0) console.log('시작:', result.bodyPrev);

  try { await b.close(); } catch(e) {}
})();

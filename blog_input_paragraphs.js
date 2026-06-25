const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const page = ctx.pages().find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }

  await new Promise(r => setTimeout(r, 1000));

  // 1단계: 제목만 먼저 입력
  const title = '쇼핑몰·이커머스 운영자라면 영상 마케팅이 필요한 이유';

  await page.evaluate((t) => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return;
    ce.focus();
    ce.innerHTML = '';
    ce.innerText = '';
    
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ce);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    
    document.execCommand('insertText', false, t);
  }, title);

  await new Promise(r => setTimeout(r, 1000));

  // 2단계: Enter x2
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 500));

  // 3단계: 본문을 문단별로 insertText + Enter
  const paragraphs = [
    '쇼핑몰을 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다.',
    '"상세페이지에 사진 여러 장 넣었는데 왜 구매로 안 이어질까?"',
    '"인스타그램에 릴스를 올렸는데 조회수가 200도 안 나온다."',
    '정답은 하나입니다. 쇼핑몰 마케팅의 핵심은 이제 사진이 아니라 영상입니다.',
    '■ 쇼핑몰, 왜 영상 마케팅이 필수인가',
    '제품 영상 하나가 상세페이지 10장보다 강력합니다. 실제로 제품 영상을 본 고객의 구매 전환율은 사진만 본 고객보다 최대 80% 높습니다.',
    '숏폼이 쇼핑몰 트래픽의 중심입니다. 인스타그램 릴스, 틱톡, 유튜브 쇼츠는 이제 필수입니다.',
    '스마트스토어·네이버쇼핑도 영상을 우선합니다. 제품 영상 등록 시 검색 랭킹과 노출 가중치를 높게 줍니다.',
    '■ 쇼핑몰 운영자가 영상 제작에 실패하는 이유',
    '직접 촬영+편집 → 하루 2~3편 한계',
    '인플루언서 위탁 → 시점 불확실',
    '건당 외주 → 편집자마다 퀄리티 상이',
    '■ 쇼핑몰 영상, 에이컷이 해결합니다',
    '에이컷은 쇼핑몰 고객사의 제품 영상을 월정기로 편집합니다. 촬영 원본만 보내주시면 자막, BGM, 브랜드 로고를 적용해서 릴스/쇼츠로 납품합니다.',
    '패션/의류 → 착용샷 릴스',
    '뷰티/화장품 → 제품 사용법',
    '식품/맛집 → 조리 과정',
    '리빙/잡화 → 개봉기',
    '브랜드 가이드 한 번 저장으로 모든 영상이 동일한 톤으로 제작됩니다.',
    '■ 지금 시작해야 하는 이유',
    '네이버, 쿠팡, 인스타그램 모두 영상 중심 알고리즘입니다. 지금 시작해야 누적된 콘텐츠로 차이가 납니다.',
    '영상 편집 아웃소싱이 처음이시라면 문의 주세요.',
    '카카오톡 채널: 에이컷',
    '이메일: contact@aicut.co.kr',
    '홈페이지: aicut.co.kr'
  ];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    
    await page.evaluate((txt) => {
      const sel = window.getSelection();
      const range = document.createRange();
      const ce = document.querySelector('[contenteditable]');
      if (!ce) return;
      range.selectNodeContents(ce);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertText', false, txt);
    }, p);

    await new Promise(r => setTimeout(r, 100));

    // 마지막이 아니면 Enter x2 (단락 구분)
    if (i < paragraphs.length - 1) {
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 100));
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 150));
    }

    if (i % 5 === 0) process.stdout.write('.');
  }

  console.log('\n입력 완료');

  // 확인
  const result = await page.evaluate(() => {
    const ce = document.querySelector('[contenteditable]');
    if (!ce) return 'CE 없음';
    const lines = (ce.innerText || '').split('\n');
    return `총 ${ce.innerText.length}자, ${lines.length}줄, 1줄: "${lines[0]?.substring(0, 30)}"`;
  });
  console.log('✅', result);

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

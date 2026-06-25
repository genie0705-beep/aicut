const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', async d => { try { await d.dismiss(); } catch(e) {} });

  const pages = ctx.pages();
  let page = pages.find(p => p.url().includes('postwrite'));
  if (!page) { console.log('탭 없음'); await b.close(); process.exit(0); }
  
  await new Promise(r => setTimeout(r, 2000));

  // === 1. 제목 입력 ===
  const title = '쇼핑몰·이커머스 운영자라면 영상 마케팅이 필요한 이유';
  
  const titleResult = await page.evaluate((t) => {
    // 제목 영역 찾기
    const titleDiv = document.querySelector('.se-module.se-module-text.__se-unit.se-is');
    if (titleDiv && titleDiv.isContentEditable) {
      titleDiv.focus();
      titleDiv.innerText = t;
      titleDiv.dispatchEvent(new Event('input', { bubbles: true }));
      titleDiv.dispatchEvent(new Event('change', { bubbles: true }));
      return '제목 입력 성공';
    }
    
    // contenteditable 전체 검색
    const eds = document.querySelectorAll('[contenteditable]');
    for (const el of eds) {
      el.focus();
      el.innerText = t;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return 'contenteditable에 제목 입력';
    }
    return '제목 입력 실패';
  }, title);
  
  console.log('제목:', titleResult);
  await new Promise(r => setTimeout(r, 1000));

  // === 2. 엔터 쳐서 본문 영역 생성 ===
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 1500));

  // === 3. 본문 입력 ===
  const body = '쇼핑몰을 운영하다 보면 이런 고민, 한 번쯤 해보셨을 겁니다.\n\n"상세페이지에 사진 여러 장 넣었는데 왜 구매로 안 이어질까?"\n"인스타그램에 릴스를 올렸는데 조회수가 200도 안 나온다."\n"제품 영상을 찍고 싶은데 찍을 시간도, 편집할 실력도 없다."\n\n정답은 하나입니다. 쇼핑몰 마케팅의 핵심은 이제 사진이 아니라 영상입니다.\n\n■ 쇼핑몰, 왜 영상 마케팅이 필수인가\n\n제품 영상 하나가 상세페이지 10장보다 강력합니다. 온라인 쇼핑몰에서 고객이 제품을 선택할 때 가장 중요한 건 신뢰입니다. 사진은 보정과 각도에 따라 다르게 보일 수 있지만, 제품을 실제로 사용하는 영상 하나면 사진 10장보다 높은 전환율을 만듭니다.\n\n실제로 제품 영상을 본 고객의 구매 전환율은 사진만 본 고객보다 최대 80% 높다는 데이터가 있습니다. 특히 의류, 액세서리, 뷰티, 식품 카테고리에서 영상의 효과가 가장 큽니다.\n\n숏폼이 쇼핑몰 트래픽의 중심이 되고 있습니다. 인스타그램 릴스, 틱톡, 유튜브 쇼츠 — 숏폼 콘텐츠는 더 이상 선택이 아닙니다. 쇼핑몰 운영자라면 제품을 자연스럽게 소개하는 15~30초 숏폼 하나로 수천에서 수만의 도달을 확보할 수 있습니다.\n\n스마트스토어·네이버쇼핑도 영상을 우선합니다. 네이버 스마트스토어와 쿠팡, 11번가 등 주요 이커머스 플랫폼은 제품 영상 등록 시 검색 랭킹과 노출 가중치를 높게 줍니다.\n\n■ 쇼핑몰 운영자가 영상 제작에 실패하는 이유\n\n직접 스마트폰 촬영 + 앱 편집 → 하루 2~3편이 한계\n인플루언서에게 제품만 보냄 → 리뷰 영상이 언제 올라올지 알 수 없음\n건당 외주 에이전시 계약 → 편집자마다 스타일이 달라짐\n\n결국 일회성이 아니라 꾸준히, 일정한 퀄리티로 영상을 제작할 수 있는 구조가 필요합니다.\n\n■ 쇼핑몰 영상, 이렇게만 하면 됩니다\n\n에이컷은 쇼핑몰 고객사의 제품 영상을 월정기로 편집해드립니다. 제품 촬영 원본만 보내주시면 자막, BGM, 브랜드 로고를 적용해서 릴스/쇼츠/상세페이지 영상으로 납품합니다.\n\n✔ 패션/의류 — 착용샷 릴스, 코디룩북\n✔ 뷰티/화장품 — 제품 사용법, 성분 소개\n✔ 식품/맛집 — 조리 과정, 먹방 숏폼\n✔ 리빙/잡화 — 개봉기, 활용 꿀팁\n\n브랜드 가이드 한 번 저장으로 끝납니다. 온보딩 때 한 번만 전달하면 이후 모든 영상이 동일한 브랜드 아이덴티티로 제작됩니다.\n\n■ 지금 시작해야 하는 이유\n\n네이버, 쿠팡, 인스타그램 모두 영상 중심 알고리즘으로 전환 중입니다. 지금 시작하는 쇼핑몰과 3개월 후의 차이는 누적된 콘텐츠 양에서 결정됩니다.\n\n에이컷은 쇼핑몰·이커머스 브랜드의 영상 편집을 월정기로 지원합니다. 쇼핑몰 마케팅, 더 이상 사진만으로 경쟁하지 마세요.\n\n영상 편집 아웃소싱이 처음이시라면, 부담 없이 문의 주세요.\n\n- 카카오톡 채널: 에이컷\n- 이메일: contact@aicut.co.kr\n- 홈페이지: aicut.co.kr';

  const bodyResult = await page.evaluate((txt) => {
    // 현재 contenteditable들 확인
    const eds = document.querySelectorAll('[contenteditable]');
    let bodyEd = null;
    
    for (const el of eds) {
      const t = (el.innerText || '').trim();
      if (t.length > 0) continue; // 제목 영역 스킵
      bodyEd = el;
    }
    
    if (!bodyEd && eds.length > 1) {
      bodyEd = eds[1]; // 두 번째 contenteditable
    }
    
    if (bodyEd) {
      bodyEd.focus();
      bodyEd.innerHTML = txt.replace(/\n/g, '<br>');
      bodyEd.dispatchEvent(new Event('input', { bubbles: true }));
      bodyEd.dispatchEvent(new Event('change', { bubbles: true }));
      return '본문 입력: ' + bodyEd.innerText.length + '자';
    }
    
    // 마지막 시도: 제목이 있는 첫 번째 contenteditable의 형제 찾기
    if (eds.length > 0) {
      const first = eds[0];
      const parent = first.parentElement;
      if (parent) {
        const siblings = parent.querySelectorAll('[contenteditable]');
        for (const sib of siblings) {
          const t = (sib.innerText || '').trim();
          if (t.length === 0) {
            sib.focus();
            sib.innerHTML = txt.replace(/\n/g, '<br>');
            sib.dispatchEvent(new Event('input', { bubbles: true }));
            return '본문 입력(sibling): ' + sib.innerText.length + '자';
          }
        }
      }
      // 제목 영역에 본문까지 함께 입력
      first.focus();
      first.innerHTML = txt.replace(/\n/g, '<br>');
      first.dispatchEvent(new Event('input', { bubbles: true }));
      return '본문 입력(제목영역): ' + first.innerText.length + '자';
    }
    
    return '본문 입력 실패';
  }, body);

  console.log('본문:', bodyResult);
  console.log('\n✅ 에디터 입력 완료!');

  await b.close();
})().catch(e => console.log('ERR:', e.message.split('\n')[0]));

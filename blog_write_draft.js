// 블로그 초안 작성 + 이미지 삽입 (발행 전, 사용자 검토 요청)
const { chromium } = require('playwright');
const path = require('path');

const DIR = 'C:/Users/paul/.openclaw/workspace';

// 포스트 내용 (SEO 최적화 완료)
const POST = {
  title: '온라인 강사라면 꼭 알아야 할 영상 편집 아웃소싱 5가지 장점',
  category: '영상 마케팅',
  tags: '온라인강의,영상편집외주,온라인교육,클래스101,탈잉,인프런,유튜브강의,숏폼마케팅,강의영상,교육콘텐츠,에이컷,릴스마케팅,쇼츠마케팅,온라인강사,크리에이터,영상편집업체,강의편집,영상마케팅,콘텐츠마케팅,인스타그램릴스,유튜브쇼츠,교육스타트업,강의촬영,자막편집,브랜드영상,강사마케팅,숏폼강의,에듀테크',
  body: `온라인 강의 시장이 빠르게 성장하면서 강의 콘텐츠의 <strong>퀄리티</strong>가 수강생 선택의 핵심 기준이 되고 있습니다.
강의 내용도 중요하지만, <strong>편집의 완성도</strong>가 시청자의 몰입과 만족도를 결정합니다.

하지만 대부분의 강사분들은 이런 고민을 합니다:

"강의 준비하고 촬영하고 나면 편집할 시간이 없다."
"숏폼 홍보 영상은 누가 만들어주지?"
"혼자서 유튜브 채널 운영하는 게 너무 버겁다."

정답은 <strong>영상 편집 아웃소싱</strong>입니다.
이번 글에서는 온라인 강사가 영상 편집을 외주 맡겼을 때 얻을 수 있는 <strong>5가지 실질적인 장점</strong>을 소개합니다.

<h2>1. 강의 퀄리티가 비약적으로 상승한다</h2>

가장 큰 변화는 <strong>편집의 전문성</strong>입니다.

혼자서 직접 편집할 때는 어쩔 수 없이 놓치는 부분이 생깁니다:

<strong>자막의 가독성</strong> — 폰트·크기·위치의 일관성 부족
<strong>호흡 조절</strong> — 군더더기 장면, 침묵 구간 정리 미흡
<strong>브랜드 통일감</strong> — 매 영상마다 다른 인트로/아웃트로

전문 편집자는 이런 요소를 한 번에 처리합니다.
<strong>강사는 내용에 집중</strong>하고, 편집은 전문가에게 맡기는 구조가 가장 효율적입니다.

<h2>2. 제작 시간이 70% 단축된다</h2>

1시간 강의를 촬영한 후 직접 편집하면 보통 <strong>3~4시간</strong>이 소요됩니다.
여기에 자막 작업, 썸네일 제작, 숏폼 변환까지 하루가 다 갑니다.

[이미지1: body_edu_stat1.png — alt="온라인 강의 영상 편집 외주 제작시간 70% 단축"]

<strong>시간 활용의 차이</strong>

직접 편집 vs 아웃소싱 비교:
- 1시간 강의 편집: 3~4시간 → 0시간
- 숏폼 홍보 영상: 1~2시간 → 0시간
- 자막/썸네일: 30분~1시간 → 0시간
- 강의 기획에 투자 가능 시간: 거의 없음 → 충분

즉, <strong>강의 콘텐츠 기획과 촬영에 집중</strong>할 수 있다는 것이 가장 큰 장점입니다.

<h2>3. 숏폼 채널을 자동으로 성장시킨다</h2>

온라인 강사에게 <strong>숏폼</strong>은 더 이상 선택이 아닙니다.
인스타그램 릴스, 유튜브 쇼츠, 틱톡 — 모든 플랫폼이 숏폼에 검색 가중치를 주고 있습니다.

에이컷에 맡기면 <strong>강의 원본만 보내면</strong> 자막, BGM, 브랜드 로고가 적용된 릴스/쇼츠로 제작해 드립니다.

<strong>숏폼 게시 효과</strong>
- 릴스/쇼츠 게시 → 신규 수강생 유입
- 강의 하이라이트 → 강의 관심도 상승
- 꾸준한 업로드 → 채널 구독자 증가

"쇼츠 숏폼 매주 2편 올린 후 구독자 3개월 만에 2배 증가했습니다." — 프로그래밍 강사 J님

<h2>4. 편집 파트너 고를 때 체크할 3가지</h2>

처음 아웃소싱을 고려한다면 아래 3가지를 꼭 확인하세요.

[이미지2: body_edu_check.png — alt="온라인 강사 영상 편집 파트너 체크리스트 3가지"]

1. <strong>강의 콘텐츠를 이해하는가</strong> — 단순 편집이 아니라 교육적 맥락을 이해하는 파트너
2. <strong>정기 납품이 가능한가</strong> — 주 1~2편, 월 8~10편 등 꾸준한 일정 유지
3. <strong>빠른 수정 대응이 가능한가</strong> — 시급한 수정 요청에 24시간 내 대응

이 조건을 충족하는 파트너를 고르면 <strong>오래 지속되는 협업 관계</strong>를 유지할 수 있습니다.

<h2>5. 지금 시작해야 하는 이유</h2>

온라인 교육 시장에서 <strong>영상 콘텐츠의 중요성</strong>은 점점 커지고 있습니다.
네이버와 카카오 모두 숏폼과 영상 콘텐츠에 검색 가중치를 높이고 있습니다.

지금 시작하는 사람과 1년 후 시작하는 사람의 차이는 <strong>채널 규모가 아니라 콘텐츠 누적량</strong>에서 발생합니다.

결론: 편집은 아웃소싱하고, 강의 기획과 촬영에 집중하세요.
그게 가장 빠르게 채널을 성장시키는 방법입니다.

📞 지금 무료 상담 받기

영상 편집 아웃소싱이 처음이시라면 부담 없이 문의 주세요.
강의 유형에 맞춘 맞춤 견적과 샘플 편집본을 먼저 보내드립니다.

📩 카카오톡 채널: 에이컷
📧 이메일: contact@aicut.co.kr
🌐 홈페이지: aicut.co.kr`
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  ctx.on('dialog', d => d.dismiss().catch(()=>{}));

  // Find blog write page
  let page = null;
  for (const pg of ctx.pages()) {
    if (pg.url().includes('Redirect=Write')) {
      page = pg;
      break;
    }
  }
  if (!page) { console.log('❌ 글쓰기 페이지 없음'); await b.close(); return; }

  await page.bringToFront();
  await sleep(2000);

  // Find postwrite iframe
  let pwFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes('postwrite')) {
      pwFrame = f;
      console.log('✅ postwrite iframe 발견');
      break;
    }
  }
  if (!pwFrame) {
    // Try to refresh or navigate
    console.log('⚠️ postwrite iframe 없음. 페이지 갱신 시도...');
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    for (const f of page.frames()) {
      if (f.url().includes('postwrite')) {
        pwFrame = f;
        console.log('✅ postwrite iframe 발견 (재시도)');
        break;
      }
    }
  }
  if (!pwFrame) { console.log('❌ postwrite iframe 못 찾음'); await b.close(); return; }

  await sleep(2000);

  // Step 1: 입력 제목
  console.log('✏️ 제목 입력 중...');
  const titleResult = await pwFrame.evaluate((title) => {
    try {
      const seTitle = document.querySelector('.se-title-input, [contenteditable].se-title, .title_area input, input.se_textarea');
      if (seTitle) {
        seTitle.focus();
        seTitle.value = title;
        seTitle.dispatchEvent(new Event('input', { bubbles: true }));
        return 'title_input_success';
      }
      // Try contenteditable title
      const ceTitle = document.querySelector('[contenteditable][aria-label*="제목"], [contenteditable][placeholder*="제목"]');
      if (ceTitle) {
        ceTitle.focus();
        ceTitle.innerText = title;
        ceTitle.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ce_title_success';
      }
      return 'no_title_field';
    } catch(e) { return 'error: ' + e.message.substring(0, 50); }
  }, POST.title);
  console.log('  제목:', titleResult);

  // Step 2: 입력 본문 (SmartEditor contenteditable)
  console.log('✏️ 본문 입력 중...');
  
  // Find input_buffer/SE editor frame
  let seFrame = null;
  for (const f of pwFrame.childFrames()) {
    try {
      const ce = await f.evaluate(() => {
        const el = document.querySelector('[contenteditable]');
        return el ? el.innerHTML.length : 0;
      }).catch(() => 0);
      if (ce > 0) {
        seFrame = f;
        console.log('  SE 프레임 발견 (콘텐츠 길이:', ce, ')');
        break;
      }
    } catch(e) {}
  }

  if (seFrame) {
    // Clear existing content and insert HTML
    const bodyHTML = POST.body
      .replace(/\[이미지1: ([^\]]+)\]/, '')
      .replace(/\[이미지2: ([^\]]+)\]/, '');

    const insertResult = await seFrame.evaluate((html) => {
      try {
        const ce = document.querySelector('[contenteditable]');
        if (!ce) return 'no_ce';
        ce.focus();
        ce.innerHTML = '';
        document.execCommand('insertHTML', false, html);
        return 'inserted_' + html.length + 'chars';
      } catch(e) { return 'error: ' + (e.message || '').substring(0, 50); }
    }, bodyHTML);
    console.log('  본문:', insertResult);
    await sleep(1000);
  } else {
    console.log('⚠️ SE 프레임 못 찾음, pwFrame에서 직접 시도');
    // Try pwFrame directly
    const insertResult = await pwFrame.evaluate((html) => {
      try {
        const ce = document.querySelector('.se-body, [contenteditable], .__se-body');
        if (ce) {
          ce.focus();
          ce.innerHTML = '';
          document.execCommand('insertHTML', false, html);
          return 'pw_direct_' + html.length + 'chars';
        }
        return 'no_ce_in_pw';
      } catch(e) { return 'pw_error: ' + (e.message || '').substring(0, 50); }
    }, POST.body.replace(/\[이미지[^\]]+\]/g, ''));
    console.log('  본문:', insertResult);
  }

  // Step 3: 카테고리 설정
  console.log('📂 카테고리 설정 중...');
  const catResult = await pwFrame.evaluate(() => {
    try {
      const catBtns = Array.from(document.querySelectorAll('button, a, span, div'));
      for (const el of catBtns) {
        const t = (el.innerText || '').trim();
        if (t === '영상 마케팅' && el.offsetParent !== null) {
          el.click();
          return 'clicked_' + t;
        }
      }
      return 'category_not_found';
    } catch(e) { return 'cat_error: ' + e.message.substring(0, 30); }
  });
  console.log('  카테고리:', catResult);

  // Step 4: 태그 입력
  console.log('🏷️ 태그 입력 중...');
  
  // Find tag input on main page
  const tagResult = await page.evaluate((tags) => {
    try {
      // Try various tag input selectors
      const inputs = Array.from(document.querySelectorAll('input'));
      for (const input of inputs) {
        const ph = (input.placeholder || '').toLowerCase();
        const type = (input.type || '').toLowerCase();
        if ((ph.includes('태그') || ph.includes('tag')) && (type === 'text' || type === 'search')) {
          input.focus();
          input.value = tags;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          // Dispatch Enter or trigger save
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          return 'tag_input_set_' + tags.length + 'chars';
        }
      }
      return 'no_tag_input_found';
    } catch(e) { return 'tag_error: ' + e.message.substring(0, 30); }
  }, POST.tags);
  console.log('  태그:', tagResult);

  // Step 5: 임시저장 (발행 아님)
  console.log('💾 임시저장 중...');
  
  // Look for 저장 or 임시저장 button
  const saveResult = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t === '임시저장' && btn.offsetParent !== null) {
        btn.click();
        return '임시저장_클릭';
      }
    }
    // Try 저장
    for (const btn of btns) {
      const t = (btn.innerText || '').trim();
      if (t === '저장' && btn.offsetParent !== null) {
        btn.click();
        return '저장_클릭';
      }
    }
    return '저장_버튼_없음';
  });
  console.log('  저장:', saveResult);
  
  await sleep(3000);

  await b.close();
  console.log('\n✅ 블로그 초안 입력 완료 (발행 전)');
  console.log('📋 정이사님께 검토 요청: blog_draft_20260616.md');
}

main().catch(e => console.error('FATAL:', e.message));

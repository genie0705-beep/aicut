const { chromium } = require('playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const path = require('path');

const CDP_PORT = 9224;
const TITLE = '공인중개사 매물 영상, 장마철에도 문의 받는 법';
const IMG_DIR = path.join(__dirname, 'blog_images');
const IMGS = ['estate_main.png', 'estate_card1.png', 'estate_card2.png', 'estate_card3.png', 'estate_cta.png'];

// Key fix: Make sure each section ends with a COMPLETE paragraph (sentence finishes before image break)
// The 2 split sentences are now unified into one paragraph within their sections

const TEXT = [
  // Section 1: Opening (3-paragraph max per block)
  '장마철만 되면 매물 사진 찍기가 난감하다는 이야기,\n중개사분들이라면 누구나 공감하실 겁니다.\n\n비 오는 날 찍은 사진은 채도도 낮고\n아무리 좋은 매물도 사진으로는 공간감이 안 살아납니다.\n\n호불호가 갈리던 공인중개사 매물 영상이\n실제 도입 후 어떤 효과를 냈는지 풀어보겠습니다.',

  // Section 2: Problem — FIXED: complete sentence before image break
  '\n사진만으로는 안 되는 이유\n\n사진의 한계는 생각보다 명확합니다.\n날씨가 흐리거나 비가 오는 날이면\n같은 매물인데도 사진이 유난히 어둡게 나옵니다.\n\n공간감도 문제입니다.\n아무리 좋은 구도의 사진이라도\n방과 방의 연결이나 들어갔을 때 느낌은 전달하기 어렵습니다.\n\n거기에 모든 중개사가 비슷한 앵글의 사진을 올리니까\n고객 입장에서 차이를 느끼기 어렵습니다.\n\n"사진만 보고 다른 데 갔다"는 얘기를 듣고\n더는 사진으로만 승부를 걸면 안 되겠다는 생각이 들었습니다.',

  // Section 3: Case study + 1st person (no image here in the middle of story)
  '\n실제 도입 전후, 효과 있을까\n\n직접 겪은 사례를 하나 공유합니다.\nA 공인중개사 사무소는 장마철마다\n매물 노출에 어려움을 겪었습니다.\n\n도입 전: 매물 사진 클릭률 1.2%, 신규 문의 주 0~1건\n\n도입 후 (숏폼 영상):\n매물 영상 조회수 3,000~5,000회, 신규 문의 주 3~5건\n\n처음에 촬영 원본을 받았을 때 솔직히 걱정도 됐습니다.\n스마트폰으로 급하게 찍은 영상이라\n흔들림도 있고 조명 상태도 고르지 않았거든요.\n\n그런데 막상 편집을 시작해보니\n오히려 매물의 실제 분위기가 더 살아났습니다.\n\n"이 집 진짜 이렇게 예쁜 집이었어요?"\n편집본을 보내드렸을 때\n중개사님의 문자 메시지가 아직도 기억납니다.\n\n30초짜리 릴스를 블로그와 인스타에 올린 이후\n문의가 들어오기 시작했고\n"영상 보고 왔는데요"라는 말을 가장 많이 들었다고 합니다.',

  // Section 4: Strategy — FIXED: complete sentence before image break
  '\n활용할 수 있는 세 가지 매물 영상 유형\n\n가장 반응이 좋았던 건 매물 투어 영상이었습니다.\n현관문을 열고 거실, 주방, 방으로 이어지는\n공간의 흐름을 그대로 담았습니다.\n\n사진으로 봤을 때와의 차이가 확연했습니다.\n"실제로 와 보니까 영상 그대로네요"라는 말을 자주 듣습니다.\n\n동네 소개 영상도 꽤 효과적이었습니다.\n매물 자체보다 입지가 중요한 경우가 많아서\n역까지 걸어가는 모습이나 주변 편의시설을\n30초 안에 보여주는 것만으로 문의율이 눈에 띄게 올랐습니다.\n\n생각지 못했던 건 계약 꿀팁 영상이었습니다.\n전세와 월세 차이, 계약 시 확인해야 할 서류.\n이게 오히려 전문성 있는 이미지를 만들어주면서\n의도치 않게 매물 문의로 이어졌습니다.',

  // Section 5: 편집 부담 — complete sentence before CTA image
  '\n편집 부담, 이렇게 해결했습니다\n\n스마트폰으로 5분 촬영하면\n이틀 안에 릴스와 쇼츠용 영상 두 가지가 완성됩니다.\n\n촬영 원본만 전달하면\n에디터가 자막, BGM, 색보정까지 마쳐서 납품해주는 구조입니다.\n\n영업과 상담에 집중하면서도\n매일 꾸준히 콘텐츠를 유지할 수 있었던 이유입니다.',
];

const FINAL = '\n장마철, 지금이 준비 타이밍입니다\n\n7~8월은 이사와 전세 수요가 가장 많은 시즌입니다.\n장마까지 겹쳐 SNS 사용 시간이 급증하는 시기이기도 합니다.\n지금 준비한 콘텐츠가 장마철 내내 꾸준히 노출됩니다.\n\n영상 마케팅이 막막하게 느껴질 수 있습니다.\n하지만 촬영은 스마트폰 하나면 충분하고\n편집은 저희가 도와드리니 부담 갖지 않으셔도 됩니다.\n\n💬 카톡: https://pf.kakao.com/_GIesX/chat\n📧 이메일: master@aicut.co.kr\n🌐 홈페이지: https://aicut.co.kr\n\n#공인중개사 #매물영상 #부동산마케팅 #숏폼마케팅 #영상편집외주 #부동산영상 #릴스마케팅\n#유튜브쇼츠 #틱톡마케팅 #장마철마케팅 #여름마케팅 #하반기마케팅 #에이컷\n#영상편집아웃소싱 #숏폼편집 #부동산중개 #중개사무소 #매물투어 #아파트매물\n#전세매물 #매물홍보 #영상마케팅 #SNS마케팅 #부동산SNS #중개사SNS\n#매물소개 #부동산전략 #AICUT #장마 #비오는날';

(async () => {
  console.log('=== 문장 완성 후 이미지 배치 ===\n');

  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    if (p.url().includes('PostWrite') || p.url().includes('postwrite')) await p.close().catch(()=>{});
  }
  const ep = await ctx.newPage();
  await ep.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(8000);

  const bt = await ep.evaluate(() => document.body.innerText);
  if (bt.includes('작성중인 글') || bt.includes('저장된 글')) {
    console.log('작성중인 글 → 취소');
    await ep.evaluate(() => {
      for (const el of document.querySelectorAll('button, span, a')) {
        const t = (el.innerText || '').trim();
        if (t === '취소' || t.includes('취소')) { if (el.offsetParent !== null) { el.click(); return; } }
      }
    });
    await sleep(3000);
  }

  await ep.evaluate((t) => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle(t);
  }, TITLE);
  await sleep(2000);
  console.log('1. Title: ' + TITLE);

  // Write sections sequentially — text THEN image, each section ends with complete sentence
  for (let i = 0; i < 5; i++) {
    process.stdout.write('[' + (i+1) + '/6] ');

  // First write ONLY gets focusToFirstComp
  await ep.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    se._canvasScrollingService.focusToFirstComp();
    se._editingService.writeTextWithSoftLineBreak(text);
  }, TEXT[0]);
    await sleep(2000);

    const fp = path.join(IMG_DIR, IMGS[i]);
    process.stdout.write(IMGS[i]);

    // Enter for clean separation, THEN upload image
    await ep.keyboard.press('Enter');
    await sleep(500);

    const fcp = ep.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
    await ep.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if ((btn.innerText || '').includes('사진') && btn.offsetParent !== null) { btn.click(); return; }
      }
    });
    await sleep(2000);
    const fc = await fcp;
    if (fc) { await fc.setFiles(fp); await sleep(4000); }
    await ep.keyboard.press('ArrowDown');
    await sleep(300);
    process.stdout.write(' OK\n');

    for (let s = 0; s < 3; s++) {
      const saved = await ep.evaluate(() => {
        for (const btn of document.querySelectorAll('button')) {
          if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) { btn.click(); return true; }
        }
        return false;
      });
      if (saved) break;
      await sleep(800);
    }
    await sleep(1500);
  }

  // Final section (no image) — NO focusToFirstComp
  console.log('[6/6] final...');
  await ep.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    se._editingService.writeTextWithSoftLineBreak(text);
  }, FINAL);
  await sleep(2000);

  // Center align
  console.log('align...');
  await ep.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.remove('se-text-paragraph-align-left');
      p.classList.add('se-text-paragraph-align-center');
    });
  });

  for (let i = 0; i < 3; i++) {
    const s = await ep.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) { btn.click(); return true; }
      }
      return false;
    });
    if (s) break;
    await sleep(800);
  }
  await sleep(2000);

  // Verify content
  console.log('\n=== 최종 확인 ===');
  const text = await ep.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  const comps = await ep.evaluate(() => SmartEditor._editors['blogpc001'].getDocumentData().document.components);
  const seq = comps.map(c => c['@ctype'] === 'documentTitle' ? 'T' : c['@ctype'] === 'image' ? 'I' : 'X').join('');
  const imgs = comps.filter(c => c['@ctype'] === 'image').length;

  console.log('길이:', text.length, 'seq:', seq, 'imgs:', imgs);

  // Check the 2 problem areas
  const hasProblem1 = text.includes('듣고더는') || text.includes('듣고 더는');
  const hasProblem2 = text.includes('것만으로문의율이') || text.includes('것만으로 문의율이');

  console.log('문제1(듣고→더는):', hasProblem1 ? '❌ 끊김' : '✅ 정상');
  console.log('문제2(것만으로→문의율):', hasProblem2 ? '❌ 끊김' : '✅ 정상');
  console.log('첫문단:', text.substring(0, 60));
  console.log('끝:', text.substring(text.length - 60));
  console.log('키워드:', (text.match(/공인중개사/g) || []).length, '회');
  console.log('태그:', (text.match(/#/g) || []).length, '개');

  b.close();
})();

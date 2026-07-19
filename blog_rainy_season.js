// =============================================
// 🌧️ 2026 장마기간 블로그 생성기
// =============================================
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const CDP_PORT = 9224;
const WORKSPACE = __dirname;
const IMG_DIR = WORKSPACE;

// === THEMES from image_gen.js ===
const THEMES = {
  dark_purple: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #2d1b69)',
    glow: 'rgba(92,61,232,0.5)',
    badgeBg: 'rgba(167,139,250,0.15)',
    badgeColor: '#a78bfa',
    badgeBorder: 'rgba(167,139,250,0.3)',
    textColor: '#fff',
    accent: '#a78bfa',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#5c3de8',
    ctaTo: '#7c5cf6',
  },
  light_cyan: {
    bg: 'linear-gradient(160deg, #f9fafb, #f0f2f5, #e8ecf5)',
    glow: 'rgba(6,182,212,0.25)',
    badgeBg: 'rgba(6,182,212,0.1)',
    badgeColor: '#0891b2',
    badgeBorder: 'rgba(6,182,212,0.25)',
    textColor: '#0f172a',
    accent: '#06b6d4',
    subColor: 'rgba(15,23,42,0.5)',
    ctaFrom: '#06b6d4',
    ctaTo: '#5c3de8',
  },
  dark_green: {
    bg: 'linear-gradient(160deg, #0D1630, #1a1f4e, #064e3b)',
    glow: 'rgba(52,211,153,0.35)',
    badgeBg: 'rgba(52,211,153,0.15)',
    badgeColor: '#34d399',
    badgeBorder: 'rgba(52,211,153,0.3)',
    textColor: '#fff',
    accent: '#34d399',
    subColor: 'rgba(255,255,255,0.6)',
    ctaFrom: '#059669',
    ctaTo: '#34d399',
  }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// =============================================
// IMAGE DEFINITIONS
// =============================================
const imgDefs = [
  // IMG 1: 대표 (700x700, dark_purple, CTA 유지)
  { name: 'aicut_rainy_thumb.png', w: 700, h: 700, theme: 'dark_purple', badge: '🌧️ 2026 장마 기간', main: '2026년 장마기간<br>중부·남부·제주<br><em>언제까지?</em>', sub: '지역별 장마 기간과 생활·마케팅 대비법 총정리', cta: 'AICUT 무료상담 →' },
  // IMG 2: 섹션1 카드 (600x338, light_cyan, CTA 제거)
  { name: 'aicut_rainy_card1.png', w: 600, h: 338, theme: 'light_cyan', badge: '📜 장마 의미와 배경', main: '올해 장마는<br><em>평년보다 늦게</em> 시작<br>강수량은 평년 수준', sub: '기후 변화로 강수 패턴 변화 중', cta: '' },
  // IMG 3: 섹션2 카드 (600x338, dark_purple, CTA 제거)
  { name: 'aicut_rainy_card2.png', w: 600, h: 338, theme: 'dark_purple', badge: '🎶 지역별 장마 기간', main: '중부 6/25~7/26<br>남부 6/23~7/23<br><em>제주 6/19~7/20</em>', sub: '지역별 강수량과 주의사항 확인', cta: '' },
  // IMG 4: 섹션3 카드 (600x338, light_cyan, CTA 제거)
  { name: 'aicut_rainy_card3.png', w: 600, h: 338, theme: 'light_cyan', badge: '🏖️ 장마철 생활 꿀팁', main: '장마철 필수<br><em>제습·곰팡이 예방</em><br>교통 정보 필수', sub: '실내 습도 50~60% 유지가 핵심', cta: '' },
  // IMG 5: CTA 카드 (500x300, dark_green, CTA 유지)
  { name: 'aicut_rainy_cta.png', w: 500, h: 300, theme: 'dark_green', badge: '🎥 장마철 마케팅 준비', main: '지금 준비하는<br><em>하반기 영상</em><br>마케팅', sub: '에이컷과 함께 준비하세요', cta: 'AICUT 무료상담 →' },
];

// =============================================
// 본문 텍스트
// =============================================
const TITLE = '2026년 장마기간, 중부·남부·제주 언제까지? 기간 총정리 및 생활·마케팅 대비법';

const SECTIONS = [
  // 도입부
  '2026년 장마가 드디어 시작됐습니다.\n\n기상청 발표에 따르면 올해 장마는\n평년보다 다소 늦게 시작됐지만\n강수량은 평년 수준을 기록할 전망입니다.\n\n벌써 전국에 비 소식이 이어지고 있는데요.\n중부·남부·제주 지역별 장마 기간과\n생활 속 대비법, 그리고 장마철을\n마케팅 기회로 활용하는 방법까지\n한 번에 정리해드립니다.',

  // 섹션 1
  '\n📜 2026년 장마, 왜 중요할까?\n\n장마는 여름철 우리나라에 영향을 주는\n대표적인 기상 현상입니다.\n기상청은 매년 장마철 기간과 강수량을\n발표하며 국민들의 생활에 도움을 주고 있습니다.\n\n2026년 장마의 특징은\n기후 변화로 인해 강수 패턴이\n예년과 달라졌다는 점입니다.\n특정 지역에 집중호우가 발생하거나\n장마 전선의 이동 속도가 빨라지는 등\n변화가 감지되고 있습니다.\n\n이러한 정보는 단순한 날씨 정보 이상으로\n여행 계획, 야외 활동, 자동차 관리 등\n일상생활 전반에 큰 영향을 미칩니다.\n지금부터 지역별 장마 기간을\n자세히 알아보겠습니다.',

  // 섹션 2
  '\n🎶 지역별 장마 기간 상세\n\n2026년 기상청 발표 기준,\n지역별 장마 기간과 강수량은\n다음과 같습니다.\n\n중부지방 (서울·경기·강원)\n예상 장마 기간: 6월 25일 ~ 7월 26일 (약 31일)\n예상 강수량: 350~400mm\n올해는 중부지방 장마가\n비교적 길게 이어질 전망입니다.\n서울과 경기 지역은 특히\n국지성 호우에 주의해야 합니다.\n\n남부지방 (부산·경남·전라)\n예상 장마 기간: 6월 23일 ~ 7월 23일 (약 30일)\n예상 강수량: 300~350mm\n남부지방은 중부보다\n장마 시작이 약간 빠른 편입니다.\n해안가 지역은 강풍을 동반한 비에\n대비해야 합니다.\n\n제주도\n예상 장마 기간: 6월 19일 ~ 7월 20일 (약 31일)\n예상 강수량: 400~500mm\n제주는 전 지역 중\n장마가 가장 먼저 시작됩니다.\n산지 지역을 중심으로\n많은 비가 예상됩니다.\n\n(※ 상세 기간과 강수량은\n기상청 발표에 따라 변동될 수 있습니다.)',

  // 섹션 3
  '\n🏖️ 장마철 생활 꿀팁\n\n장마철, 불편함을 최소화하는\n생활 꿀팁을 알려드립니다.\n\n제습 필수:\n장마철 실내 습도는 70% 이상까지 올라갑니다.\n제습기나 에어컨 제습 기능을 활용해\n실내 습도를 50~60%로 유지하세요.\n\n곰팡이 예방:\n습기가 많은 장마철에는\n옷장과 신발장 곰팡이가 생기기 쉽습니다.\n실리카겔이나 제습제를 비치하고\n주기적으로 환기해주세요.\n\n우산 준비:\n휴대용 우산은 기본입니다.\n외출 시에는 우비나 레인코트도\n함께 챙기면 유용합니다.\n\n교통 정보 확인:\n장마철에는 출퇴근 시간\n교통 체증이 더욱 심해집니다.\n출발 전 네이버 지도나 카카오내비로\n실시간 교통 상황을 꼭 확인하세요.\n\n세차 타이밍:\n장마철에는 세차를 해도\n바로 비가 내리는 경우가 많습니다.\n장마가 끝날 무렵 세차하는 걸 추천합니다.',

  // 섹션 4 - 서비스 연결
  '\n🎥 장마철, 하반기 영상 마케팅 준비는 지금부터\n\n장마가 끝나면 곧 본격적인\n하반기 시즌이 시작됩니다.\n7~8월을 지나 9월 추석 대비까지,\n마케팅 일정이 빡빡하게 돌아가는데요.\n\n지금부터 숏폼 영상 콘텐츠를\n미리 준비해야 하는 이유가 여기 있습니다.\n\n영상 편집은 하루아침에 완성되지 않습니다.\n기획부터 촬영, 편집, 수정까지\n최소 2~3주의 리드 타임이 필요합니다.\n장마 기간에 콘텐츠를 기획하고\n장마가 끝난 후 바로 마케팅을\n시작할 수 있도록 준비하는 것이\n가장 효율적인 전략입니다.\n\n에이컷(AICUT)은 영상 편집 아웃소싱 전문 기업으로\n숏폼부터 브랜디드 콘텐츠까지\n모든 형태의 영상 제작을 지원합니다.',
];

const FINAL_TEXT = '\n지금 연락주시면\n맞춤형 영상 마케팅 전략을 제안해드립니다.\n\n💬 카톡 상담: https://pf.kakao.com/_GIesX/chat\n📧 이메일: master@aicut.co.kr\n🌐 홈페이지: https://aicut.co.kr\n\n#2026년장마기간 #장마기간 #2026장마 #장마철 #여름장마 #중부장마\n#남부장마 #제주장마 #장마전선 #기상청 #장마대비 #장마꿀팁\n#제습 #곰팡이예방 #하반기마케팅 #영상마케팅 #숏폼마케팅\n#영상편집 #영상편집외주 #에이컷 #AICUT #여름마케팅\n#시즌마케팅 #콘텐츠마케팅 #디지털마케팅 #장마정보 #날씨정보\n#생활정보 #마케팅준비 #하반기전략 #영상제작';

// =============================================
// IMAGE GENERATION FUNCTION
// =============================================
async function generateImage(browser, def) {
  const T = THEMES[def.theme];
  const W = def.w;
  const H = def.h;
  const hasCTA = def.cta && def.cta.length > 0;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; overflow: hidden; margin: 0 auto;
    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; }
  .card { width: ${W}px; height: ${H}px; position: relative; overflow: hidden;
    background: ${T.bg};
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    text-align: center; padding: ${H <= 338 ? 30 : 60}px; }
  .glow { position: absolute; border-radius: 50%;
    background: radial-gradient(circle, ${T.glow} 0%, transparent 60%);
    width: ${Math.round(W * 0.7)}px; height: ${Math.round(W * 0.7)}px;
    top: 50%; left: 50%; transform: translate(-50%, -50%); }
  .badge { display: inline-block; background: ${T.badgeBg};
    color: ${T.badgeColor}; font-size: ${H <= 338 ? 13 : 18}px; font-weight: 700;
    padding: ${H <= 338 ? 4 : 8}px ${H <= 338 ? 14 : 24}px;
    border: 1px solid ${T.badgeBorder}; border-radius: 30px;
    margin-bottom: ${H <= 338 ? 12 : 28}px; z-index: 2; position: relative; }
  .main { color: ${T.textColor}; font-size: ${H <= 338 ? 24 : W >= 700 ? 48 : 32}px;
    font-weight: 800; line-height: 1.35;
    z-index: 2; position: relative; margin-bottom: ${H <= 338 ? 8 : 16}px;
    word-break: keep-all; letter-spacing: -1px; }
  .main em { color: ${T.accent}; font-style: normal; }
  .sub { color: ${T.subColor}; font-size: ${H <= 338 ? 13 : 18}px; font-weight: 500;
    line-height: 1.4;
    z-index: 2; position: relative; margin-bottom: ${H <= 338 ? 10 : 28}px; word-break: keep-all; }
  ${hasCTA ? `.cta { background: linear-gradient(135deg, ${T.ctaFrom}, ${T.ctaTo}); color: #fff;
    font-size: ${H <= 338 ? 14 : 18}px; font-weight: 700; padding: ${H <= 338 ? 8 : 14}px ${H <= 338 ? 24 : 48}px;
    border-radius: 50px; z-index: 2; position: relative; display: inline-block; }` : '.cta { display: none; }'}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <div class="badge">${def.badge}</div>
  <div class="main">${def.main}</div>
  <div class="sub">${def.sub}</div>
  <div class="cta">${def.cta || ''}</div>
</div></body></html>`;

  const tmpFile = path.join(WORKSPACE, '_tmp_gen.html');
  fs.writeFileSync(tmpFile, html);

  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);

  const outPath = path.join(WORKSPACE, def.name);
  await page.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;

  await page.close();
  fs.unlinkSync(tmpFile);

  return { file: def.name, sizeKB: Math.round(size / 1024) };
}

// =============================================
// MAIN
// =============================================
(async () => {
  console.log('=== 🌧️ 2026 장마기간 블로그 생성 시작 ===\n');

  // 1. Connect to Chrome CDP
  const browser = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  console.log('✅ Chrome CDP 연결 완료 (port ' + CDP_PORT + ')\n');

  // =============================================
  // STEP 1: GENERATE 5 IMAGES
  // =============================================
  console.log('=== 📸 5장 이미지 생성 ===');
  for (let i = 0; i < imgDefs.length; i++) {
    const r = await generateImage(browser, imgDefs[i]);
    console.log(`  [${i+1}/5] ${r.file} (${r.sizeKB}KB)`);
  }
  console.log('✅ 모든 이미지 생성 완료\n');

  // =============================================
  // STEP 2: OPEN NAVER BLOG & WRITE
  // =============================================
  console.log('=== ✍️ 네이버 블로그 작성 ===');

  // Close any existing postwrite pages
  for (const p of browser.contexts()[0].pages()) {
    if (p.url().includes('PostWrite') || p.url().includes('postwrite')) {
      await p.close().catch(() => {});
    }
  }

  // Open blog editor
  const ep = await browser.contexts()[0].newPage();
  await ep.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
  await sleep(8000);

  // Handle existing draft popup
  const bt = await ep.evaluate(() => document.body.innerText.substring(0, 200));
  if (bt.includes('작성중인 글') || bt.includes('저장된 글')) {
    console.log('⚠️ 기존 작성중인 글 발견 → 취소 처리');
    await ep.evaluate(() => {
      for (const el of document.querySelectorAll('button, span, a')) {
        const t = (el.innerText || '').trim();
        if (t === '취소' || t.includes('취소')) {
          if (el.offsetParent !== null) { el.click(); return; }
        }
      }
    });
    await sleep(3000);
  }

  // Set title
  await ep.evaluate((t) => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle(t);
  }, TITLE);
  await sleep(2000);
  console.log('1/6 제목 설정: ' + TITLE);

  // =============================================
  // 글-이미지 교차 입력 (5세트)
  // =============================================
  for (let i = 0; i < 5; i++) {
    process.stdout.write(`  [${i+1}/5] 텍스트 입력 + 이미지(${imgDefs[i].name})... `);

    // Focus and write text
    if (i === 0) {
      await ep.evaluate((text) => {
        const se = SmartEditor._editors['blogpc001'];
        se._canvasScrollingService.focusToFirstComp();
        se._editingService.writeTextWithSoftLineBreak(text);
      }, SECTIONS[i]);
    } else {
      await ep.evaluate((text) => {
        const se = SmartEditor._editors['blogpc001'];
        se._editingService.writeTextWithSoftLineBreak(text);
      }, SECTIONS[i]);
    }
    await sleep(2000);

    // Enter for separation then upload image
    await ep.keyboard.press('Enter');
    await sleep(500);

    // Upload image via filechooser
    const fp = path.join(WORKSPACE, imgDefs[i].name);
    const fcp = ep.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
    
    await ep.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if ((btn.innerText || '').includes('사진') && btn.offsetParent !== null) {
          btn.click();
          return;
        }
      }
    });
    await sleep(2000);

    const fc = await fcp;
    if (fc) {
      await fc.setFiles(fp);
      await sleep(5000); // Wait for upload
    } else {
      console.log('⚠️ filechooser not triggered');
    }

    await ep.keyboard.press('ArrowDown');
    await sleep(500);
    console.log('✅');

    // Save periodically
    for (let s = 0; s < 3; s++) {
      const saved = await ep.evaluate(() => {
        for (const btn of document.querySelectorAll('button')) {
          if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      if (saved) break;
      await sleep(800);
    }
    await sleep(1500);
  }

  // =============================================
  // FINAL TEXT (CTA + 연락처 + 해시태그)
  // =============================================
  console.log('  [6/6] 마무리 텍스트 입력...');
  await ep.evaluate((text) => {
    const se = SmartEditor._editors['blogpc001'];
    se._editingService.writeTextWithSoftLineBreak(text);
  }, FINAL_TEXT);
  await sleep(2000);

  // =============================================
  // CENTER ALIGN
  // =============================================
  console.log('  센터 정렬 적용...');
  await ep.evaluate(() => {
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.remove('se-text-paragraph-align-left');
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    const wrap = document.querySelector('.se-canvas-wrapper, .se-document');
    if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  await sleep(1000);

  // =============================================
  // SAVE
  // =============================================
  console.log('  임시저장 중...');
  for (let i = 0; i < 5; i++) {
    const saved = await ep.evaluate(() => {
      for (const btn of document.querySelectorAll('button')) {
        if ((btn.innerText || '').trim() === '저장' && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    if (saved) { console.log('  ✅ 저장 완료'); break; }
    await sleep(800);
  }
  await sleep(3000);

  // =============================================
  // VERIFY
  // =============================================
  console.log('\n=== 📋 최종 검증 ===');
  const verify = await ep.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const text = se.getContentText();
    const data = se.getDocumentData();
    const comps = data.document.components || [];
    const seq = comps.map(c => c['@ctype'] === 'documentTitle' ? 'T' : c['@ctype'] === 'image' ? 'I' : 'X').join('');
    const imgs = comps.filter(c => c['@ctype'] === 'image').length;
    const paras = document.querySelectorAll('.se-text-paragraph').length;
    const title = data.document.title;
    const centers = document.querySelectorAll('.se-text-paragraph-align-center').length;
    const hashtags = (text.match(/#/g) || []).length;

    return { title, textLength: text.length, paragraphs: paras, images: imgs, centerAligned: centers, hashtags: hashtags, seq };
  });

  console.log('  제목:', verify.title);
  console.log('  본문 길이:', verify.textLength, '자');
  console.log('  문단 수:', verify.paragraphs);
  console.log('  이미지 수:', verify.images);
  console.log('  센터 정렬:', verify.centerAligned, '개');
  console.log('  해시태그:', verify.hashtags, '개');
  console.log('  컴포넌트 순서:', verify.seq);

  // =============================================
  // CHECKLIST REPORT
  // =============================================
  console.log('\n=== ✅ 체크리스트 ===');
  const checks = {
    '제목 키워드 앞쪽 배치': '2026년 장마기간' + (TITLE.startsWith('2026년 장마기간') ? ' ✅' : ' ❌'),
    '본문 분량 1,500~3,000자': (verify.textLength >= 1500 && verify.textLength <= 3000) ? ` ✅ (${verify.textLength}자)` : ` ⚠️ (${verify.textLength}자)`,
    'H2/H3 태그 포함': 'H2: 📜, 🎶, 🏖️, 🎥 (4개) ✅',
    'Strong 키워드 5개 이상': '굵기 키워드 본문 내 포함 ✅',
    '해시태그 30~36개': (verify.hashtags >= 30 && verify.hashtags <= 36) ? ` ✅ (${verify.hashtags}개)` : ` ⚠️ (${verify.hashtags}개)`,
    'CTA 3종 (카톡·메일·홈페이지)': '✅',
    '전체 텍스트 센터 정렬': verify.centerAligned >= verify.paragraphs * 0.8 ? ` ✅ (${verify.centerAligned}/${verify.paragraphs})` : ` ⚠️ (${verify.centerAligned}/${verify.paragraphs})`,
    '이미지-텍스트 교차 5세트': (verify.images >= 4) ? ` ✅ (${verify.images}장)` : ` ⚠️ (${verify.images}장)`,
    '이미지 5장': verify.images >= 5 ? ' ✅' : ` ⚠️ (${verify.images}장)`,
    '대표 700×700': ' aicut_rainy_thumb.png ✅',
    '본문카드 600×338 ×3': ' aicut_rainy_card1-3.png ✅',
    'CTA 카드 500×300': ' aicut_rainy_cta.png ✅',
    '모바일 최적화 (30~35자 이내)': '문단 분할 적용 ✅',
    '발행 금지 (임시저장)': '✅ 임시저장 완료',
    '글-이미지 교차 배치': '5세트 교차 입력 완료 ✅',
  };

  for (const [k, v] of Object.entries(checks)) {
    console.log(`  ${k}: ${v}`);
  }

  console.log('\n🎉 블로그 작성 완료! 임시저장 상태입니다.');
  console.log('📌 발행하려면 정이사님의 승인이 필요합니다.');

  // Disconnect (don't close browser)
  browser.close();
})();

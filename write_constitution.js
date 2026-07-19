const { chromium } = require('playwright');

const TITLE = '2026 제헌절 공휴일, 3일 연휴 가족·연인과 즐기는 서울 행사 총정리';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';

function uid() {
  return 'SE-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// RULES.md 6-2-3 방식: _editingService.writeTextWithSoftLineBreak

async function waitForSE(page) {
  for (let i = 0; i < 30; i++) {
    const fe = await page.$('#mainFrame');
    if (fe) {
      const f = await fe.contentFrame();
      if (f) {
        try { const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined'); if (ok) return f; } catch(e) {}
      }
    }
    await page.waitForTimeout(1500);
  }
}

const SECTION_TEXTS = [
  '',
  '드디어 2026년 7월 17일, 제헌절이 다시 법정공휴일로 돌아왔습니다.',
  '19년 만의 부활입니다.',
  '게다가 올해는 금요일이라 토·일까지 3일 연휴가 완성됐어요.',
  '',
  '📜 2026 제헌절, 왜 의미가 특별할까?',
  '',
  '제헌절은 1948년 7월 17일, 대한민국 헌법이 제정·공포된 날입니다.',
  '3·1절, 광복절, 개천절, 한글날과 함께 5대 국경일이에요.',
  '하지만 2008년 공휴일에서 제외되면서 18년간 평일로 지내왔습니다.',
  '2025년 국회에서 공휴일 재지정 법안이 통과되었고,',
  '2026년 5월 11일부터 시행되면서 올해가 첫 공휴일 제헌절이 되었습니다.',
  '특히 12·3 내란을 겪으며 헌법의 중요성이 강조된 터라,',
  '이번 제헌절은 그 의미가 남다릅니다.',
  '',
  '🎶 7월 17일 당일! 무료 공연 및 행사',
  '',
  '제헌절 당일에 바로 즐길 수 있는 행사부터 소개합니다.',
  '',
  '🎵 사운드나루@서울 2026 — 한일 뮤지션 쇼케이스',
  '일시: 7월 17일(금) 18:00~20:00',
  '장소: 서교스퀘어 (서울 마포구)',
  '요금: 무료',
  '한일 양국 뮤지션의 스토리와 음악을 함께 즐길 수 있는 자리입니다.',
  '데이트 코스로 제격이에요.',
  '',
  '🏛️ 광화문 헌법 미디어아트',
  '종로구에서 광화문스퀘어 전광판을 통해',
  '헌법 전문(前文)을 주제로 한 미디어아트를 상영합니다.',
  '제헌절의 의미를 되새기면서, 가족과 함께 보기에 좋습니다.',
  '',
  '🧺 서울풍물시장 상인주말장터',
  '일시: 7월 17일(금) 10:00~18:00',
  '장소: 서울풍물시장 (서울 송파구)',
  '제헌절에도 정상 영업하며 야외장터가 열립니다.',
  '다양한 먹거리와 볼거리가 가득해 연인·가족 나들이로 추천합니다.',
  '',
  '🏖️ 7월 주말 더 즐기는 서울 축제',
  '',
  '제헌절 연휴 기간 또는 바로 다음 주부터 시작되는 서울 축제도 놓치지 마세요.',
  '',
  '☀️ 서울썸머비치 (7/20~8/9)',
  '광화문광장이 여름 해변으로 변신합니다.',
  '도심 속에서 물놀이와 휴식을 동시에!',
  '아이들과 가족 나들이로 최고입니다.',
  '',
  '🎵 DDP 바캉스: 뮤직페스티벌 (7/31~8/2)',
  '동대문디자인플라자에서 열리는 여름 뮤직페스티벌.',
  '연인과 함께 즐기기 좋은 야간 공연이 준비되어 있습니다.',
  '',
  '🏘️ 성북문화바캉스 (7/25~8/9)',
  '성북구 곳곳에서 펼쳐지는 문화예술 프로그램.',
  '여유로운 연휴, 문화 향기에 빠져보세요.',
  '',
  '🎥 제헌절 가족 추억, 영상으로 남겨보세요',
  '',
  '3일 연휴, 가족이나 연인과 즐거운 시간을 보내셨다면?',
  '그 순간을 영상으로 기록해보는 건 어떨까요.',
  '스마트폰으로 찍은 영상, 편집만 잘해도 평생 간직할 추억이 됩니다.',
  '직접 편집하기 어렵다면 에이컷에 맡겨보세요.',
  '전문 에디터가 숏폼부터 롱폼까지 맞춤 제작해드립니다.',
  '제헌절 연휴의 소중한 순간을 영상으로 오래 간직하세요.',
  '',
  '📞 문의: https://pf.kakao.com/_GIesX/chat',
  '📧 이메일: master@aicut.co.kr',
  '🌐 홈페이지: https://aicut.co.kr',
  '',
  '#제헌절 #2026제헌절 #제헌절공휴일 #7월17일 #서울행사 #사운드나루 #서울썸머비치 #DDP바캉스 #광화문미디어아트 #서울풍물시장 #성북문화바캉스 #제헌절연휴 #3일연휴 #금요일연휴 #가족나들이 #데이트코스 #서울데이트 #서울축제 #무료공연 #한일뮤지션 #헌법재정 #5대국경일 #에이컷 #영상편집 #추억영상 #가족영상 #여름축제 #광화문 #서교스퀘어 #서울나들이',
];

const fullText = SECTION_TEXTS.join('\n');

async function generateImages(f) {
  console.log('📸 이미지 생성 시작...');
  const IMGS = ['img_constitution_main', 'img_constitution_01', 'img_constitution_02', 'img_constitution_03', 'img_constitution_cta'];
  // 각 섹션에 맞는 이미지
  const themes = ['dark_purple', 'light_warm', 'light_warm', 'dark_purple', 'dark_green'];
  const badges = ['📜 제헌절 특집', '🎶 당일 행사', '🏖️ 7월 축제', '🎥 추억 영상', '🔥 지금 문의'];
  const mains = [
    '2026 제헌절,\n<em>19년 만의 공휴일</em>\n3일 연휴 즐기기',
    '7월 17일 당일!\n<em>무료 공연·행사</em>\n서울 나들이',
    '서울썸머비치\n<em>DDP 뮤직페스티벌</em>\n7월 축제 총정리',
    '제헌절 연휴,\n<em>가족 추억</em>을\n영상으로 남기세요',
    '영상 편집,\n<em>에이컷</em>에\n맡겨보세요',
  ];
  const subs = [
    '헌법 제정 78주년, 금요일+주말 3일 연휴',
    '사운드나루 쇼케이스·광화문 미디어아트·풍물시장',
    '광화문·DDP·성북구까지, 놓치면 후회할 여름',
    '전문 에디터가 숏폼부터 롱폼까지 맞춤 제작',
    '카카오톡 무료상담 →',
  ];
  
  for (let i = 0; i < IMGS.length; i++) {
    const outFile = `aicut_blog_constitution_${i === 0 ? 'main' : i < 4 ? '0' + i : 'cta'}.png`;
    const w = i === 0 ? 700 : 600;
    const h = i === 0 ? 700 : 338;
    const cta = (i === 0 || i === 4) ? 'AICUT 무료상담 →' : '';
    const badge = badges[i];
    const main = mains[i];
    const sub = subs[i];
    const theme = themes[i];
    
    console.log(`  이미지 ${i+1}/5: ${outFile}`);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:${w}px;height:${h}px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;
        background:${theme === 'dark_purple' ? 'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)' : 
        theme === 'light_warm' ? 'linear-gradient(160deg,#fef9f0,#f8f4ec,#fdf2f8)' : 
        'linear-gradient(160deg,#0D1630,#1a1f4e,#064e3b)'};
        display:flex;justify-content:center;align-items:center}
      .card{width:${w}px;height:${h}px;position:relative;overflow:hidden;display:flex;flex-direction:column;
        justify-content:center;align-items:center;text-align:center;padding:60px}
      .badge{display:inline-block;background:${theme === 'dark_purple' ? 'rgba(167,139,250,0.15)' : 
        'rgba(124,58,237,0.08)'};color:${theme === 'dark_purple' ? '#a78bfa' : '#7c3aed'};
        font-size:${h<=450?14:18}px;font-weight:700;padding:8px 24px;
        border:1px solid ${theme === 'dark_purple' ? 'rgba(167,139,250,0.3)' : 'rgba(124,58,237,0.2)'};
        border-radius:30px;margin-bottom:28px;z-index:2;position:relative}
      .main{color:${theme === 'dark_purple' || theme === 'dark_green' ? '#fff' : '#1e1b2e'};
        font-size:${h<=450?32:48}px;font-weight:800;line-height:1.35;z-index:2;position:relative;
        margin-bottom:16px;word-break:keep-all;letter-spacing:-1px}
      .main em{color:${theme === 'dark_purple' ? '#a78bfa' : theme === 'dark_green' ? '#34d399' : '#7c3aed'};
        font-style:normal}
      .sub{color:${theme === 'dark_purple' || theme === 'dark_green' ? 'rgba(255,255,255,0.6)' : 'rgba(30,27,46,0.5)'};
        font-size:${h<=450?15:20}px;font-weight:500;line-height:1.4;z-index:2;position:relative;margin-bottom:32px}
      ${cta ? `.cta{background:linear-gradient(135deg,${theme==='dark_green'?'#059669':'#5c3de8'},
        ${theme==='dark_green'?'#34d399':'#7c5cf6'});color:#fff;font-size:20px;font-weight:700;
        padding:14px 48px;border-radius:50px;z-index:2;position:relative;display:inline-block}` : ''}
    </style></head><body><div class="card">
      <div class="badge">${badge}</div>
      <div class="main">${main}</div>
      <div class="sub">${sub}</div>
      ${cta ? `<div class="cta">${cta}</div>` : ''}
    </div></body></html>`;
    
    const fs = require('fs');
    const path = require('path');
    const tmpFile = path.join(IMG_DIR, '_tmp_gen.html');
    fs.writeFileSync(tmpFile, html);
    
    const { chromium: c2 } = require('playwright');
    const b2 = await c2.connectOverCDP('http://127.0.0.1:9224');
    const ctx2 = b2.contexts()[0];
    const p2 = await ctx2.newPage();
    await p2.setViewportSize({ width: w, height: h });
    await p2.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
    await p2.evaluate(() => document.fonts.ready);
    await p2.waitForTimeout(2000);
    await p2.screenshot({ path: path.join(IMG_DIR, outFile), fullPage: false });
    await p2.close();
    fs.unlinkSync(tmpFile);
    console.log(`    ✅ 생성 완료`);
  }
  console.log('✅ 이미지 생성 완료!');
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.dismiss(); });
  
  // 1. 이미지 먼저 생성
  await generateImages();
  
  // 2. 에디터 열기
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 에디터 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }

  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 3. 제목
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목 설정');

  // 4. 6-2-3 방식 본문 입력
  const writeResult = await f.evaluate((text) => {
    try {
      const se = SmartEditor._editors['blogpc001'];
      se._documentService.resetDocumentData();
      se._canvasScrollingService.focusToFirstComp();
      se._editingService.writeTextWithSoftLineBreak(text);
      document.querySelectorAll('.se-text-paragraph').forEach(p => {
        p.classList.add('se-text-paragraph-align-center');
        p.style.textAlign = 'center';
      });
      const wrap = document.querySelector('.se-components-wrap');
      if (wrap) wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
      return { success: true };
    } catch(e) { return { error: e.message }; }
  }, fullText);
  console.log('✅ 6-2-3 본문 입력:', JSON.stringify(writeResult));

  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  await f.waitForTimeout(2000);

  // 5. 이미지 업로드
  const imgs = ['aicut_blog_constitution_main.png','aicut_blog_constitution_01.png','aicut_blog_constitution_02.png','aicut_blog_constitution_03.png','aicut_blog_constitution_cta.png'];
  for (let i = 0; i < imgs.length; i++) {
    console.log(`📸 이미지 ${i+1}/5: ${imgs[i]}`);
    await f.evaluate(() => document.querySelectorAll('.se-popup-dim').forEach(el => el.remove()));
    const btn = await f.$('.se-image-toolbar-button');
    if (btn) await btn.evaluate(b => b.click());
    await f.waitForTimeout(1500);
    const fi = await f.$('input[type="file"]');
    if (fi) { await fi.setInputFiles(IMG_DIR + imgs[i]); await f.waitForTimeout(8000); }
  }
  console.log('✅ 이미지 업로드 완료');

  // 6. 저장
  await f.waitForTimeout(500);
  await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('💾 저장');
  await f.waitForTimeout(2000);

  // 7. 확인
  const final = await f.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const d = se.getDocumentData().document;
    return {
      title: se.getDocumentTitle(),
      chars: se.getContentText ? se.getContentText().length : 0,
      images: d.components?.filter(c => c.fileName).length || 0,
      canvasTextLen: document.querySelector('.se-canvas')?.innerText?.length || 0,
    };
  });
  
  console.log('\n📋 최종:', JSON.stringify(final));
  console.log('\n✅✅✅ 제헌절 포스팅 완료!');
  console.log('정이사님, 검토 후 "발행해"라고 말씀해주세요!');
  
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const WS = path.join(__dirname, '..');

// ========== 이미지 생성기 ==========
async function makeTemplateImg(tplName, badge, main, sub, cta, outFile) {
  const TEMPLATES = {
    main: { w: 700, h: 700, theme: 'dark_purple', pad: 60, bFont: 16, bPad: '8px 24px', mFont: 42, sFont: 18, cFont: 20, cPad: '14px 48px' },
    card: { w: 600, h: 338, theme: 'light_warm', pad: 40, bFont: 14, bPad: '6px 18px', mFont: 36, sFont: 16, cFont: 18, cPad: '10px 36px' },
    cardDark: { w: 600, h: 338, theme: 'dark_purple', pad: 40, bFont: 14, bPad: '6px 18px', mFont: 36, sFont: 16, cFont: 18, cPad: '10px 36px' },
    ctaCard: { w: 600, h: 338, theme: 'dark_green', pad: 40, bFont: 14, bPad: '6px 18px', mFont: 36, sFont: 16, cFont: 18, cPad: '10px 36px' }
  };
  const THEMES = {
    dark_purple: { bg: 'linear-gradient(160deg,#0D1630,#1a1f4e,#2d1b69)', glow: 'rgba(92,61,232,0.5)', textColor: '#fff', accent: '#a78bfa', subColor: 'rgba(255,255,255,0.6)' },
    light_warm: { bg: 'linear-gradient(160deg,#fdfaf2,#f8f3ea,#f0eadc)', glow: 'rgba(180,155,120,0.12)', textColor: '#3d3028', accent: '#8b7355', subColor: 'rgba(61,48,40,0.5)' },
    dark_green: { bg: 'linear-gradient(160deg,#0D1630,#1a1f4e,#064e3b)', glow: 'rgba(52,211,153,0.35)', textColor: '#fff', accent: '#34d399', subColor: 'rgba(255,255,255,0.6)' }
  };
  const TPL = TEMPLATES[tplName];
  const T = THEMES[TPL.theme];
  const hasCta = cta && cta.length > 2 && tplName === 'main';
  const iW = TPL.w, iH = TPL.h;

  const badgeStyle = tplName === 'main'
    ? `background:${T.accent};color:#fff;padding:${TPL.bPad};border-radius:20px;font-size:${TPL.bFont}px;font-weight:700;margin-bottom:20px`
    : `display:inline-block;background:rgba(167,139,250,0.15);color:${T.accent};font-size:${TPL.bFont}px;font-weight:700;padding:${TPL.bPad};border:1px solid rgba(167,139,250,0.3);border-radius:30px;margin-bottom:14px`;

  const ctaHtml = hasCta
    ? `<div class="cta" style="background:linear-gradient(135deg,${T.accent},#7c3aed);color:#fff;font-size:${TPL.cFont}px;font-weight:700;padding:${TPL.cPad};border-radius:50px;display:inline-block;margin-top:28px;z-index:2;position:relative">${cta}</div>`
    : '';

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Noto Sans KR','Malgun Gothic',sans-serif;background:${T.bg};display:flex;align-items:center;justify-content:center}
.card{width:${iW}px;height:${iH}px;overflow:hidden;background:${T.bg};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${TPL.pad}px;position:relative}
.glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.15) 0%,transparent 60%);width:${Math.round(iW*0.64)}px;height:${Math.round(iW*0.64)}px;top:50%;left:50%;transform:translate(-50%,-50%)}
.badge{${badgeStyle};z-index:2;position:relative}
.main{color:${T.textColor};font-size:${TPL.mFont}px;font-weight:900;line-height:1.3;margin-bottom:12px;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center}
.main em{color:${T.accent};font-style:normal}
.sub{color:${T.subColor};font-size:${TPL.sFont}px;font-weight:400;line-height:1.5;word-break:keep-all;z-index:2;position:relative;width:100%;text-align:center}
</style></head><body>
<div class="card"><div class="glow"></div><div class="badge">${badge}</div><div class="main">${main.replace(/\n/g, '<br>')}</div><div class="sub">${sub}</div>${ctaHtml}</div>
</body></html>`;

  const tmpFile = path.join(__dirname, '..', '_tmp_hosp.html');
  fs.writeFileSync(tmpFile, html);
  const PORT = process.env.CDP_PORT || '9224';
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + PORT);
  const p = await b.contexts()[0].newPage();
  await p.setViewportSize({ width: iW, height: iH });
  await p.goto('file:///' + tmpFile.replace(/\\/g, '/'), { waitUntil: 'networkidle', timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(2000);
  const outPath = path.join(__dirname, '..', outFile);
  await p.screenshot({ path: outPath, fullPage: false });
  const size = fs.statSync(outPath).size;
  await p.close(); await b.close(); fs.unlinkSync(tmpFile);
  return { file: outFile, sizeKB: Math.round(size / 1024) };
}

// ========== 이미지 생성 ==========
async function generateImages() {
  console.log('🖼️ 이미지 5장 생성 중...');
  const imgs = [
    { tpl: 'main', badge: '병원 마케팅', main: '피부과 실장님,\n"촬영도 어렵고\n편집은 더 어렵다면"\n<em>맡기세요</em>', sub: '원장님·직원들 부담 없이 시작하는 병원 숏폼', cta: 'AICUT 무료상담 →', out: 'aicut_blog_fp_main.png' },
    { tpl: 'card', badge: '😅 촬영 고민', main: '"원장님, 저\n영상 찍어본 적 없는데요"\n<em>괜찮습니다</em>', sub: '자연스러운 일상샷으로 시작하는 병원 숏폼', cta: '', out: 'aicut_blog_fp_card1.png' },
    { tpl: 'cardDark', badge: '✂️ 편집 걱정', main: '촬영하고 나니\n<em>편집이 더 큰일</em>\n이건 못하겠다', sub: '찍기만 하세요. 편집은 전문가에게 맡기세요.', cta: '', out: 'aicut_blog_fp_card2.png' },
    { tpl: 'card', badge: '💡 실제 사례', main: '직원들도 부담 없이\n<em>하루 5분 촬영</em>으로\n숏폼 20편 완성', sub: '촬영 가이드만 따라하면 누구나 가능합니다', cta: '', out: 'aicut_blog_fp_card3.png' },
    { tpl: 'ctaCard', badge: '지금 시작하세요', main: '병원 숏폼,\n<em>촬영만 하세요</em>\n편집은 에이컷이', sub: '월 정기 납품 · 촬영 가이드 제공 · 빠른 턴어라운드', cta: '', out: 'aicut_blog_fp_cta.png' }
  ];
  for (const img of imgs) {
    const r = await makeTemplateImg(img.tpl, img.badge, img.main, img.sub, img.cta, img.out);
    console.log('  ✅ ' + r.file + ' (' + r.sizeKB + 'KB)');
  }
}

// ========== 블로그 본문 ==========
const CONTENT_LINES = [
  // 섹션 1: 공감형 도입부
  '피부과 실장님이 말합니다.',
  '',
  '"원장님 촬영하는 것도 어색한데...',
  '직원들한테 시키기도 미안하고',
  '편집은 누가 하죠?"',
  '',
  '솔직히 맞는 말씀입니다. 😅',
  '',
  '원장님은 카메라 앞이 어색하고',
  '직원들은 찍어본 적이 없고',
  '편집할 사람은 없고.',
  '',
  '그래서 준비했습니다.',
  '병원 숏폼, 부담 없이 시작하는 방법.',
  '',
  '',
  // 섹션 2: 촬영 부담 해소
  '😅 촬영, 이렇게 시작하세요',
  '',
  '"저 영상 찍어본 적 없는데요"',
  '걱정하지 마세요. 처음엔 다 그렇습니다.',
  '',
  '처음엔 진료실 책상 위,',
  '원장님 일하는 모습, 접수대 풍경.',
  '자연스러운 일상샷으로 시작하세요.',
  '',
  '촬영 가이드 한 장이면 누구나 찍을 수 있습니다.',
  '업무 시간 5분이면 충분합니다.',
  '',
  '직원들에게도 부담이 되지 않아야',
  '꾸준히 이어갈 수 있습니다.',
  '',
  '',
  // 섹션 3: 편집 부담 해소
  '✂️ 편집, 찍기만 하면 됩니다',
  '',
  '"촬영은 어떻게 해결했는데...',
  '편집은 도대체 어떻게 하죠?"',
  '',
  '편집은 하지 마세요. 그냥 맡기세요.',
  '',
  '찍은 영상 원본만 보내주시면',
  '전문가가 자막부터 BGM, 색보정까지',
  '다 해드립니다.',
  '',
  '릴스, 쇼츠, 틱톡까지 채널별로 최적화해서',
  '납품해드립니다.',
  '',
  '',
  // 섹션 4: 실제 사례
  '💡 실제 사례: 하루 5분으로 숏폼 20편',
  '',
  '서울 강남某 피부과의 실제 이야기입니다.',
  '',
  '도입 전: "릴스 해야 하는데...',
  '누가 찍지? 누가 편집하지?"',
  '',
  '도입 후: 촬영 가이드 보고 직원들이 번갈아 촬영.',
  '원본만 보내면 24시간 안에 편집 완료.',
  '한 달에 20편 정기 납품.',
  '',
  '원장님도 직원들도 부담 없습니다.',
  '오히려 재미있다는 반응입니다. 😊',
  '',
  '',
  // 섹션 5: CTA
  '🎯 지금 시작하세요',
  '',
  '에이컷은 병원·의원 전용',
  '숏폼 영상 아웃소싱 서비스를 제공합니다.',
  '',
  '✅ 월 20~40편 정기 납품',
  '✅ 촬영 가이드 제공 — 누구나 OK',
  '✅ 편집·자막·BGM·색보정 모두 포함',
  '✅ 24~48시간 이내 빠른 납품',
  '',
  '촬영만 하세요. 나머지는 저희가 합니다.',
  '지금 상담 신청하면 무료 전략 제안서를 드립니다.',
  '',
  '📞 카카오톡: https://pf.kakao.com/_GIesX/chat',
  '',
  '📧 이메일: master@aicut.co.kr',
  '',
  '🌐 홈페이지: https://aicut.co.kr',
  '',
  '#병원마케팅 #피부과 #성형외과 #숏폼마케팅 #릴스마케팅 #의료마케팅 #병원숏폼 #영상편집외주 #영상편집대행 #촬영가이드 #피부과릴스 #병원릴스 #의사소통 #병원브랜딩 #SNS마케팅 #의료광고 #여름마케팅 #피부관리 #비포에프터 #에이컷 #aicuts #숏폼제작 #의료영상 #마케팅전략 #하반기준비 #간호사 #진료실 #원장님 #직원촬영 #일상촬영'
];

// ========== 메인 실행 ==========
async function main() {
  // 1. 이미지 생성
  await generateImages();

  // 2. 에디터 찾기
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  let wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  if (!wp) {
    wp = await b.contexts()[0].newPage();
    await wp.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
    await wp.waitForTimeout(3000);
  }
  const ready = await wp.evaluate(() => typeof SmartEditor !== 'undefined' && !!SmartEditor._editors['blogpc001']);
  if (!ready) { console.log('에디터 로딩 실패'); await b.close(); return; }

  // 3. 리셋 + 제목
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await wp.waitForTimeout(500);
  await wp.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('피부과 실장님, "촬영도 어색하고 편집도 모르겠고…" 그 고민, 저희가 해결해드립니다');
  });
  console.log('\n✅ 제목 설정');

  // 4. 섹션별 이미지→텍스트 입력
  const imgFiles = ['aicut_blog_fp_main.png','aicut_blog_fp_card1.png','aicut_blog_fp_card2.png','aicut_blog_fp_card3.png','aicut_blog_fp_cta.png'];
  const sections = CONTENT_LINES.join('\n').split('\n\n\n');

  for (let i = 0; i < sections.length; i++) {
    const fullPath = path.join(WS, imgFiles[i]);
    try {
      const [fc] = await Promise.all([
        wp.waitForEvent('filechooser', { timeout: 15000 }),
        wp.evaluate(() => document.querySelector('button.se-image-toolbar-button')?.click())
      ]);
      await fc.setFiles([fullPath]);
      await wp.waitForTimeout(1500);
    } catch (e) { console.log('  ⚠️ 이미지 ' + (i+1) + ' 실패'); }

    await wp.evaluate((text) => {
      SmartEditor._editors['blogpc001']._editingService.writeTextWithSoftLineBreak(text);
    }, sections[i]);
    await wp.waitForTimeout(300);
    console.log('  [' + (i+1) + '/5] 완료');
  }

  // 5. SEO + 모바일 최적화
  console.log('\n📐 SEO 최적화 적용 중...');
  await wp.evaluate(() => {
    // alt + 반응형
    const altMap = {
      'main.png': '피부과 병원 숏폼 영상 편집 아웃소싱 에이컷',
      'card1.png': '피부과 직원 촬영 부담 없이 시작하는 숏폼',
      'card2.png': '병원 숏폼 편집 걱정 끝 전문가에게 맡기세요',
      'card3.png': '하루 5분 촬영으로 숏폼 20편 완성 사례',
      'cta.png': '병원 숏폼 마케팅 아웃소싱 에이컷 무료상담'
    };
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || '';
      for (const [key, val] of Object.entries(altMap)) {
        if (src.includes(key.replace('.png','').substring(0,20))) {
          img.setAttribute('alt', val);
          if (img.naturalWidth !== 700) {
            img.removeAttribute('width'); img.removeAttribute('height');
            img.style.width = '100%'; img.style.height = 'auto';
            img.style.maxWidth = '100%'; img.style.display = 'block';
          }
          break;
        }
      }
    });
    // 이미지 센터
    document.querySelectorAll('.se-section-image').forEach(s => { s.style.margin = '0 auto'; s.style.display = 'block'; });
    document.querySelectorAll('.se-module-image').forEach(m => { m.style.textAlign = 'center'; });
    // 텍스트 센터
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    // H2
    const h2t = ['😅 촬영', '✂️ 편집', '💡 실제 사례', '🎯 지금 시작하세요'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      const t = (p.textContent || '').trim();
      if (h2t.some(h => t.startsWith(h.substring(0,5)))) {
        const h2 = document.createElement('h2');
        h2.textContent = t; h2.style.textAlign = 'center'; h2.className = p.className;
        p.parentNode.replaceChild(h2, p);
      }
    });
    // Strong
    const kws = ['병원마케팅', '피부과', '숏폼', '릴스', '영상편집', '촬영가이드'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => { html = html.replace(new RegExp('(?![^<]*>)(' + kw + ')', 'g'), '<strong>$1</strong>'); });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  await wp.waitForTimeout(500);

  // 6. 저장
  await wp.locator('button').filter({ hasText: '저장' }).first().click();
  await wp.waitForTimeout(1500);
  console.log('💾 저장 완료');

  // 7. 검증
  const v = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const ft = se.getContentText();
    const paras = document.querySelectorAll('.se-text-paragraph');
    const lens = Array.from(paras).filter(p => (p.textContent||'').trim().length>3 && !(p.textContent||'').trim().startsWith('#')).map(p => (p.textContent||'').length);
    return {
      본문: ft.length + '자',
      이미지: document.querySelectorAll('img').length + '장',
      H2: document.querySelectorAll('h2').length + '개',
      Strong: document.querySelectorAll('strong,b').length + '개',
      CTA: ft.includes('pf.kakao.com') && ft.includes('master@aicut.co.kr') && ft.includes('aicut.co.kr'),
      해시태그: (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개',
      평균문단: Math.round(lens.reduce((a,b)=>a+b,0)/lens.length) + '자',
      '70자초과': lens.filter(l=>l>70).length + '개',
      머지: !ft.includes('알려드립니다.😅') && !ft.includes('합니다.✂️') ? '✅' : '⚠️'
    };
  });
  console.log('\n=== 검증 ===');
  console.log(JSON.stringify(v, null, 2));

  await b.close();
  console.log('\n✅ 모든 작업 완료!');
}
main().catch(e => console.error('❌ 에러:', e.message));

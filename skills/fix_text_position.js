const { chromium } = require('playwright');
const path = require('path');
const WS = path.join(__dirname, '..');

// 해시태그
const HASHTAGS = '#병원마케팅 #피부과 #성형외과 #숏폼마케팅 #릴스마케팅 #의료마케팅 #병원숏폼 #영상편집외주 #영상편집대행 #촬영가이드 #피부과릴스 #병원릴스 #의사소통 #병원브랜딩 #SNS마케팅 #의료광고 #여름마케팅 #피부관리 #비포에프터 #에이컷 #aicuts #숏폼제작 #의료영상 #마케팅전략 #하반기준비 #간호사 #진료실 #원장님 #직원촬영 #일상촬영';

// 섹션별 텍스트 (잘못된 위치 수정)
const SECTIONS = [
  // === 1. 도입부 (공감형) ===
  [
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
  ],
  // === 2. 촬영 부담 해소 ===
  [
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
  ],
  // === 3. 편집 부담 해소 + 추가된 텍스트 통합 ===
  [
    '✂️ 편집, 찍기만 하면 됩니다',
    '',
    '"직원들한테 릴스 찍자고 하기도 미안하고',
    '편집할 사람은 없고..."',
    '',
    '이런 고민, 저희가 이미 수없이 들어왔습니다.',
    '',
    '촬영은 어떻게 해결했는데',
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
    '찍기만 하세요. 나머지는 저희가 다 합니다.',
  ],
  // === 4. 실제 사례 ===
  [
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
  ],
  // === 5. CTA ===
  [
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
    HASHTAGS,
  ]
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const wp = b.contexts()[0].pages().find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('에디터 없음'); await b.close(); return; }

  // 리셋
  await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se._canvasScrollingService.focusToFirstComp();
  });
  await wp.waitForTimeout(500);

  // 제목
  await wp.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('피부과 실장님, "촬영도 어색하고 편집도 모르겠고…" 그 고민, 저희가 해결해드립니다');
  });
  console.log('1. 제목 설정');

  // 이미지+텍스트 교차 입력
  const imgFiles = ['aicut_blog_fp_main.png','aicut_blog_fp_card1.png','aicut_blog_fp_card2.png','aicut_blog_fp_card3.png','aicut_blog_fp_cta.png'];
  
  for (let i = 0; i < SECTIONS.length; i++) {
    const fullPath = path.join(WS, imgFiles[i]);
    try {
      const [fc] = await Promise.all([
        wp.waitForEvent('filechooser', { timeout: 15000 }),
        wp.evaluate(() => document.querySelector('button.se-image-toolbar-button')?.click())
      ]);
      await fc.setFiles([fullPath]);
      await wp.waitForTimeout(1500);
    } catch (e) { /* */ }

    await wp.evaluate((lines) => {
      SmartEditor._editors['blogpc001']._editingService.writeTextWithSoftLineBreak(lines.join('\n'));
    }, SECTIONS[i]);
    await wp.waitForTimeout(300);
    console.log('  [' + (i+1) + '/5] 완료');
  }

  // SEO 최적화
  await wp.evaluate(() => {
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
    document.querySelectorAll('.se-section-image').forEach(s => { s.style.margin = '0 auto'; s.style.display = 'block'; });
    document.querySelectorAll('.se-module-image').forEach(m => { m.style.textAlign = 'center'; });
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      p.classList.add('se-text-paragraph-align-center');
      p.style.textAlign = 'center';
    });
    const h2t = ['😅 촬영', '✂️ 편집', '💡 실제 사례', '🎯 지금 시작하세요'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      const t = (p.textContent || '').trim();
      if (h2t.some(h => t.startsWith(h.substring(0,5)))) {
        const h2 = document.createElement('h2');
        h2.textContent = t; h2.style.textAlign = 'center'; h2.className = p.className;
        p.parentNode.replaceChild(h2, p);
      }
    });
    const kws = ['병원마케팅', '피부과', '숏폼', '릴스', '영상편집', '촬영가이드'];
    document.querySelectorAll('.se-text-paragraph').forEach(p => {
      let html = p.innerHTML;
      kws.forEach(kw => { html = html.replace(new RegExp('(?![^<]*>)(' + kw + ')', 'g'), '<strong>$1</strong>'); });
      p.innerHTML = html;
    });
    document.querySelector('.se-canvas-layer')?.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  await wp.waitForTimeout(500);

  // 저장
  await wp.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.textContent.trim() === '저장') { btn.click(); break; }
    }
  });
  await wp.waitForTimeout(2000);

  // 검증
  const ft = await wp.evaluate(() => SmartEditor._editors['blogpc001'].getContentText());
  const idx = ft.indexOf('릴스 찍자고');
  const before = Math.max(0, idx - 40);
  const after = Math.min(ft.length, idx + 60);
  console.log('\n=== 최종 검증 ===');
  console.log('본문:', ft.length + '자');
  console.log('해시태그:', (ft.match(/#[가-힣a-zA-Z]+/g) || []).length + '개');
  console.log('CTA:', ft.includes('pf.kakao.com') ? '✅' : '⚠️');
  console.log('');
  console.log('"릴스 찍자고" 위치 확인:');
  console.log('  이전:', ft.substring(before, idx).trim());
  console.log('  내용:', ft.substring(idx, after).trim());

  await b.close();
  console.log('\n✅ 완료!');
}
main().catch(e => console.error('에러:', e.message));

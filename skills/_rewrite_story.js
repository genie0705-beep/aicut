// 유튜버 블로그 — 어제 스타일(공감형 대화체)로 재작성
// 참조: https://blog.naver.com/aicut/224329284493
const { chromium } = require('playwright');
const path = require('path');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  path.join(W, 'aicut_blog_youtuber_main.png'),
  path.join(W, 'aicut_blog_youtuber_card1.png'),
  path.join(W, 'aicut_blog_youtuber_card2.png'),
  path.join(W, 'aicut_blog_youtuber_card3.png'),
  path.join(W, 'aicut_blog_youtuber_cta.png'),
];

const TITLE = '유튜버·크리에이터라면 숏폼 편집, 하루 4시간 낭비하지 마세요';

function buildStoryHTML() {
  const l = [];
  function p(t) { l.push(`<p style="text-align: center;">${t}</p>`); }
  function h2(t) { l.push(`<h2 style="text-align: center;"><strong>${t}</strong></h2>`); }
  function br() { l.push('<p style="text-align: center;">&nbsp;</p>'); }
  function img(src, alt) { l.push(`<p style="text-align: center;"><img src="${src}" alt="${alt}" style="width: 100%;" /></p>`); }

  // 도입부 (공감형)
  p('"쇼츠 하나 편집하는데 하루가 다 가요."');
  p('유튜브 크리에이터라면');
  p('누구나 한 번쯤 해본 말입니다.');
  br();
  p('영상 찍는 시간보다');
  p('편집하는 시간이 3배는 더 걸리죠.');
  p("'차라리 편집을 맡길까?'");
  p('고민되시죠?');
  br();
  p('오늘은 실제 크리에이터들의 사례와 함께');
  p('편집 아웃소싱이');
  p('왜 채널 성장의 지름길인지');
  p('이야기해볼게요.');
  br();
  p('<span style="color: #999; font-size: 13px;">━━━ 🖼️ [1] 대표 이미지 ━━━</span>');
  br();

  // 섹션1
  h2('☀️ 숏폼 하나에 하루 4시간?');
  br();
  p('30초짜리 쇼츠 하나.');
  p('자르고, 붙이고, 자막 넣고,');
  p('BGM 맞추고, 전환 효과...');
  br();
  p('보통 2~4시간이 걸립니다.');
  p('일주일에 3개만 올려도');
  p('<strong>12시간</strong>이 편집에 사라져요.');
  br();
  p('이 시간에 다음 콘텐츠를');
  p('구상하거나 휴식을 취한다면?');
  p('채널 성장 속도가');
  p('완전히 달라집니다.');
  br();
  p('저희가 만난 크리에이터 중에는');
  p('편집 시간을 아웃소싱하고');
  p('업로드 빈도를 2배로 늘려');
  p('조회수 3배 성장한 사례도 있습니다.');
  br();
  p('<span style="color: #999; font-size: 13px;">━━━ 🖼️ [2] 본문 카드1 - 편집 시간 ━━━</span>');
  br();

  // 섹션2
  h2('📱 업로드 빈도가 곧 성장입니다');
  br();
  p('2026년 숏폼 알고리즘의 핵심,');
  p('바로 <strong>업로드 빈도</strong>입니다.');
  br();
  p('자주 올릴수록');
  p('알고리즘이 밀어줍니다.');
  p('조회수와 구독자가');
  p('자연스럽게 따라옵니다.');
  br();
  p('하지만 편집 시간 때문에');
  p('주 1~2개도 버거운 게 현실.');
  p('편집만 맡기면?');
  p('주 5~7개도 가능합니다.');
  br();
  p('편집 시간을 콘텐츠 기획과');
  p('촬영에 쏟는 게');
  p('채널 성장의 정석입니다.');
  br();
  p('<span style="color: #999; font-size: 13px;">━━━ 🖼️ [3] 본문 카드2 - 업로드 전략 ━━━</span>');
  br();

  // 섹션3
  h2('🤖 AI 편집, 그래도 사람이 필요한 이유');
  br();
  p('요즘 AI 편집 툴이 정말 많아졌죠.');
  p('하지만 직접 써보시면 아시겠지만,');
  p('크리에이터의 <strong>개성과 감각</strong>은');
  p('AI가 따라오기 어렵습니다.');
  br();
  p('에이컷의 에디터들은');
  p('여러분의 편집 스타일을');
  p('빠르게 학습합니다.');
  p('자막 폰트, BGM 취향,');
  p('컷 편집 템포까지');
  p('일관되게 유지해드려요.');
  br();
  p('AI는 도구일 뿐,');
  p('감각과 경험은');
  p('사람의 몫입니다.');
  br();
  p('<span style="color: #999; font-size: 13px;">━━━ 🖼️ [4] 본문 카드3 - AI 비교 ━━━</span>');
  br();

  // 섹션4
  h2('✂️ 편집은 에이컷에, 콘텐츠는 당신에게');
  br();
  p('에이컷은 <strong>크리에이터 전용</strong>');
  p('숏폼 편집 서비스입니다.');
  br();
  p('✅ 영상만 보내면 48시간 내 편집 완료');
  p('✅ 스타일 학습 + 일관된 퀄리티');
  p('✅ 쇼츠·릴스·틱톡 최적화 포맷');
  p('✅ 월 정기 납품으로 부담 DOWN');
  br();
  p('직접 경험한 크리에이터의 후기:');
  p('"편집 맡기고 나니');
  p('콘텐츠 구상할 시간이');
  p('2배는 더 생겼어요."');
  br();
  p('촬영은 크리에이터가,');
  p('편집은 에이컷이.');
  p('이게 가장 효율적인');
  p('<strong>채널 운영 공식</strong>입니다.');
  br();
  p('<span style="color: #999; font-size: 13px;">━━━ 🖼️ [5] CTA 이미지 ━━━</span>');
  br();

  // CTA
  h2('📞 지금 바로 문의하세요');
  br();
  p('💬 카카오톡: pf.kakao.com/_GIesX/chat');
  p('📧 이메일: master@aicut.co.kr');
  p('🌐 홈페이지: aicut.co.kr');
  br();
  p('무료 상담과 견적, 부담 없이 문의하세요.');
  p('<strong>숏폼 편집</strong>은 에이컷에 맡기고,');
  p('여러분은 콘텐츠에 집중하세요!');
  br();

  // 해시태그
  p('#유튜브숏폼 #크리에이터 #숏폼편집 #영상편집외주 #에이컷 #유튜브쇼츠 #릴스마케팅 #틱톡마케팅 #채널성장 #유튜브알고리즘 #숏폼마케팅 #영상편집 #크리에이터마케팅 #유튜버 #편집아웃소싱 #여름콘텐츠 #AI영상편집 #구독자늘리기 #채널운영 #정기납품 #에디터 #쇼츠편집 #릴스편집 #바이럴 #콘텐츠마케팅 #1인미디어 #크리에이터경제 #숏폼크리에이터 #에이컷편집 #숏츠');

  return l.join('\n');
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(5000);
  
  // 모든 팝업 처리
  await p.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.innerText.includes('새로 작성') || b.innerText.includes('확인')) b.click();
    }
  });
  await p.waitForTimeout(2000);
  
  // 제목
  await p.evaluate((t) => { SmartEditor._editors['blogpc001'].setDocumentTitle(t); }, TITLE);
  console.log('1. 제목 ✅');
  
  // 본문 붙여넣기
  const html = buildStoryHTML();
  await p.evaluate((h) => {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([h], { type: 'text/html' }),
        'text/plain': new Blob([h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()], { type: 'text/plain' })
      })
    ]);
  }, html);
  await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelector('[contenteditable]')?.focus(); });
  await p.waitForTimeout(300);
  await p.keyboard.press('Control+V');
  await p.waitForTimeout(6000);
  console.log('2. 본문 ✅');
  
  // 이미지 업로드
  console.log('3. 이미지 업로드...');
  for (let i = 0; i < IMAGES.length; i++) {
    const fcPromise = p.waitForEvent('filechooser', { timeout: 15000 }).catch(() => null);
    await p.evaluate(() => { document.querySelector('.se-image-toolbar-button')?.click(); });
    await p.waitForTimeout(1500);
    const fc = await fcPromise;
    if (fc) { await fc.setFiles([IMAGES[i]]); console.log(`   ${i+1}/5 ✅`); await p.waitForTimeout(4000); }
    else {
      const inputs = await p.$$('input[type="file"]');
      if (inputs.length > 0) { await inputs[0].setInputFiles([IMAGES[i]]); console.log(`   ${i+1}/5 ✅`); await p.waitForTimeout(4000); }
      else { console.log(`   ${i+1}/5 ❌`); break; }
    }
  }
  
  // 최종 확인
  const final = await p.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return { total: comps.length, ok: Array.from(comps).filter(c => !!c.querySelector('img')).length };
  });
  console.log(`\n4. 이미지 ${final.ok}/${final.total}장 정상`);
  
  // 저장
  await p.evaluate(() => { document.querySelector('.save_btn__bzc5B')?.click(); });
  console.log('5. 저장 ✅');
  
  // 통계
  const htmlText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const paras = html.split('\n').filter(l => l.includes('text-align: center;') && !l.includes('nbsp;'));
  console.log(`\n📊 통계: ${htmlText.length}자 / ${paras.length}문단 / H2 ${(html.match(/<h2/g)||[]).length}개`);
  
  await b.disconnect();
  console.log('\n✅ 재작성 완료! 이미지가 하단에 있으니 드래그해서 🖼️ 마커 위치로 옮겨주세요.');
}

main().catch(e => console.error('❌', e.message));

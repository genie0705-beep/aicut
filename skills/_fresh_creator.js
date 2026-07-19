// 유튜버 블로그 — 텍스트+이미지 분리 방식
const { chromium } = require('playwright');
const path = require('path');
const { TITLE } = require('./_blog_creator_content.js');

const W = 'C:\\Users\\paul\\.openclaw\\workspace';
const IMAGES = [
  path.join(W, 'aicut_blog_youtuber_main.png'),
  path.join(W, 'aicut_blog_youtuber_card1.png'),
  path.join(W, 'aicut_blog_youtuber_card2.png'),
  path.join(W, 'aicut_blog_youtuber_card3.png'),
  path.join(W, 'aicut_blog_youtuber_cta.png'),
];

// 이미지 태그 없는 순수 텍스트 HTML
function buildTextHTML() {
  const rows = [];
  function p(text) { rows.push(`<p style="text-align: center;">${text}</p>`); }
  function h2(text) { rows.push(`<h2 style="text-align: center;"><strong>${text}</strong></h2>`); }
  function br() { rows.push('<p style="text-align: center;">&nbsp;</p>'); }
  function marker(id, label) { rows.push(`<p style="text-align: center; color: #999; font-size: 13px;">━━━ 🖼️ ${label} ━━━</p>`); }

  p('"쇼츠 하나 편집하는데 하루가 다 가요."');
  p('유튜브 크리에이터라면');
  p('누구나 한 번쯤 해본 말입니다.');
  br();
  p('영상 찍는 시간보다');
  p('편집하는 시간이 3배는 더 걸리죠.');
  p('이 시간에 차라리');
  p('다음 콘텐츠 구상을 하거나');
  p('휴식을 취하는 게');
  p('채널 성장에 더 도움이 됩니다.');
  br();
  marker(1, '대표 이미지 (aicut_blog_youtuber_main.png)');
  br();
  h2('⏰ 숏폼 하나에 하루 4시간?');
  br();
  p('30초짜리 쇼츠 하나 편집하는 데');
  p('보통 2~4시간이 걸립니다.');
  p('일주일에 3개만 올려도');
  p('<strong>12시간</strong>이 편집에 사라집니다.');
  br();
  marker(2, '본문 카드1 - 편집 시간 (aicut_blog_youtuber_card1.png)');
  br();
  h2('📱 업로드 빈도가 채널 성장의 핵심');
  br();
  p('2026년 숏폼 알고리즘은');
  p('<strong>업로드 빈도</strong>를');
  p('가장 중요하게 봅니다.');
  p('편집만 맡기면');
  p('주 5~7개 업로드도 가능합니다.');
  br();
  marker(3, '본문 카드2 - 업로드 전략 (aicut_blog_youtuber_card2.png)');
  br();
  h2('🤖 AI 편집 vs 전담 에디터');
  br();
  p('요즘 AI 편집 툴이 많아졌지만,');
  p('크리에이터의 <strong>개성과 감각</strong>은');
  p('AI가 따라올 수 없습니다.');
  br();
  marker(4, '본문 카드3 - AI 비교 (aicut_blog_youtuber_card3.png)');
  br();
  h2('✂️ 편집은 에이컷에, 콘텐츠는 당신에게');
  br();
  p('에이컷은 <strong>크리에이터 전용</strong>');
  p('숏폼 편집 서비스입니다.');
  p('✅ 영상만 보내면 48시간 내 편집 완료');
  p('✅ 월 정기 납품으로 부담 DOWN');
  br();
  marker(5, 'CTA 이미지 (aicut_blog_youtuber_cta.png)');
  br();
  h2('📞 지금 바로 문의하세요');
  br();
  p('💬 카카오톡: pf.kakao.com/_GIesX/chat');
  p('📧 이메일: master@aicut.co.kr');
  p('🌐 홈페이지: aicut.co.kr');
  br();
  p('에이컷이 여러분의');
  p('<strong>숏폼 편집</strong>을 책임집니다.');
  br();

  // 해시태그
  p('#유튜브숏폼 #크리에이터 #숏폼편집 #영상편집외주 #에이컷 #유튜브쇼츠');
  p('#릴스마케팅 #틱톡마케팅 #채널성장 #유튜브알고리즘 #숏폼마케팅');
  p('#영상편집 #크리에이터마케팅 #유튜버 #편집아웃소싱 #여름콘텐츠');
  p('#AI영상편집 #구독자늘리기 #채널운영 #정기납품 #에디터');
  p('#쇼츠편집 #릴스편집 #바이럴 #콘텐츠마케팅 #1인미디어');
  p('#크리에이터경제 #숏폼크리에이터 #에이컷편집 #숏츠 #쇼츠마케팅');

  return rows.join('\n');
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  // 새 postwrite
  await p.goto('https://blog.naver.com/aicut/postwrite', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(4000);
  
  // 팝업 → 새로 작성
  await p.evaluate(() => {
    const popup = document.querySelector('.se-popup-container.__se-pop-layer');
    if (popup) {
      const btn = Array.from(popup.querySelectorAll('button')).find(b => b.innerText.includes('새로 작성'));
      if (btn) btn.click();
    }
  });
  await p.waitForTimeout(2000);
  
  // 1. 제목
  await p.evaluate((t) => { SmartEditor._editors['blogpc001'].setDocumentTitle(t); }, TITLE);
  console.log('1. 제목 ✅');
  
  // 2. 순수 텍스트 붙여넣기
  const textHTML = buildTextHTML();
  await p.evaluate((h) => {
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([h], { type: 'text/html' }),
        'text/plain': new Blob([h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()], { type: 'text/plain' })
      })
    ]);
  }, textHTML);
  await p.waitForTimeout(500);
  await p.evaluate(() => { const ce = document.querySelector('[contenteditable]'); if(ce) ce.focus(); });
  await p.waitForTimeout(300);
  await p.keyboard.press('Control+V');
  await p.waitForTimeout(5000);
  console.log('2. 본문 붙여넣기 ✅');
  
  // 3. 이미지 업로드 (순차적으로 5장)
  console.log('3. 이미지 업로드...');
  for (let i = 0; i < IMAGES.length; i++) {
    console.log(`   ${i+1}/${IMAGES.length}...`);
    
    const fcPromise = p.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null);
    await p.click('.se-image-toolbar-button', { timeout: 5000 });
    await p.waitForTimeout(1000);
    
    const fc = await fcPromise;
    if (fc) {
      await fc.setFiles([IMAGES[i]]);
      console.log('      ✅');
      await p.waitForTimeout(4000);
    } else {
      // fallback: file input 직접
      const inputs = await p.$$('input[type="file"]');
      if (inputs.length > 0) {
        await inputs[0].setInputFiles([IMAGES[i]]);
        console.log('      ✅ (input)');
        await p.waitForTimeout(4000);
      } else {
        console.log('      ❌');
        break;
      }
    }
  }
  
  // 최종 확인
  const final = await p.evaluate(() => {
    const comps = document.querySelectorAll('.se-component.se-image');
    return {
      total: comps.length,
      ok: Array.from(comps).filter(c => !!c.querySelector('img')).length,
    };
  });
  console.log(`\n4. 이미지 ${final.ok}/${final.total}장 정상 업로드`);
  
  // 저장
  await p.evaluate(() => {
    const btn = document.querySelector('.save_btn__bzc5B');
    if (btn) btn.click();
  });
  console.log('5. 저장 ✅');
  
  await p.waitForTimeout(2000);
  await b.disconnect();
  console.log('\n✅ 재작성 완료!');
  console.log('※ 이미지가 본문 하단에 있습니다.');
  console.log('※ 브라우저에서 각 이미지를 마커 위치로 드래그해서 옮겨주세요.');
}

main().catch(e => console.error('❌', e.message));

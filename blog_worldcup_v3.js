const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// image_gen.js의 makeImage 재사용
const { makeImage } = require('./skills/image_gen.js');

const TOPIC = '월드컵';
const IMG_DIR = __dirname;

// 월드컵 테마 이미지 설정
const images = [
  { out: 'aicut_worldcup_main.png', theme: 'dark_purple', badge: '⚽ 월드컵 마케팅', main: '2026 월드컵\n뜨거운 응원의 열기\n<em>숏폼 마케팅</em>으로\n잡는 방법', sub: '경기장의 열기를 SNS로 연결하세요', w: 700, h: 700 },
  { out: 'aicut_worldcup_01.png', theme: 'light_cyan', badge: '📱 릴스·쇼츠·틱톡', main: '월드컵 숏폼\n<em>플랫폼별 전략</em>\n한눈에 비교', sub: '릴스 15초·쇼츠 30초·틱톡 15초', w: 800, h: 450 },
  { out: 'aicut_worldcup_02.png', theme: 'dark_green', badge: '🎬 경기 하이라이트', main: '경기 종료 30분 후\n<em>하이라이트 영상</em>\n바로 발행', sub: '실시간 반응 콘텐츠가 조회수를 결정합니다', w: 800, h: 450 },
  { out: 'aicut_worldcup_03.png', theme: 'light_pink', badge: '📊 데이터 인사이트', main: '월드컵 시즌\n숏폼 콘텐츠 소비량\n<em>평균 3.7배</em> 증가', sub: '2026 상반기 에이컷 자체 분석 기준', w: 800, h: 450 },
  { out: 'aicut_worldcup_cta.png', theme: 'dark_purple', badge: '🚀 에이컷', main: '월드컵 시즌\n<em>영상편집 아웃소싱</em>\n지금 시작하세요', sub: '카톡: pf.kakao.com/_GIesX/chat', w: 800, h: 450 }
];

(async () => {
  // Step 1: 이미지 생성
  console.log('=== 이미지 생성 ===');
  process.env.CDP_PORT = '9224';
  
  for (const img of images) {
    try {
      const result = await makeImage({
        theme: img.theme,
        badge: img.badge,
        main: img.main,
        sub: img.sub,
        out: img.out,
        width: img.w,
        height: img.h,
        cta: 'AICUT 무료상담 →'
      });
      console.log(`✅ ${img.out} (${result.sizeKB}KB)`);
    } catch (e) {
      console.log(`❌ ${img.out}: ${e.message}`);
    }
  }
  
  // Step 2: SE4 에디터 작업
  console.log('\n=== 블로그 작성 ===');
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = browser.contexts()[0];
  
  // Redirect=Update 탭 찾거나 새로 열기
  let page = ctx.pages().find(p => p.url().includes('Redirect=Update'));
  if (!page) {
    page = await ctx.newPage();
    await page.goto('https://blog.naver.com/aicut?Redirect=Update&logNo=224326578253', { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(5000);
  } else {
    await page.bringToFront();
    await page.waitForTimeout(3000);
  }
  
  const pf = page.frames().find(f => f.url().includes('PostUpdateForm'));
  if (!pf) { console.log('PostUpdateForm 없음'); await ctx.close(); return; }
  
  // 에디터 초기화
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    se._documentService.resetDocumentData();
    se.setDocumentTitle('2026 월드컵, 숏폼 마케팅으로 응원 열기 올리는 법');
  });
  await page.waitForTimeout(2000);
  
  // 텍스트 블록 (224324428697 방식: image→text 번갈아)
  const textBlocks = [
    '2026 월드컵이 한창입니다. 경기장의 열기가 그대로 SNS로 이어지면서, 숏폼 콘텐츠의 소비량이 폭발적으로 증가하고 있습니다. 특히 응원 릴스, 경기 하이라이트, 선수 인터뷰 영상이 가장 빠르게 확산되는 콘텐츠로 자리잡았습니다.',
    
    '릴스는 15~30초의 짧은 호흡으로 완전 시청률이 핵심입니다. 유튜브 쇼츠는 30~60초로 좋아요율이 중요하고, 틱톡은 15~60초로 재시청과 공유율이 관건입니다. 월드컵 콘텐츠는 각 플랫폼의 특성에 맞게 최적화해야 합니다.',
    
    '경기 종료 후 30분이 가장 중요한 골든타임입니다. 승리 세리머니, 결정적 장면, 선수 인터뷰 등을 빠르게 편집해서 발행해야 조회수가 극대화됩니다. 실시간 반응 콘텐츠가 월드컵 숏폼의 핵심입니다.',
    
    '2026년 상반기 에이컷 자체 분석 결과, 월드컵 시즌 동안 숏폼 콘텐츠의 사용자 참여율은 일반 피드 콘텐츠 대비 평균 3.7배 높은 것으로 나타났습니다. 특히 주 3~4회 꾸준히 발행한 계정의 팔로워 증가율은 더욱 두드러졌습니다.',
    
    '바쁜 월드컵 시즌, 매일 콘텐츠를 기획하고 촬영하고 편집하는 것은 내부 마케터만으로는 한계가 있습니다. 에이컷의 영상편집 아웃소싱 서비스로 월드컵 숏폼 마케팅을 준비하세요. 카카오톡 문의: pf.kakao.com/_GIesX/chat | 이메일: master@aicut.co.kr | 홈페이지: aicut.co.kr'
  ];
  
  // RULES.md 4-0-1 절차: 텍스트→이미지 등록→커서 위치 확인→다음 텍스트
  // 이미지는 정이사님이 직접 등록, 여기서는 빈 이미지 컴포넌트 추가
  await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    if (!wrap) return;
    
    // 빈 이미지 컴포넌트 HTML 템플릿
    const imgCompHtml = `<div class="se-component se-image se-l-default" data-a11y-title="이미지">
      <div class="se-component-content">
        <div class="se-section se-section-image se-l-default se-section-align-center" style="max-width:700px;">
          <div class="se-module se-module-image">
            <p style="text-align:center;padding:40px 20px;background:#f5f5f5;border:2px dashed #ccc;border-radius:8px;color:#999;font-size:16px;">
              📷 사진 버튼으로 이미지를 등록해주세요
            </p>
          </div>
        </div>
      </div>
    </div>`;
    
    const textCompHtml = (txt) => `<div class="se-component se-text se-l-default" data-a11y-title="본문">
      <div class="se-component-content">
        <div class="se-section se-section-text se-l-default">
          <div class="se-module se-module-text __se-unit">
            <p class="se-text-paragraph se-text-paragraph-align-center">
              <span class="se-ff-nanumgothic se-fs32 __se-node">${txt}</span>
            </p>
          </div>
        </div>
      </div>
    </div>`;
    
    wrap.innerHTML = '';
    wrap.insertAdjacentHTML('beforeend', imgCompHtml);
    wrap.insertAdjacentHTML('beforeend', textCompHtml('[이미지: 월드컵 숏폼 마케팅 대표 이미지]'));
    wrap.insertAdjacentHTML('beforeend', imgCompHtml);
    wrap.insertAdjacentHTML('beforeend', textCompHtml('[이미지: 플랫폼별 비교 인포그래픽]'));
    wrap.insertAdjacentHTML('beforeend', imgCompHtml);
    wrap.insertAdjacentHTML('beforeend', textCompHtml('[이미지: 경기 하이라이트 편집 예시]'));
    wrap.insertAdjacentHTML('beforeend', imgCompHtml);
    wrap.insertAdjacentHTML('beforeend', textCompHtml('[이미지: 데이터 인사이트 차트]'));
    wrap.insertAdjacentHTML('beforeend', imgCompHtml);
    wrap.insertAdjacentHTML('beforeend', textCompHtml('[이미지: CTA - 무료상담 안내]'));
    
    // 변경 알림
    wrap.dispatchEvent(new Event('DOMSubtreeModified', { bubbles: true }));
  });
  
  await page.waitForTimeout(2000);
  
  // writeTextWithSoftLineBreak로 실제 텍스트 입력
  await pf.evaluate((texts) => {
    const se = SmartEditor._editors['blogpc001'];
    se._canvasScrollingService.focusToFirstComp();
    const es = se._editingService;
    
    // 모든 텍스트를 \n\n으로 연결
    const fullText = texts.join('\n\n');
    
    if (typeof es.writeTextWithSoftLineBreak === 'function') {
      es.writeTextWithSoftLineBreak(fullText);
    } else {
      es.write(fullText);
    }
  }, textBlocks);
  
  await page.waitForTimeout(3000);
  
  // 결과 확인
  const check = await pf.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const wrap = document.querySelector('.se-components-wrap');
    const comps = wrap?.querySelectorAll('.se-component');
    const textComps = wrap?.querySelectorAll('.se-component.se-text');
    const imgComps = wrap?.querySelectorAll('.se-component.se-image');
    return {
      title: se.getDocumentTitle(),
      textLen: se.getContentText().length,
      totalComps: comps?.length || 0,
      textComps: textComps?.length || 0,
      imgComps: imgComps?.length || 0
    };
  }).catch(() => ({}));
  
  console.log('결과:', JSON.stringify(check, null, 2));
  
  // 저장 버튼 찾기
  const saveBtn = await page.evaluate(() => {
    const all = document.querySelectorAll('em, button, a, span');
    for (const el of all) {
      const t = (el.textContent || '').trim();
      if ((t === '저장' || t === '등록') && el.offsetParent !== null) {
        el.click();
        return t;
      }
    }
    return null;
  }).catch(() => null);
  console.log('저장:', saveBtn);
  
  await ctx.close();
  console.log('\n=== 완료 ===');
})().catch(e => console.error('FATAL:', e.message));

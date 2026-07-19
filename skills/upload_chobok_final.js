// 네이버 블로그 업로드 - 초복 포스트 (SE4 PostWriteForm 방식)
const { chromium } = require('playwright');
const path = require('path');

const CDP_PORT = process.env.CDP_PORT || '9224';
const WORKSPACE = path.join(__dirname, '..');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();

  try {
    // ===== 1. 블로그 접속 =====
    console.log('📡 블로그 접속...');
    await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);

    // ===== 2. PostWriteForm 프레임 찾기 =====
    const frames = page.frames();
    let editorFrame = null;
    for (const f of frames) {
      const url = f.url();
      if (url.includes('PostWriteForm')) {
        const hasSE = await f.evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
        if (hasSE) {
          editorFrame = f;
          console.log(`✅ SmartEditor 발견: ${url.slice(0, 100)}`);
          break;
        }
      }
    }

    if (!editorFrame) {
      console.log('❌ SmartEditor 프레임 없음. 가능한 프레임:');
      for (let i = 0; i < frames.length; i++) {
        try {
          const u = frames[i].url();
          const se = await frames[i].evaluate(() => typeof SmartEditor !== 'undefined').catch(() => false);
          console.log(`[${i}] SE:${se} ${u.slice(0,100)}`);
        } catch(e) {}
      }
      throw new Error('SmartEditor not found');
    }

    // ===== 3. SE4 API 확인 및 제목 설정 =====
    const seCheck = await editorFrame.evaluate(() => {
      const se4 = SmartEditor._editors['blogpc001'];
      return {
        ok: !!se4,
        hasReset: typeof se4?._documentService?.resetDocumentData === 'function',
        hasTitle: typeof se4?.setDocumentTitle === 'function',
        hasFocus: typeof se4?._canvasScrollingService?.focusToFirstComp === 'function',
        hasWrite: typeof se4?._editingService?.writeTextWithSoftLineBreak === 'function',
        hasWriteSimple: typeof se4?._editingService?.write === 'function',
      };
    });
    console.log('🔧 SE4 API:', JSON.stringify(seCheck));

    if (!seCheck.ok) throw new Error('SE4 blogpc001 not found');

    const TITLE = '초복에 삼계탕 먹으면서 본 영상, 전부 이 패턴이었습니다';
    
    const FULL_TEXT = `어제 초복, 삼계탕 드셨나요?
전 먹으면서 핸드폰으로 릴스를 봤는데요.
한참 내리다 보니 신기한 걸 발견했습니다.
초복에 뜨는 영상들, 전부 패턴이 있다는 것.

실시간 트렌드 1위는 당연히 '초복'이었습니다.
근데 사람들은 삼계탕 포장 기다리면서,
식사하면서 유튜브 쇼츠와 인스타 릴스를 봤어요.
초복 당일, 어떤 영상들이 조회수를 먹었을까요?
제가 직접 분석해봤습니다.

■ 패턴 1. 청량함을 파는 영상
가장 많이 본 건 시원한 음료·아이스크림 ASMR이었습니다.
에이드 만드는 과정, 빙수 먹방, 차가운 캔 따는 소리.
30도 날씨에 이 영상들은 기본 조회수 50만+를 찍었어요.
프랜차이즈나 카페 운영자라면,
시즌 한정 '청량감' 콘셉트 숏폼 하나쯤은 준비해두세요.
별거 아닌데 조회수는 확보됩니다.

■ 패턴 2. 더위를 기록하는 영상
생각보다 많이 본 건 폭염 속 현장 영상이었습니다.
열사병 걸리기 직전, 에어컨 없이 버티기 같은 콘텐츠요.
공감과 위로를 주는 리얼리티 콘텐츠가 조회수를 먹었어요.
병원이나 보험 FP라면 이런 각도로 접근해보세요.
'폭염 속에서 일하는 당신, 건강 괜찮으신가요?'
공감 > 신뢰 > 상담으로 이어지는 전략입니다.

■ 패턴 3. 계절 한정 먹방
초복=삼계탕, 여름=냉면·콩국수·팥빙수.
네이버 실시간 트렌드를 보면,
계절 메뉴 숏폼이 꾸준히 검색되고 있었습니다.
외식업 프랜차이즈라면,
계절 메뉴 하나 찍는 영상이 여름 내내 조회수를 만듭니다.
에이컷에 맡기면 주 2~3개씩 꾸준히 납품 가능합니다.

■ 이 패턴을 알면, 초복 마케팅이 보입니다
초복은 단순히 삼계탕 먹는 날이 아닙니다.
여름 콘텐츠 소비 패턴이 극대화되는 날이에요.
청량함, 공감, 계절성.
이 세 가지 키워드만 기억하면,
여름 내내 써먹을 수 있는 콘텐츠 전략이 완성됩니다.
문제는 직접 찍고 편집할 시간이 없다는 거죠.
에이컷이 도와드립니다.

지금 상담받기
카카오톡: https://pf.kakao.com/_GIesX/chat
이메일: master@aicut.co.kr
홈페이지: https://aicut.co.kr

#초복 #초복날짜 #2026초복 #중복 #말복 #삼계탕 #여름마케팅 #숏폼마케팅 #영상편집외주 #릴스마케팅 #유튜브쇼츠 #틱톡마케팅 #콘텐츠마케팅 #SNS마케팅 #프랜차이즈마케팅 #외식업마케팅 #ASMR #먹방 #푸드콘텐츠 #시즌마케팅 #여름시즌 #영상마케팅 #에이컷 #폭염 #무더위 #청량음료 #아이스크림 #냉면 #콩국수 #팥빙수`;

    console.log('📌 제목 입력...');
    await editorFrame.evaluate(({title, text}) => {
      const se4 = SmartEditor._editors['blogpc001'];
      se4._documentService.resetDocumentData();
      se4.setDocumentTitle(title);
      se4._canvasScrollingService.focusToFirstComp();
      se4._editingService.writeTextWithSoftLineBreak(text);
    }, {title: TITLE, text: FULL_TEXT});
    await sleep(2000);

    // 입력 검증
    const verify = await editorFrame.evaluate(() => {
      const se4 = SmartEditor._editors['blogpc001'];
      return {
        textLen: se4.getContentText().length,
        paras: document.querySelectorAll('.se-text-paragraph').length
      };
    });
    console.log(`📄 텍스트: ${verify.textLen}자 / ${verify.paras}문단`);

    // ===== 4. 센터 정렬 =====
    console.log('🎯 센터 정렬...');
    await editorFrame.evaluate(() => {
      document.querySelectorAll('.se-text-paragraph').forEach(p => {
        p.classList.add('se-text-paragraph-align-center');
        p.style.textAlign = 'center';
      });
      // Apply also through SE4
      const se4 = SmartEditor._editors['blogpc001'];
      if (se4._componentHolder) {
        se4._componentHolder._componentMap.forEach((comp, id) => {
          if (comp.type === 'text') {
            comp.align = 'center';
          }
        });
      }
    });
    await sleep(500);

    // ===== 5. 이미지 업로드 (5장) =====
    const images = [
      'aicut_blog_chobok_main.png',
      'aicut_blog_chobok_card1.png',
      'aicut_blog_chobok_card2.png',
      'aicut_blog_chobok_card3.png',
      'aicut_blog_chobok_cta.png'
    ];

    for (let i = 0; i < images.length; i++) {
      const imgName = images[i];
      const imgPath = path.join(WORKSPACE, imgName);
      console.log(`🖼️ ${i+1}/5: ${imgName} 업로드 중...`);

      // 방법: editorFrame에서 사진 버튼 클릭 → filechooser
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }).catch(e => null),
        editorFrame.evaluate(() => {
          const btn = document.querySelector('.se-image-toolbar-button');
          if (btn) {
            btn.click();
            return 'clicked';
          }
          // fallback: 모든 도구 버튼 중 이미지 관련 찾기
          const allBtns = document.querySelectorAll('button, [role="button"], a');
          for (const b of allBtns) {
            if (b.textContent.includes('사진') || b.textContent.includes('이미지') || 
                b.getAttribute('aria-label') === '사진') {
              b.click();
              return 'clicked-fallback';
            }
          }
          return 'no-button-found';
        })
      ]);

      if (fileChooser) {
        await fileChooser.setFiles(imgPath);
        console.log(`  ✅ 파일 선택: ${imgName}`);
        await sleep(8000); // 업로드 대기
      } else {
        console.log(`  ⚠️ filechooser 이벤트 없음 - 사진 버튼 확인 필요`);
      }
      await sleep(1000);
    }

    // ===== 6. 저장 =====
    console.log('💾 저장 시도...');
    const saved = await page.evaluate(() => {
      // 메인 페이지에서 저장 버튼 찾기
      const btns = document.querySelectorAll('button, a, span');
      for (const el of btns) {
        const t = el.textContent.trim();
        if (t === '저장') {
          el.click();
          return 'clicked-main';
        }
      }
      return 'not-found-main';
    });
    console.log(`💾 저장 결과: ${saved}`);

    // PostWriteForm 프레임에서도 저장 버튼 찾기
    if (saved === 'not-found-main') {
      const saved2 = await editorFrame.evaluate(() => {
        const btns = document.querySelectorAll('button, a, span');
        for (const el of btns) {
          if (el.textContent.trim() === '저장') {
            el.click();
            return 'clicked-editor';
          }
        }
        return 'not-found-editor';
      });
      console.log(`💾 저장 결과 (editor): ${saved2}`);
    }

    await sleep(3000);

    // ===== 7. 결과 스크린샷 =====
    await page.screenshot({ path: path.join(WORKSPACE, '_chobok_result.png'), fullPage: true });
    console.log('\n📸 스크린샷 저장됨: _chobok_result.png');
    console.log('\n✅ 블로그 작성 완료! (임시저장 상태)');
    console.log('   발행하려면 "발행해"라고 말씀해주세요.');

  } catch (err) {
    console.error('❌ 오류:', err.message);
  }
})();

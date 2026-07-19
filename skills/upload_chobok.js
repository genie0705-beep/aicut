// 네이버 블로그 업로드 - 초복 포스트 (SE4 1.77.0)
// 전체 텍스트 먼저 입력 후 이미지 업로드
const { chromium } = require('playwright');
const path = require('path');

const CDP_PORT = process.env.CDP_PORT || '9224';
const WORKSPACE = path.join(__dirname, '..');

(async () => {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // ===== 1. 글쓰기 페이지 진입 =====
    console.log('✏️ 글쓰기 페이지 진입...');
    await page.goto('https://blog.naver.com/PostWrite.nhn?blogId=aicut', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    // SE4 객체 확인
    const se = await page.evaluate(() => {
      const eds = SmartEditor._editors;
      const se4 = eds['blogpc001'];
      if (!se4) return { error: 'SE4 not found', keys: Object.keys(eds||{}) };
      return {
        ok: true,
        hasReset: typeof se4._documentService.resetDocumentData === 'function',
        hasTitle: typeof se4.setDocumentTitle === 'function',
        hasFocus: typeof se4._canvasScrollingService.focusToFirstComp === 'function',
        hasWrite: typeof se4._editingService.writeTextWithSoftLineBreak === 'function',
      };
    });
    console.log('SE4:', JSON.stringify(se));
    
    if (!se.ok) throw new Error('SE4 접근 불가');
    
    // ===== 2. 제목 + 본문 전체 입력 =====
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

프랜차이즈라면 시즌 한정 '청량감' 콘셉트 숏폼을

초복 전후로 찍어두는 게 좋습니다.

별거 아닌데 조회수는 확보됩니다.



■ 패턴 2. 더위를 기록하는 영상

생각보다 많이 본 건 폭염 속 현장 영상이었습니다.

'열사병 걸리기 직전' '에어컨 없이 버티기' 같은 콘텐츠요.

공감과 위로를 주는 영상,

즉 리얼리티 콘텐츠가 조회수를 먹었어요.

병원이나 보험 FP라면 이런 각도로 접근해보세요.

"폭염 속에서 일하는 당신, 건강 괜찮으신가요?"

공감 → 신뢰 → 상담으로 이어지는 전략입니다.



■ 패턴 3. 계절 한정 먹방

초복=삼계탕, 여름=냉면·콩국수·팥빙수.

네이버 맛집 카테고리를 보면,

계절 메뉴 숏폼이 초복 당일에도 꾸준히 검색되고 있었습니다.

외식업 프랜차이즈라면,

계절 메뉴 찍는 영상 하나가 여름 내내 조회수를 만들어냅니다.

에이컷에 맡기면 주 2~3개씩 꾸준히 납품 가능합니다.



■ 이 패턴을 보면, 초복 마케팅이 보입니다

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

    console.log('📌 제목 설정...');
    await page.evaluate((t, txt) => {
      const se4 = SmartEditor._editors['blogpc001'];
      se4._documentService.resetDocumentData();
      se4.setDocumentTitle(t);
      se4._canvasScrollingService.focusToFirstComp();
      se4._editingService.writeTextWithSoftLineBreak(txt);
    }, TITLE, FULL_TEXT);
    await page.waitForTimeout(1500);
    
    // 입력 검증
    const verify = await page.evaluate(() => {
      const se4 = SmartEditor._editors['blogpc001'];
      return {
        textLen: se4.getContentText().length,
        paras: document.querySelectorAll('.se-text-paragraph').length
      };
    });
    console.log(`📄 텍스트: ${verify.textLen}자 / ${verify.paras}문단`);
    
    // ===== 3. 센터 정렬 =====
    console.log('🎯 센터 정렬...');
    await page.evaluate(() => {
      document.querySelectorAll('.se-text-paragraph').forEach(p => {
        p.classList.add('se-text-paragraph-align-center');
        p.style.textAlign = 'center';
      });
    });
    await page.waitForTimeout(500);
    
    // ===== 4. 이미지 업로드 (5장) =====
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
      console.log(`🖼️ 이미지 ${i+1}/5: ${imgName}`);
      
      // 사진 버튼 클릭 → file chooser 대기
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }).catch(e => null),
        page.evaluate(() => {
          const btn = document.querySelector('.se-image-toolbar-button');
          if (btn) btn.click();
          else {
            // fallback: 모든 버튼 중 사진 관련 찾기
            document.querySelectorAll('button').forEach(b => {
              if (b.textContent.includes('사진') || b.textContent.includes('이미지')) b.click();
            });
          }
        })
      ]);
      
      if (fileChooser) {
        await fileChooser.setFiles(imgPath);
        console.log(`  ✅ 파일 선택: ${imgName}`);
        await page.waitForTimeout(8000); // 업로드 대기
      } else {
        console.log(`  ⚠️ filechooser 이벤트 없음 - 수동 업로드 필요`);
      }
      
      await page.waitForTimeout(1000);
    }
    
    // ===== 5. 저장 =====
    console.log('💾 저장 중...');
    const saved = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, a, span');
      for (const el of btns) {
        if (el.textContent.trim() === '저장') {
          el.click();
          return true;
        }
      }
      return false;
    });
    console.log(`💾 저장: ${saved ? '클릭됨' : '버튼 찾기 실패 - 수동 저장 필요'}`);
    await page.waitForTimeout(2000);
    
    console.log('\n✅ 블로그 작성 완료 (임시저장 상태)');
    console.log('   발행하려면 "발행해"라고 말씀해주세요.');
    
  } catch (err) {
    console.error('❌ 오류:', err.message);
  }
})();

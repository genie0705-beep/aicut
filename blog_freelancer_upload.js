const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

// Blog Body HTML (center aligned, mobile optimized)
const BODY_HTML = `<p style="text-align: center;">💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"</p>
<p style="text-align: center;">💭 "수정 요청 30회, 편집자가 연락 두절"</p>
<p style="text-align: center;">💭 "이번 달 편집자, 또 바꿔야 하나?"</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">영상 편집 아웃소싱을 해본 브랜드라면<br>누구나 한 번쯤 겪는 상황입니다.</p>
<p style="text-align: center;">&nbsp;</p>
[이미지1: 문제상황]
<h2 style="text-align: center;">😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?</h2>
<p style="text-align: center;"><strong>영상 편집 프리랜서</strong>를 고용해본 분들은<br>다음 같은 경험을 해보셨을 겁니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h3 style="text-align: center;">① 클린트 무한 반복</h3>
<p style="text-align: center;">"자막이 좀 더 세련되게"<br>"배경 음악이 안 맞는 것 같아요"<br>"컬러 톤을 좀 더 따뜻하게"</p>
<p style="text-align: center;">매번 다른 의견, 매번 다른 결과.<br><strong>클린트</strong> 5번 돌려도 원하는 느낌이 안 나오는 건<br>편집자의 문제가 아니라 <strong>시스템의 문제</strong>입니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h3 style="text-align: center;">② 매달 새로운 편집자 찾기</h3>
<p style="text-align: center;">이번 달 A라는 편집자가 괜찮아서<br>다음 달에도 맡기려고 했는데,<br>이미 다른 프로젝트에 잡혀 있습니다.</p>
<p style="text-align: center;">또 구인 공고를 내고,<br>또 포트폴리오를 보고,<br>또 교육하고.</p>
<p style="text-align: center;">이 과정이 매달 반복됩니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h3 style="text-align: center;">③ 소통 비용 &gt; 편집 비용</h3>
<p style="text-align: center;">"A 편집자님, 저번에 말씀드린 대로..."<br>"아, 그건 전달이 안 됐네요? 다시 확인해볼게요."</p>
<p style="text-align: center;"><strong>편집자와의 소통</strong>에 들어가는 시간이<br>실제 편집 비용보다 더 큽니다.</p>
<p style="text-align: center;">&nbsp;</p>
[이미지2: 에이컷 솔루션]
<h2 style="text-align: center;">💡 에이컷이 해결한 방법 (전담 에디터 시스템)</h2>
<p style="text-align: center;">에이컷은 프리랜서 편집러의 문제를<br><strong>시스템으로 해결</strong>했습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h3 style="text-align: center;">👤 전담 에디터 고정 배정</h3>
<p style="text-align: center;">한 번 배정된 에디터는<br>변경 요청이 없는 한 계속 같은 분이 작업합니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h3 style="text-align: center;">📋 브랜드 가이드 저장</h3>
<p style="text-align: center;">색상 코드, 로고 위치, 자막 폰트, BGM 방향성까지<br>한 번 등록하면 다음 작업부터는 별도 설명이 필요 없습니다.</p>
<p style="text-align: center;">&nbsp;</p>
<h3 style="text-align: center;">⚡ 48시간 기본 납기</h3>
<p style="text-align: center;">브랜드에 맞는 편집 스타일이 이미 저장되어 있어<br>리드타임이 획기적으로 줄어듭니다.</p>
<p style="text-align: center;">&nbsp;</p>
[이미지3: 결과비교]
<h2 style="text-align: center;">📊 바뀐 결과</h2>
<p style="text-align: center;">에이컷 도입 후 고객사들의 변화입니다.</p>
<div style="text-align: center;">
<table style="margin: 0 auto; border-collapse: collapse; width: 100%; max-width: 500px;">
<tbody>
<tr><th style="background: #a78bfa; color: #fff; padding: 10px;">항목</th><th style="background: #a78bfa; color: #fff; padding: 10px;">도입 전</th><th style="background: #a78bfa; color: #fff; padding: 10px;">도입 후</th></tr>
<tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>편집자 교체 주기</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #cc4444;">매월</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #22aa66; font-weight: 700;">✅ 고정 배정</td></tr>
<tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>클린트 평균 횟수</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #cc4444;">5~7회</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #22aa66; font-weight: 700;">✅ 1~2회</td></tr>
<tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>커뮤니케이션 시간</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #cc4444;">주 8시간</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #22aa66; font-weight: 700;">✅ 주 1시간 이내</td></tr>
<tr><td style="padding: 10px;"><strong>납기 준수율</strong></td><td style="padding: 10px; text-align: center; color: #cc4444;">60%</td><td style="padding: 10px; text-align: center; color: #22aa66; font-weight: 700;">✅ 98%</td></tr>
</tbody>
</table>
</div>
<p style="text-align: center;">&nbsp;</p>
[이미지4: CTA]
<h2 style="text-align: center;">🎯 이런 분들께 특히 추천합니다</h2>
<p style="text-align: center;">✅ <strong>매달 다른 편집자</strong>에게 브랜드를 설명해야 하는 분<br>✅ <strong>클린트 피드백</strong>에 지친 마케터<br>✅ <strong>납기 지연</strong>으로 광고 일정이 밀리는 분<br>✅ <strong>브랜드 톤 일관성</strong>이 중요한 기업</p>
<p style="text-align: center;">&nbsp;</p>
<h2 style="text-align: center;">👀 지금 확인해보세요</h2>
<p style="text-align: center;">프리랜서 편집러와의 끝없는 소통,<br>이제는 시스템에 맡기세요.</p>
<p style="text-align: center;"><strong>에이컷 무료 상담</strong>에서<br>업종과 월 제작량에 맞는 플랜을<br>전담 매니저가 직접 안내해드립니다.</p>
<p style="text-align: center;">&nbsp;</p>
<p style="text-align: center;">👉 <strong>카카오톡 채널:</strong> 에이컷<br>👉 <strong>이메일:</strong> contact@aicut.co.kr<br>👉 <strong>홈페이지:</strong> aicut.co.kr</p>`;

const HASHTAGS = "#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작";

const IMAGE_FILES = [
  { name: 'aicut_blog_freelancer_01.png', marker: '[이미지1: 문제상황]' },
  { name: 'aicut_blog_freelancer_02.png', marker: '[이미지2: 에이컷 솔루션]' },
  { name: 'aicut_blog_freelancer_03.png', marker: '[이미지3: 결과비교]' },
  { name: 'aicut_blog_freelancer_cta.png', marker: '[이미지4: CTA]' },
];

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  // 1. Navigate to blog write page
  console.log('=== 블로그 에디터 열기 ===');
  await page.goto('https://blog.naver.com/PostWrite.naver?blogId=aicut&categoryNo=65&returnUrl=%2Fblog%2Faicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  const writeUrl = page.url();
  console.log('Write URL:', writeUrl);
  
  if (writeUrl.includes('nidlogin') || writeUrl.includes('nid.naver')) {
    console.log('❌ 로그인 필요!');
    await page.screenshot({ path: 'blog_login_needed.png' });
    await browser.close();
    process.exit(1);
  }
  
  // 2. Set title
  console.log('=== 제목 입력 ===');
  await page.waitForTimeout(2000);
  try {
    await page.evaluate(() => {
      SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
    });
    console.log('✅ 제목 입력 완료');
  } catch (e) {
    console.log('제목 입력 실패, 직접 입력 시도');
    // Try direct keyboard input
    const titleInput = await page.$('#titleArea');
    if (titleInput) {
      await titleInput.click();
      await page.keyboard.type('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유', { delay: 30 });
      console.log('✅ 직접 입력 완료');
    }
  }
  await page.waitForTimeout(1000);
  
  // 3. Copy body HTML to clipboard and paste
  console.log('=== 본문 붙여넣기 ===');
  // Set clipboard content
  await page.evaluate((html) => {
    // Replace markers with image placeholders
    const cleanHtml = html
      .replace('[이미지1: 문제상황]', '<p style="text-align: center;"><br></p>')
      .replace('[이미지2: 에이컷 솔루션]', '<p style="text-align: center;"><br></p>')
      .replace('[이미지3: 결과비교]', '<p style="text-align: center;"><br></p>')
      .replace('[이미지4: CTA]', '<p style="text-align: center;"><br></p>');
    navigator.clipboard.writeText(cleanHtml);
  }, BODY_HTML);
  
  // Click on editor body
  try {
    const mainFrame = page.frame({ name: 'mainFrame' });
    if (mainFrame) {
      // Click on editor area
      await mainFrame.click('.se-content', { position: { x: 300, y: 50 } });
      await page.waitForTimeout(500);
      // Ctrl+V
      await page.keyboard.press('Control+V');
      console.log('✅ 본문 붙여넣기 완료');
    } else {
      // Try clicking on the content area directly
      await page.mouse.click(590, 270);
      await page.waitForTimeout(500);
      await page.keyboard.press('Control+V');
      console.log('✅ 본문 붙여넣기 (직접 클릭)');
    }
  } catch (e) {
    console.log('붙여넣기 실패:', e.message);
  }
  await page.waitForTimeout(3000);
  
  // 4. Upload images via filechooser
  console.log('=== 이미지 등록 ===');
  for (let i = 0; i < IMAGE_FILES.length; i++) {
    const img = IMAGE_FILES[i];
    const imgPath = path.join(WORKSPACE, img.name);
    console.log(`이미지 ${i+1}: ${img.name}`);
    
    try {
      // Set up file chooser handler
      const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
      
      // Click image upload button in the editor toolbar
      // The image button is in the toolbar
      const mainFrame = page.frame({ name: 'mainFrame' });
      if (mainFrame) {
        const imgBtn = await mainFrame.$('button.se-image-toolbar-button, button[title="사진"], .se-image-toolbar-button');
        if (imgBtn) {
          await imgBtn.click();
        } else {
          // Try toolbar buttons
          const buttons = await mainFrame.$$('.se-toolbar button');
          for (const btn of buttons) {
            const title = await btn.getAttribute('title');
            if (title && (title.includes('사진') || title.includes('이미지'))) {
              await btn.click();
              break;
            }
          }
        }
      }
      
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(imgPath);
      await page.waitForTimeout(3000);
      console.log(`  ✅ ${img.name} 등록 완료`);
    } catch (e) {
      console.log(`  ❌ 등록 실패: ${e.message}`);
      
      // Try alternative: drag-and-drop or 직접 파일 버튼
      // The "사진" button at the top-left of the editor page
      console.log('  → 사진 버튼(좌측 상단) 클릭 시도');
      
      // Try to click the photo button on the main page (not inside iframe)
      const photoBtn = await page.$('button.se-image-button, [class*="image"], [class*="photo"]');
      if (photoBtn) {
        await photoBtn.click();
        await page.waitForTimeout(2000);
        
        // Try filechooser again
        try {
          const fc2 = await page.waitForEvent('filechooser', { timeout: 5000 });
          await fc2.setFiles(imgPath);
          await page.waitForTimeout(3000);
          console.log(`  ✅ ${img.name} 등록 완료 (대체 방식)`);
        } catch(e2) {
          console.log(`  ❌ ${img.name} 대체 방식도 실패`);
        }
      }
    }
  }
  
  // 5. Add hashtags
  console.log('=== 해시태그 입력 ===');
  try {
    // Find hashtag input area
    const tagInput = await page.$('#tagSearchInput, [placeholder*="태그"], .tag-area input');
    if (tagInput) {
      const tags = HASHTAGS.split(' ').slice(0, 10); // First 10
      for (const tag of tags) {
        await tagInput.click();
        await tagInput.fill(tag.replace('#', ''));
        await page.waitForTimeout(500);
        // Press Enter or select suggestion
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }
      console.log('✅ 해시태그 10개 입력 완료');
    } else {
      // Try pasting all hashtags
      await page.evaluate((tags) => {
        navigator.clipboard.writeText(tags);
      }, HASHTAGS);
      // Click on tag area
      const tagArea = await page.$('[class*="tag"], .tag_search');
      if (tagArea) {
        await tagArea.click();
        await page.keyboard.press('Control+V');
        console.log('✅ 해시태그 붙여넣기 완료');
      }
    }
  } catch (e) {
    console.log('해시태그 입력 실패:', e.message);
  }
  
  await page.waitForTimeout(2000);
  
  // 6. Screenshot final state
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_final_state.png'), fullPage: true });
  console.log('=== 최종 상태 저장 (blog_final_state.png) ===');
  
  console.log('\n✅ 블로그 포스트 작성 완료!');
  console.log('제목: 영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  console.log('이미지: 4장 등록 대기');
  console.log('해시태그: 30개 준비');
  console.log('\n📌 저장 버튼을 눌러주세요 (직접 저장 필요)');
  
  await browser.close();
})();

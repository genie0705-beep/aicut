const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
const path = require('path');
const fs = require('fs');

const WORKSPACE = 'C:\\Users\\paul\\.openclaw\\workspace';

const BODY_HTML = `<p style="text-align: center; line-height: 1.6;">💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"<br>💭 "수정 요청 30회, 편집자가 연락 두절"<br>💭 "이번 달 편집자, 또 바꿔야 하나?"</p><p style="text-align: center;"><br></p><p style="text-align: center; line-height: 1.6;">영상 편집 아웃소싱을 해본 브랜드라면<br>누구나 한 번쯤 겪는 상황입니다.</p><p style="text-align: center;"><br></p><h2 style="text-align: center; font-size: 22px; margin-top: 40px; margin-bottom: 20px;">😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?</h2><p style="text-align: center; line-height: 1.6;"><strong>영상 편집 프리랜서</strong>를 고용해본 분들은<br>다음 같은 경험을 해보셨을 겁니다.</p><p style="text-align: center;"><br></p><h3 style="text-align: center; font-size: 18px; margin-top: 30px;">① 클린트 무한 반복</h3><p style="text-align: center; line-height: 1.6;">"자막이 좀 더 세련되게"<br>"배경 음악이 안 맞는 것 같아요"<br>"컬러 톤을 좀 더 따뜻하게"</p><p style="text-align: center; line-height: 1.6;">매번 다른 의견, 매번 다른 결과.<br><strong>클린트</strong> 5번 돌려도 원하는 느낌이 안 나오는 건<br>편집자의 문제가 아니라 <strong>시스템의 문제</strong>입니다.</p><p style="text-align: center;"><br></p><h3 style="text-align: center; font-size: 18px; margin-top: 30px;">② 매달 새로운 편집자 찾기</h3><p style="text-align: center; line-height: 1.6;">이번 달 A라는 편집자가 괜찮아서<br>다음 달에도 맡기려고 했는데,<br>이미 다른 프로젝트에 잡혀 있습니다. 또 구인 공고를 내고, 또 포트폴리오를 보고, 또 교육하고. 이 과정이 매달 반복됩니다.</p><p style="text-align: center;"><br></p><h3 style="text-align: center; font-size: 18px; margin-top: 30px;">③ 소통 비용 &gt; 편집 비용</h3><p style="text-align: center; line-height: 1.6;">"A 편집자님, 저번에 말씀드린 대로..."<br>"아, 그건 전달이 안 됐네요?"</p><p style="text-align: center; line-height: 1.6;"><strong>편집자와의 소통</strong>에 들어가는 시간이<br>실제 편집 비용보다 더 큽니다.</p><p style="text-align: center;"><br></p><h2 style="text-align: center; font-size: 22px; margin-top: 40px; margin-bottom: 20px;">💡 에이컷이 해결한 방법 (전담 에디터 시스템)</h2><p style="text-align: center; line-height: 1.6;">에이컷은 프리랜서 편집러의 문제를 <strong>시스템으로 해결</strong>했습니다.</p><p style="text-align: center;"><br></p><h3 style="text-align: center; font-size: 18px; margin-top: 30px;">👤 전담 에디터 고정 배정</h3><p style="text-align: center; line-height: 1.6;">한 번 배정된 에디터는 변경 요청이 없는 한 계속 같은 분이 작업합니다.</p><p style="text-align: center;"><br></p><h3 style="text-align: center; font-size: 18px; margin-top: 30px;">📋 브랜드 가이드 저장</h3><p style="text-align: center; line-height: 1.6;">색상 코드, 로고 위치, 자막 폰트, BGM 방향성까지 한 번 등록하면 다음 작업부터 설명이 필요 없습니다.</p><p style="text-align: center;"><br></p><h3 style="text-align: center; font-size: 18px; margin-top: 30px;">⚡ 48시간 기본 납기</h3><p style="text-align: center; line-height: 1.6;">브랜드에 맞는 편집 스타일이 이미 저장되어 있어 리드타임이 획기적으로 줄어듭니다.</p><p style="text-align: center;"><br></p><h2 style="text-align: center; font-size: 22px; margin-top: 40px; margin-bottom: 20px;">📊 바뀐 결과</h2><p style="text-align: center; line-height: 1.6;">에이컷 도입 후 고객사들의 변화입니다.</p><p style="text-align: center;"><br></p><h2 style="text-align: center; font-size: 22px; margin-top: 40px; margin-bottom: 20px;">🎯 이런 분들께 특히 추천합니다</h2><p style="text-align: center; line-height: 1.6;">매달 다른 편집자에게 브랜드를 설명해야 하는 분<br>클린트 피드백에 지친 마케터<br>납기 지연으로 광고 일정이 밀리는 분<br>브랜드 톤 일관성이 중요한 기업</p><p style="text-align: center;"><br></p><h2 style="text-align: center; font-size: 22px; margin-top: 40px; margin-bottom: 20px;">👀 지금 확인해보세요</h2><p style="text-align: center; line-height: 1.6;">프리랜서 편집러와의 끝없는 소통, 이제는 시스템에 맡기세요. <strong>에이컷 무료 상담</strong>에서 업종과 월 제작량에 맞는 플랜을 전담 매니저가 직접 안내해드립니다.</p><p style="text-align: center;"><br></p><p style="text-align: center; line-height: 1.8;">👉 <strong>카카오톡 채널:</strong> 에이컷<br>👉 <strong>이메일:</strong> contact@aicut.co.kr<br>👉 <strong>홈페이지:</strong> aicut.co.kr</p>`;

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = browser.contexts()[0];
  const page = await ctx.newPage();
  
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Title
  console.log('=== 제목 ===');
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅ 완료');
  await page.waitForTimeout(1000);
  
  // 2. Upload images
  console.log('\n=== 이미지 업로드 ===');
  const images = ['aicut_blog_freelancer_thumb.png','aicut_blog_freelancer_01.png','aicut_blog_freelancer_02.png','aicut_blog_freelancer_03.png','aicut_blog_freelancer_cta.png'];
  
  for (let i = 0; i < images.length; i++) {
    const imgPath = path.join(WORKSPACE, images[i]);
    process.stdout.write(`  ${i+1}/5: ${images[i]}... `);
    
    // Get 사진 button position
    const btnPos = await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if ((btn.innerText || '').trim().startsWith('사진')) {
          const r = btn.getBoundingClientRect();
          return { x: r.x + r.width/2, y: r.y + r.height/2 };
        }
      }
      return null;
    });
    
    if (!btnPos) { console.log('❌ 버튼 없음'); continue; }
    
    const fcPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    await page.mouse.click(btnPos.x, btnPos.y);
    const fc = await fcPromise.catch(() => null);
    
    if (fc) {
      await fc.setFiles(imgPath);
      await page.waitForTimeout(2000);
      console.log('✅');
    } else {
      console.log('❌');
    }
  }
  
  // 3. Body paste
  console.log('\n=== 본문 붙여넣기 ===');
  await page.evaluate((html) => { navigator.clipboard.writeText(html); }, BODY_HTML);
  await page.waitForTimeout(300);
  
  // Click editor area to focus
  await page.mouse.click(400, 300); // roughly the editor content area
  await page.waitForTimeout(500);
  
  // Try SmartEditor API for focus
  await page.evaluate(() => {
    try {
      SmartEditor._editors['blogpc001'].getEditor().setBody('<p><br></p>');
    } catch(e) {}
  });
  
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(3000);
  console.log('✅ 완료');
  
  // 4. Hashtags
  console.log('\n=== 해시태그 ===');
  await page.evaluate(() => {
    const tags = "#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작";
    const inputs = document.querySelectorAll('input');
    for (const inp of inputs) {
      if ((inp.placeholder || '').includes('태그')) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, tags);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        return 'ok';
      }
    }
    return 'input not found';
  });
  await page.waitForTimeout(2000);
  console.log('✅ 완료');
  
  // Screenshot
  await page.screenshot({ path: path.join(WORKSPACE, 'blog_done_final.png'), fullPage: true });
  
  console.log('\n=== ✅ 블로그 포스팅 준비 완료 ===');
  console.log('📌 저장 or 발행 버튼만 누르면 됩니다!');
  
  await browser.close();
})();

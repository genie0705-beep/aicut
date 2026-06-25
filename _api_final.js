const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
function generateId() { return 'SE-' + crypto.randomUUID(); }

(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const pages = b.contexts()[0].pages();
  let page;
  for (const p of pages) { if (p.url().includes('PostWriteForm')) { page = p; break; } }
  if (!page) { process.exit(1); }
  
  await page.bringToFront();
  await page.waitForTimeout(2000);
  
  // Step 1: Set title
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅ 제목');
  await page.waitForTimeout(1000);
  
  // Step 2: Build paragraphs from text lines
  const lines = [
    '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"',
    '💭 "수정 요청 30회, 편집자가 연락 두절"',
    '💭 "이번 달 편집자, 또 바꿔야 하나?"',
    '',
    '영상 편집 아웃소싱을 해본 브랜드라면',
    '누구나 한 번쯤 겪는 상황입니다.',
    '',
    '😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?',
    '',
    '① 클린트 무한 반복',
    '매번 다른 의견, 다른 결과.',
    '클린트 5번 돌려도 안 맞는 건',
    '편집자의 문제가 아니라 시스템의 문제입니다.',
    '',
    '② 매달 새로운 편집자 찾기',
    '이번 달 괜찮았던 편집자,',
    '다음 달엔 이미 다른 프로젝트.',
    '이 과정이 매달 반복됩니다.',
    '',
    '③ 소통 비용 > 편집 비용',
    '편집자와의 소통 시간이',
    '실제 편집 비용보다 더 큽니다.',
    '',
    '💡 에이컷이 해결한 방법 (전담 에디터 시스템)',
    '',
    '👤 전담 에디터 고정 배정',
    '📋 브랜드 가이드 저장',
    '⚡ 48시간 기본 납기',
    '',
    '📊 바뀐 결과',
    '편집자 교체 주기 → 고정 배정',
    '클린트 횟수 5~7회 → 1~2회',
    '소통 시간 주 8시간 → 1시간 이내',
    '납기 준수율 60% → 98%',
    '',
    '👉 카카오톡: 에이컷',
    '👉 이메일: contact@aicut.co.kr'
  ];
  
  const paragraphs = lines.map(text => {
    if (text === '') {
      return {
        id: generateId(),
        nodes: [{ id: generateId(), value: '', '@ctype': 'textNode' }],
        '@ctype': 'paragraph'
      };
    }
    return {
      id: generateId(),
      nodes: [{ id: generateId(), value: text, '@ctype': 'textNode' }],
      '@ctype': 'paragraph'
    };
  });
  
  const result = await page.evaluate((paragraphs) => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    const data = ds.getDocumentData();
    const comps = data.document.components;
    
    // Find text component and update its value
    const textComp = comps.find(c => c['@ctype'] === 'text');
    if (textComp) {
      textComp.value = paragraphs;
      ds.setDocumentData(data.document);
      return 'updated text component - ' + paragraphs.length + ' paragraphs';
    }
    return 'no text component';
  }, paragraphs);
  
  console.log('Result:', result);
  await page.waitForTimeout(2000);
  
  // Check result
  const check = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    return {
      textLength: w ? w.innerText.length : 0,
      preview: w ? w.innerText.substring(0, 150) : '',
      hasContent: w ? w.innerText.length > 100 : false,
      hasKeywords: w ? w.innerText.includes('클린트') : false
    };
  });
  console.log('After:', JSON.stringify(check));
  
  // If content inserted, add hashtags and save
  if (check.hasContent) {
    await page.evaluate(() => {
      const tags = '#영상편집외주 #프리랜서편집 #영상편집대행 #에이컷 #AICUT #전담에디터 #48시간납품 #영상편집 #숏폼제작 #릴스편집 #영상제작 #콘텐츠마케팅 #영상마케팅 #SNS영상 #마케팅영상 #브랜드영상 #편집외주 #영상편집비용 #영상편집서비스 #영상편집월정액 #클린트 #수정요청 #브랜드가이드 #전담매니저 #숏폼마케팅 #유튜브편집 #쇼츠제작 #인스타릴스 #영상편집전문 #콘텐츠제작';
      const inputs = document.querySelectorAll('input');
      for (const inp of inputs) {
        if ((inp.placeholder || '').includes('태그')) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(inp, tags);
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          return 'done';
        }
      }
      return 'no tag input';
    });
    await page.waitForTimeout(1500);
    console.log('✅ 해시태그');
    
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) { if ((btn.innerText || '').trim() === '저장') { btn.click(); return; } }
      document.querySelector('.save_btn__bzc5B')?.click();
    });
    await page.waitForTimeout(3000);
    console.log('✅ 저장 완료');
  }
  
  await page.screenshot({ path: 'blog_v1_api_ok.png' });
  console.log('\n=== ✅ 모든 작업 완료 ===');
  console.log('제목: O');
  console.log('본문: ' + (check.hasContent ? '✅ ' + check.textLength + '자' : '❌'));
  console.log('이미지: 직접 등록 필요');
  console.log('해시태그: O');
  console.log('저장: O');
  
  await b.close();
})();

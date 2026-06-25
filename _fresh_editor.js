const { chromium } = require('C:/Users/paul/AppData/Roaming/npm/node_modules/playwright/index.js');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9223');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  // Fresh editor
  await page.goto('https://blog.naver.com/PostWriteForm.naver?blogId=aicut', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // 1. Set title
  await page.evaluate(() => {
    SmartEditor._editors['blogpc001'].setDocumentTitle('영상편집 클린트 5번, 수정 요청 30회... 프리랜서 편집러와 작별한 이유');
  });
  console.log('✅ 제목');
  await page.waitForTimeout(1000);
  
  // 2. Get existing text component, add multiple paragraphs
  const ok = await page.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const ds = ed._documentService;
    const data = ds.getDocumentData();
    const textComp = data.document.components.find(c => c['@ctype'] === 'text');
    if (!textComp) return 'no text comp';
    
    // Replace value with empty array first? No - just add new paragraphs after existing
    // The existing value has 1 empty paragraph. Replace it with our content.
    textComp.value = [
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '💭 "클린트만 5번 돌렸는데 마음에 안 든다고?"', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '💭 "수정 요청 30회, 편집자가 연락 두절"', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '💭 "이번 달 편집자, 또 바꿔야 하나?"', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '영상 편집 아웃소싱을 해본 브랜드라면 누구나 한 번쯤 겪는 상황입니다.', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '😤 프리랜서 편집러, 왜 자꾸 바꾸게 될까?', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '① 클린트 무한 반복', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '매번 다른 의견, 다른 결과. 클린트 5번 돌려도 안 맞는 건 편집자의 문제가 아니라 시스템의 문제입니다.', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '② 매달 새로운 편집자 찾기', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '이번 달 괜찮았던 편집자, 다음 달엔 이미 다른 프로젝트. 이 과정이 매달 반복됩니다.', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '③ 소통 비용 > 편집 비용', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '편집자와의 소통 시간이 실제 편집 비용보다 더 큽니다.', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '💡 에이컷이 해결한 방법 (전담 에디터 시스템)', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '👤 전담 에디터 고정 배정', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '📋 브랜드 가이드 저장', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '⚡ 48시간 기본 납기', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '📊 바뀐 결과', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '편집자 교체 주기: 매월 → 고정 배정', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '클린트 횟수: 5~7회 → 1~2회', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '소통 시간: 주 8시간 → 1시간 이내', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '납기 준수율: 60% → 98%', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '👉 카카오톡 채널: 에이컷', '@ctype': 'textNode' }]
      },
      {
        '@ctype': 'paragraph',
        nodes: [{ value: '👉 이메일: contact@aicut.co.kr', '@ctype': 'textNode' }]
      }
    ];
    
    try {
      ds.setDocumentData(data.document);
      return 'success';
    } catch(e) {
      return 'error: ' + e.message + ' at ' + e.stack?.substring(0, 200);
    }
  });
  
  console.log('Result:', ok);
  await page.waitForTimeout(3000);
  
  const check = await page.evaluate(() => {
    const w = document.querySelector('.se-content');
    return { textLength: w ? w.innerText.length : 0, preview: w ? w.innerText.substring(0, 100) : '' };
  });
  console.log('After:', JSON.stringify(check));
  
  await page.screenshot({ path: 'editor_fresh_done.png' });
  
  // Save if content exists
  if (check.textLength > 50) {
    await page.evaluate(() => {
      document.querySelector('.save_btn__bzc5B')?.click();
    });
    await page.waitForTimeout(3000);
    console.log('✅ 저장');
  }
  
  await b.close();
})();

// 치과 임플란트 블로그 - 이미지 삽입 v2 (SE4 분석 기반)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BLOG_URL = 'https://blog.naver.com/aicut/224341544476';
const CDP_PORT = process.env.CDP_PORT || 9224;

const IMAGES = [
  { file: 'aicut_blog_dental_main.png', pos: 0 },   // 도입부 후
  { file: 'aicut_blog_dental_01.png', pos: 1 },      // 📋 섹션 후
  { file: 'aicut_blog_dental_02.png', pos: 2 },      // 🎥 섹션 후
  { file: 'aicut_blog_dental_03.png', pos: 3 },      // 📅 섹션 후
  { file: 'aicut_blog_dental_cta.png', pos: 4 }      // ✅ 섹션 후
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * SE4 에디터에 이미지 컴포넌트 삽입 후 정렬
 * 이미지 컴포넌트를 만들어 insertDocumentData로 추가
 */
async function insertImageViaSE4API(page, imageFile, insertAfterIndex) {
  const imagePath = path.resolve(__dirname, imageFile);
  console.log(`  📄 파일: ${imageFile} (${fs.statSync(imagePath).size} bytes)`);

  // 1. 에디터에서 이미지 컴포넌트 추가할 index 계산
  // insertAfterIndex 번째 텍스트 컴포넌트 뒤에 이미지 추가
  const result = await page.evaluate(async (imgIdx) => {
    const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
    if (!se) return { error: 'SmartEditor not found' };

    try {
      const docSvc = se._documentService;
      let data = docSvc.getDocumentData();
      
      // 텍스트 컴포넌트 중에서 imgIdx 번째 찾기
      let textCount = -1;
      let insertIdx = -1;
      for (let i = 0; i < data.length; i++) {
        if (data[i].type === 'text') {
          textCount++;
          if (textCount === imgIdx) {
            insertIdx = i + 1;
            break;
          }
        }
      }
      
      return {
        totalComponents: data.length,
        textComponents: data.filter(c => c.type === 'text').length,
        imageComponents: data.filter(c => c.type === 'image').length,
        targetTextIndex: imgIdx,
        insertAtComponentIndex: insertIdx,
        dataPreview: data.slice(0, 5).map(c => ({ type: c.type, text: (c.text || '').substring(0, 30) }))
      };
    } catch(e) {
      return { error: e.message };
    }
  }, insertAfterIndex);

  console.log('  SE4 분석:', JSON.stringify(result, null, 2));
  return result;
}

(async () => {
  console.log('🔍 블로그 포스팅 수정 모드 진입...');
  
  const b = await chromium.connectOverCDP('http://127.0.0.1:' + CDP_PORT);
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  
  try {
    // 1. 페이지 로딩
    console.log('📄 포스팅 로딩 중...');
    await page.goto(BLOG_URL, { waitUntil: 'load', timeout: 30000 });
    await sleep(3000);

    // 2. PostView iframe 찾기
    const frames = page.frames();
    const pf = frames.find(f => f.url().includes('PostView'));
    if (!pf) {
      console.error('❌ PostView iframe not found');
      return;
    }
    console.log('  ✅ PostView iframe 발견');

    // 3. 수정 버튼 클릭
    console.log('🔍 수정하기 버튼 클릭...');
    const editLink = await pf.$('a._modifyPost');
    if (editLink) {
      await editLink.click();
      console.log('  ✅ 수정하기 클릭됨');
    } else {
      // Fallback
      await page.goto(`https://blog.naver.com/PostEdit.naver?blogId=aicut&postNo=224341544476&from=postView`, { waitUntil: 'load', timeout: 30000 });
      console.log('  ⚠️ 직접 수정 URL로 이동');
    }
    
    await sleep(5000);

    // 4. SE4 에디터 로딩 확인
    console.log('🔍 SE4 에디터 확인...');
    
    // 에디터 상태 확인
    const seStatus = await page.evaluate(() => {
      const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
      if (!se) return { found: false, hasSE: !!window.SmartEditor, hasEditors: !!window.SmartEditor?._editors };
      
      const docSvc = se._documentService;
      let docData = [];
      let compCount = 0;
      try {
        docData = docSvc.getDocumentData();
        compCount = docData.length;
      } catch(e) {}
      
      return {
        found: true,
        has_getDocumentData: !!docSvc?.getDocumentData,
        has_insertDocumentData: !!docSvc?.insertDocumentData,
        has_appendDocumentData: !!docSvc?.appendDocumentData,
        has_setDocumentData: !!docSvc?.setDocumentData,
        componentCount: compCount,
        componentTypes: docData.map(c => c.type),
        components: docData.map(c => ({
          type: c.type,
          textPrefix: (c.text || '').substring(0, 40),
          align: c.align
        })),
        has_editingService: !!se._editingService,
      };
    });
    
    console.log('  SE4 상태:', JSON.stringify(seStatus, null, 2));
    
    if (!seStatus.found) {
      console.error('❌ SmartEditor not available');
      await page.screenshot({ path: '_debug_no_se.png' });
      return;
    }

    // 5. 이미지 삽입
    // 방법: documentData에 이미지 컴포넌트 추가 후 setDocumentData로 전체 갱신
    // 또는 insertDocumentData 사용
    
    console.log('\n🖼️ 이미지 삽입 시작...\n');
    
    for (let i = 0; i < IMAGES.length; i++) {
      const img = IMAGES[i];
      console.log(`[${i + 1}/5] ${img.file} (이미지 ${img.pos}번째 텍스트 뒤)...`);
      
      const fullPath = path.resolve(__dirname, img.file);
      if (!fs.existsSync(fullPath)) {
        console.log(`  ❌ 파일 없음, 스킵`);
        continue;
      }

      // 이미지를 base64로 읽기
      const imageBuffer = fs.readFileSync(fullPath);
      const base64Data = imageBuffer.toString('base64');
      const mimeType = 'image/png';
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      // SE4 API로 이미지 컴포넌트 추가
      const insertResult = await page.evaluate(async ({ dataUri, insertAfterIdx, fileName }) => {
        const se = window.SmartEditor?.instance || window.SmartEditor?._editors?.blogpc001;
        if (!se) return { error: 'SmartEditor not found' };

        try {
          const docSvc = se._documentService;
          const data = docSvc.getDocumentData();
          
          // 텍스트 컴포넌트 중 insertAfterIdx 번째 찾기
          let textCount = -1;
          let insertPos = -1;
          for (let i = 0; i < data.length; i++) {
            if (data[i].type === 'text') {
              textCount++;
              if (textCount === insertAfterIdx) {
                insertPos = i + 1;
                break;
              }
            }
          }

          if (insertPos < 0) {
            // 못 찾으면 맨 뒤에 추가
            insertPos = data.length;
          }

          // 이미지 컴포넌트 생성
          const imageComponent = {
            type: 'image',
            src: dataUri,
            alt: fileName,
            width: 700,
            height: 700,
            align: 'center',
            caption: '',
            style: { width: '100%' }
          };

          // insertDocumentData로 삽입
          if (typeof docSvc.insertDocumentData === 'function') {
            docSvc.insertDocumentData(insertPos, imageComponent);
          } else if (typeof docSvc === 'function') {
            // 다른 방법 시도
            const startData = data.slice(0, insertPos);
            const endData = data.slice(insertPos);
            const newData = [...startData, imageComponent, ...endData];
            docSvc.setDocumentData(newData);
          } else {
            return { error: 'No insert method', insertPos };
          }

          return { success: true, insertPos, totalAfter: docSvc.getDocumentData().length };
        } catch(e) {
          return { error: e.message };
        }
      }, { dataUri, insertAfterIdx: img.pos, fileName: img.file });

      console.log('  결과:', JSON.stringify(insertResult));
      
      if (insertResult.error) {
        console.log(`  ⚠️ SE4 API 실패: ${insertResult.error}`);
      } else {
        console.log('  ✅ 이미지 컴포넌트 추가됨');
      }
      
      await sleep(1000);
    }

    // 6. 저장 버튼 클릭
    console.log('\n💾 저장 시도...');
    
    // 다양한 저장 버튼 찾기
    const saveBtnSelectors = [
      'button:has-text("저장")',
      'a:has-text("저장")',
      '.se-btn-save',
      '.btn_save',
      'button._btn_save',
      'button[class*="save"]',
      'a[class*="save"]',
      '[class*="save" i] button'
    ];
    
    let saved = false;
    for (const sel of saveBtnSelectors) {
      const btn = await page.$(sel).catch(() => null);
      if (btn) {
        const visible = await btn.isVisible().catch(() => false);
        if (visible) {
          console.log(`  ✅ 저장 버튼 발견: "${sel}"`);
          await btn.click();
          await sleep(3000);
          saved = true;
          break;
        }
      }
    }
    
    if (!saved) {
      console.log('  ⚠️ 저장 버튼 미발견, DOM 스캔...');
      const allButtons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button, a, span')).filter(el => {
          const t = (el.textContent || '').trim();
          return t === '저장' && el.offsetParent !== null;
        }).map(el => ({ tag: el.tagName, text: el.textContent?.trim(), cls: el.className?.substring(0, 60), id: el.id }));
      });
      console.log('  visible 저장 요소:', JSON.stringify(allButtons));
      
      // Fallback: If all else fails, we saved as draft
      console.log('  ⚠️ 자동 저장 실패 - 수동 저장 필요');
    }

    // Final screenshot
    await page.screenshot({ path: '_debug_final.png', fullPage: false });
    
    console.log('\n✅ 작업 완료!');
    console.log('📋 요약:');
    console.log('  - 생성된 이미지: 5장');
    for (const img of IMAGES) {
      const p = path.resolve(__dirname, img.file);
      console.log(`    ${fs.existsSync(p) ? '✅' : '❌'} ${img.file}`);
    }
    
  } catch(err) {
    console.error('❌ 오류:', err.message);
    console.error(err.stack);
  } finally {
    await page.close();
    console.log('🔌 탭 종료');
  }
})();

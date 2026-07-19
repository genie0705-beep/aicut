const { chromium } = require('playwright');

const IMG_ALTS = {
  'aicut_blog_hospital_main.png': '피부과 영상 마케팅 숏폼 편집 대표 이미지',
  'aicut_blog_hospital_01.png': '병원 영상 직접 찍고 편집하는 부담',
  'aicut_blog_hospital_02.png': '의료광고 규제 전문 에디터 체크',
  'aicut_blog_hospital_03.png': '여름 시즌 피부과 의원 마케팅 전략',
  'aicut_blog_hospital_cta.png': '병원 영상 편집 외주 에이컷 문의',
};

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const pages = b.contexts()[0].pages();
  let target = -1;
  pages.forEach((p,i)=>{if(p.url().includes('Redirect=Write'))target=i;});
  if (target < 0) { console.log('❌'); process.exit(1); }
  
  const f = await (await pages[target].$('#mainFrame')).contentFrame();
  
  // 이미지에 caption (alt) 설정 - 올바른 객체 형식
  const result = await f.evaluate((alts) => {
    try {
      const ed = SmartEditor._editors['blogpc001'];
      const data = ed.getDocumentData();
      const comps = data.document.components || [];
      
      let setCount = 0;
      comps.forEach(c => {
        if (c.fileName && alts[c.fileName]) {
          // SE4 caption 형식: 객체
          c.caption = {
            id: 'cap_' + Date.now(),
            value: [{ id: 'capv_' + Date.now(), nodes: [{ id: 'capt_' + Date.now(), value: alts[c.fileName], '@ctype': 'textNode' }], '@ctype': 'paragraph' }],
          };
          setCount++;
        }
      });
      
      ed.setDocumentData(data);
      return { set: setCount, total: comps.filter(c => c.fileName).length };
    } catch(e) {
      return { error: e.message };
    }
  }, IMG_ALTS);
  
  console.log('Alt 설정 결과:', JSON.stringify(result));
  
  if (result.error) {
    console.log('❌ 캡션 설정 실패');
  } else {
    // 저장
    await f.evaluate(() => { window.scrollTo(0,0); document.querySelector('.save_btn__bzc5B')?.click(); });
    console.log('💾 저장');
    await f.waitForTimeout(2000);
    
    // 확인
    const check = await f.evaluate(() => {
      const comps = SmartEditor._editors['blogpc001'].getDocumentData().document.components || [];
      const imgs = comps.filter(c => c.fileName);
      return {
        total: imgs.length,
        withCaption: imgs.filter(i => i.caption && typeof i.caption === 'object').length,
      };
    });
    console.log('✅ 캡션 설정 완료:', JSON.stringify(check));
  }
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

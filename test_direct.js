const { chromium } = require('playwright');

const TITLE = '피부과 영상 마케팅, 숏폼 편집 하나로 해결되는 이유 | 여름 시즌 준비';
const IMG_DIR = 'C:\\Users\\paul\\.openclaw\\workspace\\';
const IMG_FILES = [
  'aicut_blog_hospital_main.png',
  'aicut_blog_hospital_01.png',
  'aicut_blog_hospital_02.png',
  'aicut_blog_hospital_03.png',
  'aicut_blog_hospital_cta.png',
];

async function waitForSE(page) {
  for (let i = 0; i < 20; i++) {
    const fe = await page.$('#mainFrame');
    if (fe) {
      const f = await fe.contentFrame();
      if (f) {
        try {
          const ok = await f.evaluate(() => typeof SmartEditor?._editors?.['blogpc001'] !== 'undefined');
          if (ok) return f;
        } catch(e) { /* retry */ }
      }
    }
    await page.waitForTimeout(1500);
  }
  return null;
}

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const page = await ctx.newPage();
  page.on('dialog', async d => { await d.accept(); });
  
  await page.goto('https://blog.naver.com/aicut?Redirect=Write&', { waitUntil: 'networkidle', timeout: 20000 });
  console.log('🔄 로딩...');
  const f = await waitForSE(page);
  if (!f) { console.log('❌'); process.exit(1); }
  
  // 팝업 제거
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(500);

  // 제목 설정
  await f.evaluate((t) => SmartEditor._editors['blogpc001'].setDocumentTitle(t), TITLE);
  console.log('✅ 제목 설정');

  // 모든 텍스트를 한 번에 contentEditable에 넣기
  await f.evaluate(() => {
    // contentEditable 찾기
    const ce = document.querySelector('[contenteditable]');
    if (!ce) throw new Error('contentEditable 없음');
    
    ce.focus();
    ce.click();
    
    // SE4 text editor API로 접근
    const ed = SmartEditor._editors['blogpc001'];
    
    // Get the text editor component
    // SE4 uses a contentEditable div as the text input surface
    // When focused, keyboard input goes to the editor
    
    // Create a paragraph structure
    const textContent = [
      "<h2>☀️ 요즘 병원 마케팅, '숏폼'이 전부다</h2>",
      '<p>"원장님, 인스타그램 하세요?"</p>',
      '<p>요즘 병원·의원에 가면 꼭 듣는 질문입니다.</p>',
      '<p>환자들이 병원을 고를 때</p>',
      '<p><b>인스타그램이나 유튜브 숏폼</b>을 먼저 본다고 해요.</p>',
      '<p>실제로 릴스·쇼츠에 병원 소개 영상을 올리면</p>',
      '<p>일반 텍스트보다 문의율이 3배 이상 높습니다.</p>',
      '<p>하지만 문제는 <b>영상 찍고 편집하는 게 너무 어렵다</b>는 거예요.</p>',
      '<p>간호사님한테 폰으로 찍어달라 하기도 애매하고,</p>',
      '<p><b>의료광고 규제</b> 때문에 뭐라도 잘못 나갈까 겁나고요.</p>',
      '<p>그래서 준비했습니다.</p>',
      '<p><b>피부과·치과·한의원·성형외과</b>에서</p>',
      '<p>바로 써먹을 수 있는 <b>영상 마케팅 전략</b>을 알려드릴게요.</p>',
      '<p><br></p>',
    ].join('\n');

    // 1. First set blocks data
    const data = ed.getDocumentData();
    data.document.blocks = [
      { type: 'heading2', text: "☀️ 요즘 병원 마케팅, '숏폼'이 전부다", style: { textAlign: 'center' } },
      { type: 'paragraph', text: '"원장님, 인스타그램 하세요?"', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '요즘 병원·의원에 가면 꼭 듣는 질문입니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '환자들이 병원을 고를 때', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '인스타그램이나 유튜브 숏폼을 먼저 본다고 해요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '실제로 릴스·쇼츠에 병원 소개 영상을 올리면', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '일반 텍스트보다 문의율이 3배 이상 높습니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '하지만 문제는 영상 찍고 편집하는 게 너무 어렵다는 거예요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '간호사님한테 폰으로 찍어달라 하기도 애매하고,', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '의료광고 규제 때문에 뭐라도 잘못 나갈까 겁나고요.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '그래서 준비했습니다.', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '피부과·치과·한의원·성형외과에서', style: { textAlign: 'center' } },
      { type: 'paragraph', text: '바로 써먹을 수 있는 영상 마케팅 전략을 알려드릴게요.', style: { textAlign: 'center' } },
    ];
    ed.setDocumentData(data);
    
    // 2. Now try to make it visible by clicking on ce and typing
    // The ce is inside the canvas - need to dispatch proper events
    ce.innerHTML = textContent;
    
    // Dispatch input event for React
    ce.dispatchEvent(new Event('input', { bubbles: true }));
    ce.dispatchEvent(new Event('paste', { bubbles: true }));
  });
  
  await f.waitForTimeout(2000);
  
  // Check
  const result = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const data = ed.getDocumentData();
    const canvas = document.querySelector('.se-canvas');
    const blocks = data.document.blocks;
    const r = { 
      title: ed.getDocumentTitle(),
      blocks: blocks?.length || 0,
      canvasTextLen: (canvas?.innerText || '').length,
      canvasText: (canvas?.innerText || '').substring(0, 200),
    };
    if (blocks) {
      r.types = {};
      blocks.forEach(b => { r.types[b.type] = (r.types[b.type]||0)+1; });
      let chars = 0;
      blocks.forEach(b => { if (b.text) chars += b.text.length; });
      r.chars = chars;
    }
    return r;
  });
  
  console.log('결과:', JSON.stringify(result, null, 2));
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

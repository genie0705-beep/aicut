const { chromium } = require('playwright');
const fs = require('fs');

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
  console.log('🔄 에디터 로딩...');
  
  const f = await waitForSE(page);
  if (!f) { console.log('❌ 로드 실패'); process.exit(1); }
  
  // 팝업 정리
  await f.evaluate(() => document.querySelectorAll('.se-popup-dim, .se-popup, .se-flayer').forEach(el => el.remove()));
  await f.waitForTimeout(1000);

  // SmartEditor API 탐색
  const apiInfo = await f.evaluate(() => {
    const ed = SmartEditor._editors['blogpc001'];
    const methods = [];
    
    // editor 객체의 메서드들
    for (const key in ed) {
      if (typeof ed[key] === 'function') {
        methods.push({ name: key, args: ed[key].length });
      }
    }
    
    // 주요 속성
    const props = {};
    for (const key in ed) {
      if (key.startsWith('_') || key.startsWith('$')) continue;
      const v = ed[key];
      props[key] = typeof v;
    }
    
    // execute 명령어 목록
    let executeCmds = [];
    if (typeof ed.execute === 'function') {
      // HTML을 삽입
    }
    
    // contenteditable 찾기
    const allCE = document.querySelectorAll('[contenteditable]');
    const ceInfo = Array.from(allCE).slice(0, 5).map(el => ({
      tag: el.tagName,
      id: el.id,
      cls: el.className.substring(0, 50),
      innerLen: (el.innerText || '').length,
      parentCls: el.parentElement?.className?.substring(0, 40),
    }));
    
    // editor API keys
    const allKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(ed)).filter(k => k !== 'constructor');
    
    return {
      methodCount: methods.length,
      sampleMethods: methods.slice(0, 30),
      allKeys: allKeys.slice(0, 20),
      props: Object.keys(props).slice(0, 20),
      contentEditables: ceInfo,
      hasExecute: typeof ed.execute === 'function',
      has$editor: !!ed.$editor,
    };
  });
  
  console.log('API 정보:');
  console.log('메서드 샘플:', JSON.stringify(apiInfo.sampleMethods, null, 2));
  console.log('\nallKeys:', JSON.stringify(apiInfo.allKeys));
  console.log('\nprops:', JSON.stringify(apiInfo.props));
  console.log('\ncontentEditables:', JSON.stringify(apiInfo.contentEditables));
  console.log('\nhasExecute:', apiInfo.hasExecute);
  
  process.exit(0);
}

main().catch(e => console.error('❌', e.message));

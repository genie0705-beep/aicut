const { chromium } = require('playwright');
const path = require('path');

const WS = path.join(__dirname, '..');
const IMAGES = [
  { file: path.join(WS, 'aicut_blog_fp_main.png'), section: 0 },  // 맨 앞
  { file: path.join(WS, 'aicut_blog_fp_card1.png'), section: 2 }, // 상반기 트렌드 앞
  { file: path.join(WS, 'aicut_blog_fp_card2.png'), section: 3 }, // 하반기 전략 앞
  { file: path.join(WS, 'aicut_blog_fp_card3.png'), section: 4 }, // 사례 앞
  { file: path.join(WS, 'aicut_blog_fp_cta.png'), section: 5 },   // CTA 앞
];

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // 1. 현재 컴포넌트 리스트 확인 (텍스트 컴포넌트 수)
  const comps = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const list = se._papyrus._componentListStore;
    // compList나 유사한 속성 찾기
    const keys = Object.keys(list);
    return { storeKeys: keys.filter(k => !k.startsWith('_')).slice(0,10) };
  });
  console.log('store keys:', comps.storeKeys);

  // 2. 컴포넌트 리스트 속성 자세히 확인
  const detail = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const store = se._papyrus._componentListStore;
    // 모든 속성 출력
    const props = {};
    for (const key of Object.getOwnPropertyNames(store)) {
      const val = store[key];
      if (key === 'compList' || key === 'components' || key === '_components') {
        props[key] = Array.isArray(val) ? `Array(${val.length})` : typeof val;
      }
    }
    return Object.keys(props).length ? props : Object.keys(store).slice(0,15);
  });
  console.log('store detail:', JSON.stringify(detail, null, 2));

  // 3. 가장 가능성 있는 속성 찾기
  const compListTest = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const store = se._papyrus._componentListStore;
    // compList 찾기
    let cl = store.compList || store.components || store._components;
    if (!cl) {
      // object의 key/value 순회
      for (const k of Object.keys(store)) {
        const v = store[k];
        if (Array.isArray(v) && v.length > 0 && v[0]._componentType) {
          cl = v;
          break;
        }
        if (Array.isArray(v) && v.length > 0 && v[0].type) {
          cl = v;
          break;
        }
      }
    }
    if (!cl || !cl.length) return { found: false };
    return {
      found: true,
      count: cl.length,
      items: cl.map((c, i) => ({
        type: c._componentType || c.type || c.componentType,
        text: (c.textContent || c._textContent || '').substring(0, 50),
        id: c.componentId || c.id
      }))
    };
  });
  console.log('compList:', JSON.stringify(compListTest, null, 2));

  await b.close();
}
main().catch(e => console.error('❌', e.message));

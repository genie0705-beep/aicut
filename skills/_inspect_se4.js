// 네이버 블로그 에디터 구조 확인
const { chromium } = require('playwright');

async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const p = await ctx.newPage();
  
  await p.goto('https://blog.naver.com/PostWrite.naver?blogNaverId=aicut&categoryNo=2', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  await p.waitForTimeout(5000);
  
  const info = await p.evaluate(() => {
    const result = {
      url: location.href,
      title: document.title,
      iframes: [],
      editors_defined: typeof SmartEditor,
      editor_keys: [],
      contenteditables: 0,
      body_attrs: [],
      se2_selector: null,
    };
    
    // iframes
    document.querySelectorAll('iframe').forEach(f => {
      result.iframes.push({ id: f.id, name: f.name, className: f.className, src: (f.src || '').slice(0,100) });
    });
    
    // SmartEditor
    if (typeof SmartEditor !== 'undefined' && SmartEditor._editors) {
      result.editor_keys = Object.keys(SmartEditor._editors);
    }
    
    // contenteditable
    result.contenteditables = document.querySelectorAll('[contenteditable]').length;
    
    // body attrs
    result.body_attrs = Array.from(document.body.getAttributeNames());
    
    // SE selectors
    ['se2_inputarea','se2_content_container','se_composer_wrap','smart_editor_body','editor_area'].forEach(cls => {
      const el = document.querySelector('.' + cls);
      if (el) result.se2_selector = cls;
    });
    
    // 특정 영역
    const postEditor = document.getElementById('postWriteContents');
    result.postWriteContents = !!postEditor;
    result.postWriteContents_childCount = postEditor ? postEditor.children.length : 0;
    // postWriteContents의 첫 3개 자식 클래스
    if (postEditor) {
      result.postWriteContents_children = Array.from(postEditor.children).slice(0,5).map(c => ({
        tag: c.tagName,
        id: c.id,
        cls: c.className,
        role: c.getAttribute('role'),
      }));
    }
    
    return result;
  });
  
  console.log(JSON.stringify(info, null, 2));
  await b.disconnect();
}

main().catch(e => console.error(e.message));

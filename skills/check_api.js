const { chromium } = require('playwright');
async function main() {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
  const ctx = b.contexts()[0];
  const pages = ctx.pages();
  let wp = pages.find(p => p.url().includes('PostWriteForm'));
  if (!wp) { console.log('글쓰기 페이지 없음'); await b.close(); return; }

  // SE4 API 분석 - 이미지 삽입 가능한 메서드 찾기
  const apiInfo = await wp.evaluate(() => {
    const se = SmartEditor._editors['blogpc001'];
    const methods = [];

    // _papyrus 관련 (문서 모델)
    const papyrus = se._papyrus;
    if (papyrus) {
      const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(papyrus));
      methods.push('papyrus methods: ' + keys.filter(k => k.includes('Image') || k.includes('image') || k.includes('photo') || k.includes('insert') || k.includes('add')).join(', '));
    }

    // _componentListStore
    if (se._componentListStore) {
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(se._componentListStore));
      methods.push('compListStore: ' + proto.filter(k => k.includes('insert') || k.includes('add') || k.includes('Image') || k.includes('Component')).join(', '));
    }

    // _editingService
    if (se._editingService) {
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(se._editingService));
      methods.push('editingService: ' + proto.filter(k => k.includes('Image') || k.includes('image') || k.includes('insert') || k.includes('Component')).join(', '));
    }

    // _documentService
    if (se._documentService) {
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(se._documentService));
      methods.push('documentService: ' + proto.filter(k => k.includes('insert') || k.includes('add') || k.includes('Component') || k.includes('image')).join(', '));
    }

    // _photoUploader
    if (se._photoUploader) {
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(se._photoUploader));
      methods.push('photoUploader: ' + proto.join(', '));
    }
    if (se._papyrus && se._papyrus._photoUploader) {
      const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(se._papyrus._photoUploader));
      methods.push('papyrus photoUploader: ' + proto.join(', '));
    }

    // 모든 최상위 키에서 photo/image 관련 것들
    const allKeys = Object.keys(se).filter(k => 
      k.toLowerCase().includes('photo') || k.toLowerCase().includes('image') || 
      k.toLowerCase().includes('upload'));
    methods.push('SE keys: ' + allKeys.join(', '));

    // 사진 버튼의 클릭 이벤트 확인
    const btn = document.querySelector('.se-insert-menu-button-image');
    const btnClickHandlers = btn ? Object.keys(btn).filter(k => k.startsWith('__reactEventHandlers')) : [];
    
    return { methods, hasInsertMenuBtn: !!btn, btnClickHandlers };
  });

  console.log('API 분석 결과:');
  apiInfo.methods.forEach(m => console.log('  ' + m));
  console.log('사진 버튼 존재:', apiInfo.hasInsertMenuBtn);

  await b.close();
}
main().catch(e => console.error('❌', e.message));

// execCommand로 본문 삽입 (React 호환)
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = b.contexts()[0];

  for (const p of ctx.pages()) {
    if (p.url().includes('postwrite')) {
      // contenteditable에 execCommand로 텍스트 삽입
      await p.evaluate(() => {
        const ed = document.querySelector('[contenteditable="true"]');
        if (!ed) return 'no editor';

        ed.focus();
        ed.dispatchEvent(new FocusEvent('focus', { bubbles: true }));

        // Selection 설정
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(ed);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        // execCommand로 텍스트 삽입
        const text = [
          '"편집을 어떻게 해결할까?"',
          '',
          '직접 하기엔 시간이 없고, 채용하기엔 비용이 부담스럽다.',
          '스타트업이라면 누구나 한 번쯤 하는 고민이다.',
          '',
          '대부분 선택하는 두 가지 길.',
          '',
          '프리랜서에게 건당 의뢰하거나,',
          '영상편집 월정액 서비스를 쓰거나.',
          '',
          '이 글에서 두 방식의 실제 비용과 운영 방식을 비교한다.',
          '',
          '프리랜서 편집, 실제 비용은?',
          '월 10편 기준 50만~150만 원.',
          '여기에 브리핑·수정·납기 리스크가 더해진다.',
          '',
          '에이컷 월정액, 비용 구조는?',
          '월 4편 기준 49만 원~',
          '전담 에디터 · 수정 무제한 · D+1 납품',
          '',
          '지금 바로 무료 상담 신청하세요.',
          '👉 aicut.co.kr',
        ].join('\n');

        document.execCommand('insertText', false, text);
        ed.dispatchEvent(new Event('input', { bubbles: true }));
        ed.dispatchEvent(new Event('change', { bubbles: true }));
        return 'done';
      }).then(r => console.log('execCommand:', r)).catch(e => console.log('execCommand 오류:', e.message.substring(0, 50)));

      await p.waitForTimeout(1000);

      // 확인
      const result = await p.evaluate(() => {
        const titleEl = document.querySelector('.se-title-text');
        const title = titleEl ? titleEl.innerText || '' : '';
        const eds = document.querySelectorAll('[contenteditable]');
        let body = '';
        for (const ed of eds) {
          const t = ed.innerText || '';
          if (t.length > body.length) body = t;
        }
        return { title: title.substring(0, 40), bodyLen: body.length, bodyPrev: body.substring(0, 80) };
      }).catch(() => ({}));

      console.log('\n=== 에디터 상태 ===');
      console.log('제목:', result.title || '(비어있음)');
      console.log('본문:', result.bodyLen > 0 ? `✅ ${result.bodyLen}자` : '❌ 비어있음');
      if (result.bodyLen > 0) console.log('시작:', result.bodyPrev);

      break;
    }
  }

  try { await b.close(); } catch(e) {}
})();

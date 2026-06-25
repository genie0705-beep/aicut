// ========================================
// 에이컷 AICUT - GA4 전환 추적
// 기존 GA4 초기화 코드 아래에 붙여넣기
// ========================================

(function () {
  function sendEvent(name, params) {
    if (typeof gtag === 'function') gtag('event', name, params);
  }

  function initTracking() {
    // CTA 버튼 추적
    document.querySelectorAll('button, a').forEach(function (el) {
      var text = (el.innerText || el.textContent || '').trim();

      if (text.includes('무료로 시작하기')) {
        el.addEventListener('click', function () {
          sendEvent('generate_lead', { method: '무료로_시작하기' });
        });
      }
      if (text.includes('월 정기 계약 문의')) {
        el.addEventListener('click', function () {
          sendEvent('generate_lead', { method: '월정기계약_문의' });
        });
      }
      if (text.includes('VFX 견적 문의')) {
        el.addEventListener('click', function () {
          sendEvent('generate_lead', { method: 'VFX_견적문의' });
        });
      }
    });

    // 카카오 상담 클릭
    document.querySelectorAll('a[href*="kakao"]').forEach(function (el) {
      el.addEventListener('click', function () {
        sendEvent('generate_lead', { method: '카카오_상담' });
      });
    });

    // 이메일 문의 클릭
    document.querySelectorAll('a[href^="mailto"]').forEach(function (el) {
      el.addEventListener('click', function () {
        sendEvent('generate_lead', { method: '이메일_문의' });
      });
    });

    // 폼 제출
    document.querySelectorAll('form').forEach(function (form) {
      form.addEventListener('submit', function () {
        sendEvent('generate_lead', { method: '폼_제출' });
      });
    });

    // 스크롤 깊이
    var tracked = {};
    window.addEventListener('scroll', function () {
      var pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      [25, 50, 75, 90].forEach(function (m) {
        if (pct >= m && !tracked[m]) {
          tracked[m] = true;
          sendEvent('scroll_depth', { depth: m + '%' });
        }
      });
    }, { passive: true });
  }

  // DOM 준비 후 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
  } else {
    initTracking();
  }

  // React/SPA 대응 (동적 렌더링 후 재바인딩)
  setTimeout(initTracking, 1500);
})();

# GA4 + 네이버 전환추적 설치 가이드

## 1. GA4 태그 설치 (aicut.co.kr <head>에 추가)

```html
<!-- Google tag (gtag.js) - GA4 측정ID: G-D141VGTF79 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-D141VGTF79"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-D141VGTF79');
</script>
```

## 2. 네이버 전환추적 (네이버 광고센터)

네이버 광고센터 → 도구 → 전환추적 → 새 전환추적 생성

**전환유형:** "문의" 또는 "상담신청"
**추적방식:** 직접 픽셀 설치

### 문의하기 버튼 클릭 시 (전환 스크립트)

```html
<!-- NAVER Conversion Tracking -->
<script type="text/javascript" src="https://wcs.naver.net/wcslog.js"></script>
<script type="text/javascript">
if (!wcs_add) var wcs_add = {};
wcs_add["wa"] = "YOUR_NAVER_ACCOUNT_ID"; // 광고센터에서 확인
wcs_do();
</script>
```

### 전환 완료 페이지 (문의 감사 페이지)에 추가

```html
<script type="text/javascript">
// 문의/견적 완료 페이지에서 실행
function trackNaverConversion() {
  if (typeof wcs !== 'undefined') {
    wcs.cnv("track", "2026-06-11-견적문의");  // 고유 전환 액션명
  }
}
</script>
```

## 3. 문의 폼 제출 시 GA4 전환 이벤트

```javascript
// 문의 폼 제출 성공 시 함께 실행
gtag('event', 'generate_lead', {
  'event_category': 'engagement',
  'event_label': '견적문의_폼',
  'value': 1
});
```

## 4. 카톡/채널톡 버튼 클릭 시

```javascript
gtag('event', 'conversion', {
  'send_to': 'G-D141VGTF79',
  'event_category': 'contact',
  'event_label': '카톡상담_클릭'
});
```

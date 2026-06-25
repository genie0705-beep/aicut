# Threads 새 글 작성 자동화 — 프로세스 가이드

> 확정: 2026-06-14
> 스크립트: `threads_post_quick.js`

---

## ✅ 전제 조건

- Threads 탭이 열려 있고 **Instagram 세션으로 로그인**되어 있어야 함
- 로그인 상태 확인: 페이지에 "프로필", "게시" 등의 메뉴가 보여야 함

---

## 🔄 실행 순서

### 1. Threads 로그인 확인
```
threads.com 접속 → "Instagram으로 계속하기" 버튼 클릭
→ Instagram 세션으로 자동 로그인
→ 성공 시 프로필 메뉴 표시됨
```

### 2. 입력 영역 찾기
- 홈 피드 상단의 **"새로운 소식이 있나요?"** 영역 클릭
- 또는 `role="textbox"` / `[contenteditable]` 요소 찾기

### 3. 텍스트 입력
```
keyboard.type(내용, { delay: 5 })
```
- 첫 줄: 제목/핵심 메시지
- 빈 줄로 단락 구분
- 이모티콘 포함 (🛒✨🎬 등)
- 마지막 줄: aicut.co.kr 링크

### 4. 게시
- **"게시"** 버튼 클릭 (role="button", text="게시")
- 또는 `keyboard.press('Enter')`

### 5. 확인
게시 후 피드로 돌아오면 성공

---

## 📝 글 작성 포맷 (템플릿)

```
[핵심 메시지] 🛒

[설명 1-2줄]

[설명 1-2줄] ✨

aicut.co.kr
```

---

## ⚙️ 실행 스크립트

```bash
node threads_post_quick.js
```

자동으로:
1. Threads 탭 찾기
2. 입력 영역 찾아서 클릭
3. 텍스트 입력 (스크립트 내 postText 변수 수정 가능)
4. 게시 버튼 클릭

---

## ❌ 주의사항

- Threads는 React SPA → DOM 직접 조작 불가 (keyboard.type() 방식만 유효)
- 로그인 세션이 만료되면 다시 로그인 필요
- 게시 버튼을 못 찾으면 Enter로 대체 가능

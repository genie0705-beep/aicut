# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

## 브라우저 자동화 설정 (2026-06-22)

### 원칙
- **시크릿 모드 절대 사용 금지** — 항상 일반 모드(Chrome)로 실행
- `--user-data-dir`로 새 프로필 생성 (`--incognito` 금지)

### Chrome 149+ 제약
- 기본 프로필(`C:\Users\paul\AppData\Local\Google\Chrome\User Data`) + `--remote-debugging-port` = ❌ 차단됨
  - 오류: "DevTools remote debugging requires a non-default data directory"
- 해결: `--user-data-dir=임시폴더` 로 새 프로필 생성 후 CDP 연결

### 사용 프로필
- **경로:** `C:\Users\paul\AppData\Local\Temp\chrome_normal_profile`
- **포트:** 9224
- **특징:** 시크릿 아님, 일반 모드, 데이터 유지됨
- **로그인:** 한 번만 하면 다음에 재사용 시 자동 유지

### 실행 명령어
```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$profile = "C:\Users\paul\AppData\Local\Temp\chrome_normal_profile"
# 프로필 초기화 (처음만)
Remove-Item -Recurse -Force $profile
# 실행
cmd /c start "" "`"$chrome`"" --remote-debugging-port=9224 --user-data-dir="`"$profile`"" --no-first-run --no-default-browser-check "URL"
```

### CDP 연결
```javascript
const b = await chromium.connectOverCDP('http://127.0.0.1:9224');
// 주의: browser.close() 금지! → 모든 탭 종료됨
// 대신 browser.disconnect() 사용 → 연결만 종료, 브라우저 유지
```

### image_gen.js
- CDP_PORT 환경변수: 9224 사용 (9223 → 9224로 변경)

## 브랜드 CTA 정보
- **카카오톡 채널:** https://pf.kakao.com/_GIesX/chat
- **이메일:** master@aicut.co.kr
- **홈페이지:** https://aicut.co.kr

---

Add whatever helps you do your job. This is your cheat sheet.

## Related

- [Agent workspace](/concepts/agent-workspace)

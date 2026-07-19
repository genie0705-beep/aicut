# -*- coding: utf-8 -*-
import re, unicodedata
html = open('memorial_admin.html', encoding='utf-8').read()

# 검사할 이모지 문자열들
targets = [
    '\u26a1\ufe0f \uc624\ub298 \ucc98\ub9ac\ud560 \ud56d\ubaa9',  # ⚡️ 오늘 처리할 항목
    '\U0001f4cd \uc704\uce58 \ud604\ud669',  # 📍 위치 현황
    '\U0001f4b3 \ub2e4\uac00\uc624\ub294 \uad00\ub9ac\ube44',  # 💳 다가오는 관리비
    '\U0001f4cb \uc624\ub298\uc758 \uc5c5\ubb34',  # 📋 오늘의 업무
    '\U0001f56f \ub2e4\uac00\uc624\ub294 \ucd94\ubaa8\uc77c',  # 🕯 다가오는 추모일
    '\U0001f5fa \uc704\uce58(\uad6c\uc88c) \uad00\ub9ac',  # 🗺 위치(구좌) 관리
    '\U0001f4c5 \uc608\uc57d \ud604\ud669',  # 📅 예약 현황
    '\U0001f4dd \uacc4\uc57d \uad00\ub9ac',  # 📝 계약 관리
    '\u2795 \ucd94\uac00\uc548\uc7a5\ub8cc / \uc9c4\ud589\ube44',  # ➕ 추가안장료 / 진행비
    '\u23f3 \uad00\ub9ac\ube44 \uc8fc\uae30 \ub9cc\ub8cc \uc608\uc815',  # ⏳ 관리비 주기 만료 예정
    '\U0001f4dd \uc2e0\uaddc \uacc4\uc57d \uc791\uc131',  # 📝 신규 계약 작성
    '\U0001f4b0 \uad00\ub9ac\ube44 \uad00\ub9ac',  # 💰 관리비 관리
    '\U0001f465 \uc601\uc5c5\uc790 \uad00\ub9ac',  # 👥 영업자 관리
    '\uc218\uc218\ub8cc \uc815\uc0b0',  # 수수료 정산
    '\u2705 \uad00\ub9ac\ube44 \ub0a9\ubd80 \ub0b4\uc5ed',  # ✅ 관리비 납부 내역
    '\U0001f4ca \ub9e4\ucd9c \uad00\ub9ac',  # 📊 매출 관리
    '\U0001f4c5 \ub0a9\ubd80 \uc608\uc815 \ub2ec\ub825',  # 📅 납부 예정 달력
    '\U0001f4c8 \uc6d4\uac04 \ub9e4\ucd9c \ucd94\uc774',  # 📈 월간 매출 추이
    '\U0001f4cb \uacc4\uc57d \ud604\ud669 \uc694\uc57d',  # 📋 계약 현황 요약
    '\u26d4\ufe0f \uc5f0\uccb4 \uad00\ub9ac',  # ⛔️ 연체 관리
    '\U0001f464 \uc9c1\uc6d0 \ubaa9\ub85d',  # 👤 직원 목록
    '\U0001f4cc \uc5c5\ubb34\uc9c0\uc2dc',  # 📌 업무지시
    '\u23f0 \uc624\ub298 \ucd9c\ud1f4\uadfc \ud604\ud669',  # ⏰ 오늘 출퇴근 현황
    '\U0001f3d6 \ud734\uac00\ub2e4 \ubd80\uc7ac \uc77c\uc815',  # 🏖 휴가·부재 일정
    '\U0001f46a \uc720\uc871(\uace0\uac1d) \uad00\ub9ac',  # 👪 유족(고객) 관리
    '\U0001f4cb \ucd5c\uadfc \ubc29\ubb38 \uae30\ub85d',  # 📋 최근 방문 기록
    '\U0001f4dd \uc720\uc871 \uba54\ubaa8',  # 📝 유족 메모
    '\U0001f514 \uc54c\ub9bc \ud15c\ud50c\ub9bf \uad00\ub9ac',  # 🔔 알림 템플릿 관리
    '\U0001f4dd \uc8fc\uc81c\ubcc4 \uc608\uc2dc \ubb38\uad6c',  # 📝 주제별 예시 문구
    '\U0001f4f1 \ubc1c\uc1a1 \ubbf8\ub9ac\ubcf4\uae30',  # 📱 발송 미리보기
    '\u23f0 \uc790\ub3d9 \ubc1c\uc1a1 \uc124\uc815',  # ⏰ 자동 발송 설정
    '\U0001f4cb \ubc1c\uc1a1 \ub85c\uadf8',  # 📋 발송 로그
    '\U0001f4cc \ubc1c\uc1a1 \ub85c\uadf8 \uc608\uc2dc',  # 📌 발송 로그 예시
    '\u2699\ufe0f \uc0ac\uc5c5\uc7a5 \uc124\uc815',  # ⚙️ 사업장 설정
    '\U0001f4b5 \uad00\ub9ac\ube44 \uae30\ubcf8 \uc124\uc815',  # 💵 관리비 기본 설정
    '\U0001f558 \ucd94\ubaa8\uc77c \uc54c\ub9bc\ud1a1 \ubc1c\uc1a1 \ub2e8\uacc4',  # 🕊 추모일 알림톡 발송 단계
    '\U0001f4e4 \ubc95\uc815 \uc2e0\uace0 \u00b7 \ub370\uc774\ud130 \ubc31\uc5c5',  # 📤 법정 신고 · 데이터 백업
    '\U0001f4c2 \uacfc\uac70 \ub370\uc774\ud130 \uac00\uc838\uc624\uae30',  # 📂 과거 데이터 가져오기
]

for t in targets:
    count = html.count(t)
    if count > 0:
        print('  FOUND: %s' % t[:35])
    else:
        # bare emoji check
        print('  MISS: %s' % t[:35])

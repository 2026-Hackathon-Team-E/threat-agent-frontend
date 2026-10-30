# threat-agent-frontend

실시간 보안 위협 대응 에이전트의 프론트엔드(PoC). 빌드 도구 없이 HTML·JS 파일만 쓴다.

## 실행

```bash
# 백엔드를 먼저 띄운다 (기본 http://localhost:8000)
# 프론트는 정적 파일 서버로 띄운다
cd threat-agent-frontend
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속. 백엔드 주소는 `src/config.js`에서 바꾼다.

## 구조

```
index.html          화면 뼈대
src/config.js       백엔드 주소, 갱신 주기
src/api.js          백엔드 호출 함수 (fetch 래퍼)
src/render.js       목록·상세 렌더링
src/app.js          진입점, 주기적 갱신, 이벤트 연결
src/style.css       스타일
tests/fixtures/     백엔드 없이 화면을 그릴 때 쓰는 샘플 JSON
docs/SCREENS.md     화면 구성과 상태별 동작 명세
```

## 규칙

- 프레임워크, 번들러, npm 의존성을 추가하지 않는다. (PoC 범위, 필요 시 리드와 상의)
- 백엔드 응답 필드는 `threat-agent-backend/docs/API.md`를 기준으로 쓴다.
- 담당: tmdtndks. 이 레포의 규칙은 `CLAUDE.md`를 따른다.

## 구현 후 추가사항 (이전 docs/SCREENS.md에 잘못 붙어 있던 내용)

# Threat Agent Frontend
바닐라 HTML/CSS/JavaScript 기반 보안 위협 대시보드입니다. 프레임워크 및 npm 의존성이 없습니다.

## 실행
```bash
python -m http.server 8080
```
브라우저에서 http://localhost:8080 을 여세요. `src/config.js`의 `USE_FIXTURE=true`가 기본값이므로 백엔드 없이 동작합니다. 실제 API를 사용하려면 `USE_FIXTURE=false`로 변경하고 백엔드를 http://localhost:8000 에서 실행하세요. 백엔드 CORS는 http://localhost:8080 을 허용해야 합니다.
Fixture 재생 버튼은 네트워크 POST를 보내지 않는 시뮬레이션입니다. 실제 모드에서만 POST /replay/{cve}를 호출합니다.

## 구현
요약 카드, 영향 목록, 상세 근거·diff·재스캔, 위협 목록·상세, 3초 폴링, 백그라운드 중단, 404/202/연결 실패 처리.

## 테스트
브라우저에서 개발자 도구 Console/Network를 열고 Fixture 로딩을 확인하세요. 실제 백엔드 연동 및 브라우저 E2E는 별도 확인이 필요합니다.

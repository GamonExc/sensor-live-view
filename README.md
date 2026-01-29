# Excello Ts App (풍구 감시)

POSCO 광양 2고로 송풍지관 풍구 감시용 모바일 앱. 블루투스(HC-06 등 SPP)로 센서 데이터를 수신해 풍구별 상태를 표시합니다.

## 현재 상태 요약

### 기능

- **스플래시** → **기기 선택(블루투스)** → **개요(Overview)** → **상세(Detail)** / **대시보드(Dashboard)** 플로우
- 블루투스 클래식(SPP) 기기 목록 표시, 페어링된 기기 선택 후 연결
- 개요: 42개 풍구 번호 원 + 중앙 3D 이미지, 풍구 15번 탭 시 상세 화면
- 상세: CH1 온도 3자리 디지털 셀, 위험/안전(관리값 기준), 번호/관리/설치 테이블
- 대시보드: 실시간 센서 8ch, NTC/LTE/배터리 등, 수신 로그, **관리값(°C) 설정** (AsyncStorage 저장)
- 관리값: 대시보드에서 변경·저장 → 상세 화면 위험/안전 판단에 반영
- 하드웨어 뒤로가기: 상세/대시보드 → 개요, 개요 → 기기 목록
- 회전 잠금: 세로(portrait) 고정

### UI/디자인

- 배경 검정(#040000), 포인트 파랑(#00A5E5, #1565C0), 텍스트 흰색
- 맑은 고딕(malgun.ttf, malgunbd.ttf) 커스텀 폰트
- Safe area 반영(상·하·좌·우), 하단 최소 32px, 세이프 영역 배경 #ffffff
- 일반 / 폴드 펼침 / 폴드 접힘(outer) 대응: 개요 화면 원 크기를 가로·세로 사용 가능 영역으로 제한

### 기술 스택

- Expo SDK 54, React Native, TypeScript
- expo-router, react-native-bluetooth-classic(SPP)
- AsyncStorage(관리값 저장), react-native-safe-area-context

### 블루투스

- HC-06 등 **클래식 블루투스(SPP)** 모듈과 통신
- 모듈은 대기 모드로 두고, 폰 블루투스 설정에서 페어링 후 앱 목록에 표시 → 선택해 연결

### 빌드

- **개발 빌드(Expo Dev Client):** `npx eas build -p android --profile development`
- **내부 배포(APK):** `npx eas build -p android --profile preview`
- **버전:** `app.json`의 `version`(표시용), `android.versionCode`(정수). preview 프로필에 `autoIncrement: true` 설정으로 빌드 시 versionCode 자동 증가.

## 로컬 실행

```bash
npm install
npx expo start
```

USB 연결 기기에서 빌드·실행:

```bash
npx expo run:android
```

## 프로젝트 구조 (요약)

- `app/(tabs)/index.tsx` — 메인 플로우(스텝별 화면 전환)
- `screens/` — Splash, DeviceList, Overview, Detail, Dashboard
- `hooks/useBluetooth.ts` — 블루투스 연결·수신·파싱
- `hooks/useManagementValue.ts` — 관리값 AsyncStorage
- `utils/parsePacket.ts` — 수신 패킷 파싱
- `components/vent-number-ring.tsx` — 풍구 번호 원

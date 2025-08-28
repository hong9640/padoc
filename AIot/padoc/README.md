# 📘 파닥(PADOC) 프로젝트 구조 및 가이드

## 🧭 프로젝트 요약

| 항목      | 설명                                         |
| ------- | ------------------------------------------ |
| 프로젝트 이름 | `padoc` (파닥: 파킨슨 닥터)                       |
| UI 구성   | QML (Qt Quick + Controls + Layouts)        |
| 백엔드 로직  | C++ (Qt C++ Class, contextProperty 연결 가능)  |
| 플랫폼     | Windows (개발), Linux (최종 빌드 및 배포)           |
| 리소스     | QML 및 정적 리소스를 모두 `.qrc` 자동 관리              |
| 협업      | GitLab 기반 브랜치 전략 및 자동화 가능 (추후 CI/CD 설정 가능) |

## 📁 디렉토리 구조 설명

``` text
padoc/
├── qml/                     # QML 화면 구성 파일
│   ├── Main.qml             # 앱의 최상위 Window
│   ├── screens/             # 각 기능별 전체 화면 (Page 기반)
│   └── components/          # 버튼, 타이틀, 팝업 등 재사용 UI 컴포넌트
├── resource/               # 앱에서 사용하는 이미지, 아이콘, 폰트 등
│   ├── icons/
│   ├── images/
│   └── fonts/
├── src/                     # C++ 로직
│   ├── main.cpp             # QML UI를 로드하는 진입점
│   └── backend/             # 나중에 QObject기반 기능들 연결
├── cmake/                   # CMake 커스텀 스크립트
│   ├── AutoQrc.cmake        # QML 자동 리소스 생성
│   └── AutoResourceQrc.cmake # 이미지/폰트 등 정적 리소스 자동 생성
├── qml.qrc.in               # QML 리소스 템플릿
├── resource.qrc.in          # 이미지/폰트 리소스 템플릿
├── CMakeLists.txt           # 전체 프로젝트 빌드 정의
└── build/                   # 빌드 디렉토리 (자동 생성, Git 제외)
```

### ⚙️ 주요 파일 설명
| 파일                      | 역할                                        |
| ----------------------- | ----------------------------------------- |
| `main.cpp`              | Qt 앱 진입점, `Main.qml`을 `engine.load()`로 로드 |
| `Main.qml`              | 앱 전체를 감싸는 최상위 Window. StackView로 화면 전환    |
| `MainScreen.qml`        | 첫 진입 화면. 버튼 등 인터랙션 구성                     |
| `AutoQrc.cmake`         | `qml/` 내부 QML 파일들을 자동으로 qrc에 포함           |
| `AutoResourceQrc.cmake` | `resources/` 내부 이미지/폰트 등 리소스를 자동 포함       |
| `qml.qrc.in`            | QML 리소스를 위한 템플릿 (자동 변환됨)                  |
| `resource.qrc.in`       | 정적 리소스 템플릿 (자동 변환됨)                       |
| `CMakeLists.txt`        | 빌드 정의. 실행파일 생성 및 리소스 포함 처리                |

## ✍️ 프로젝트 파일 수정 및 추가 방법

### 📌 1. 새로운 화면을 만들고 싶을 때
- `qml/screens/`에 `.qml` 파일 생성
    - 예: `DiagnosisPage.qml`, `ResultPage.qml`
- StackView에서 이동할 땐 반드시 qrc:/qml/screens/DiagnosisPage.qml 식으로 접근
```qml
Button {
    text: "다음"
    onClicked: stackView.push("qrc:/qml/screens/DiagnosisPage.qml")
}
```

### 📌 2. 공통 UI 컴포넌트를 만들고 싶을 때
- `qml/components/`에 추가
    - 예: `PadocButton.qml`, `PadocHeader.qml`
- `import "../components"` 또는 alias로 import

### 📌 3. 이미지, 아이콘, 폰트 추가하고 싶을 때
- `resource/icons/`, `resource/images/`, `resource/fonts/`에 파일 추가
- 파일 추가 후 CMake 다시 빌드하면 자동 반영됨
```qml
Image {
    source: "qrc:/res/icons/logo.png"
}
FontLoader {
    source: "qrc:/res/fonts/NotoSansKR-Regular.ttf"
}
```

### 📌 4. C++과 연결하고 싶을 때
- `src/backend/`에 `QObject` 상속한 클래스 추가
- `QQmlContext` 또는 `qmlRegisterType`으로 QML에서 사용 가능
- 나중에 `singleton`, `controller` 같은 구조로 연결하면 됨

## 🧪 디버깅 팁

| 증상             | 확인                                           |
| -------------- | -------------------------------------------- |
| 창이 하얗게 뜸       | `initialItem` 경로 확인 (`qrc:/qml/...`)         |
| 리소스가 안 나옴      | `qrc:/res/...` 경로 정확히 확인                     |
| 콘솔 출력 없음       | `console.log(...)`, `qDebug()`로 확인           |
| StackView 안 보임 | 초기 페이지에서 렌더링 요소(`Rectangle`, `color`) 넣어 테스트 |

## ✅ 핵심 요약
- QML은 `qml/`, 리소스는 `resources/`에 넣으면 됨
- 경로는 항상 `qrc:/...`로 접근해야 함
- `.qml` / `.png` / `.ttf` 등은 자동 `.qrc`로 등록되므로 별도 설정 불필요
- 화면 전환은 StackView(`id: mainStackView`)로 처리 (initialItem, push/pop)
- 이 모든 구조는 CMake에서 자동 관리되며 cross-platform 빌드 가능
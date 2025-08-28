/**
 * @file Main.qml
 * @brief 애플리케이션의 메인 윈도우(Window)이자 최상위 QML 컴포넌트입니다.
 * @details 이 파일은 애플리케이션의 전체 창을 정의하고, 모든 화면(Screen)에서 공유되는
 * 전역 상태 프로퍼티들을 선언하며, 화면 전환을 관리하는 메인 StackView를 포함합니다.
 */

import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Window {
    id: mainWindow
    visible: true
    width: 1024
    height: 600
    title: "파닥: 파킨슨 닥터"
    // flags: Qt.FramelessWindowHint    // 제목 표시줄 없이 풀스크린 Kiosk 모드로 실행 (윈도우 캡쳐용)

    // --- 사용자 세션 및 데이터 ---
    property string appToken: ""
    property var latestTrainingItem: ({})
    property real latestScore: NaN

    // --- 자가 진단 진행 상태 ---
    property int checkListCount: 0

    // --- 기초 훈련 진행 상태 ---
    // 기초 훈련1
    property int basiccount1: 1
    // 기초 훈련2
    property int basiccount2: 1
    property int basic2connect: -1

    // --- 심화 훈련 진행 상태 ---
    // 심화 훈련1
    property int advancedcount1: 1
    // 심화 훈련2
    property int advancedcount2: 1
    // 심화 훈련3
    property int advancedcount3: 0

    // --- 최종 점수 집계 ---
    property int totalScore: 0
    property int totalProgress: 0

    // --- 녹음 파일 경로 저장 ---
    property var basicTraining1Paths: []
    property var basicTraining2Paths: []

    StackView {
        id: mainStackView
        anchors.fill: parent
        initialItem: "qrc:/qml/screens/MainScreen.qml"

        pushEnter: Transition { NumberAnimation { duration: 0 } }
        pushExit: Transition { NumberAnimation { duration: 0 } }
        popEnter: Transition { NumberAnimation { duration: 0 } }
        popExit: Transition { NumberAnimation { duration: 0 } }
        replaceEnter: Transition { NumberAnimation { duration: 0 } }
        replaceExit: Transition { NumberAnimation { duration: 0 } }
    }
}

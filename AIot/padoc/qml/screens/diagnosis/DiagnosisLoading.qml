import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts
import QtQuick.Effects

import "../../components"

// 컴포넌트를 import
Page {
    id: diagnosisLoadingPage
    width: 1024
    height: 600

    // 사이드바 인덱스 설정
    property int pageIndex: -1

    property var saveTesting1Path: []
    property var saveTesting2Path: []
    property bool aiStarted: false // 한 번만 실행 보장

    property var anResult: null
    property var aiResult: null

    Timer {
        id: aiStartTimer
        interval: 100 // 100ms (0.1초) 딜레이
        running: false
        repeat: false
        onTriggered: {
            if (!aiStarted) {
                aiStarted = true
                //console.log("Praat 음성분석 경로: ", saveTesting1Path)
                voiceAnalyzer.analyze(saveTesting1Path)
                //console.log("AI 추론 wav 경로: ", saveTesting2Path)
                aiUtils.runAiInference(saveTesting2Path)
            }
        }
    }

    Component.onCompleted: {
        aiStartTimer.start()
    }

    Rectangle {
        anchors.fill: parent
        width: 1024
        height: 600
        color: "#FFFFFF" // 전체 배경색
        z: -1 // 모든 UI 뒤에 배경이 위치하도록 설정
    }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        SideBar {
            Layout.fillHeight: true
            // 메뉴 전달
            menuModel: ["안내", "자가 문진", "음성 검사 1", "음성 검사 2", "결과"]
            // 사이드바 제목
            titleText: "진단 서비스"
            // 현재 페이지의 인덱스 전달
            currentIndex: diagnosisLoadingPage.pageIndex

            onHomeConfirmed: {
                audioRecorder.stopRecording()
                mainStackView.popToIndex(0)
            }
        }

        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            ColumnLayout {
                anchors.centerIn: parent

                spacing: 35

                Rectangle {
                    height: 350
                    width: 700

                    border.width: 4
                    border.color: "#113162"
                    radius: 12

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 15

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            horizontalAlignment: Text.AlignHCenter
                            text: "파킨슨병은 신경퇴행성 질환으로,<br>연령이 증가할수록 유병률과 발병률이 증가합니다."
                            font.weight: 700
                            font.pixelSize: 27
                            color: "#113162"
                            lineHeightMode: Text.ProportionalHeight
                            lineHeight: 1.5
                        }

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            horizontalAlignment: Text.AlignHCenter
                            text: "초기에는 적은 용량의 약물로 충분한 개선 효과를 얻을 수 있으며,<br>어려움 없이 일상생활을 할 수 있습니다."
                            font.weight: 700
                            font.pixelSize: 27
                            color: "#113162"
                            lineHeightMode: Text.ProportionalHeight
                            lineHeight: 1.5
                        }

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            horizontalAlignment: Text.AlignHCenter
                            text: "파킨슨병의 초기 진단은 매우 중요합니다."
                            font.weight: 700
                            font.pixelSize: 27
                            color: "#113162"
                            lineHeightMode: Text.ProportionalHeight
                            lineHeight: 1.5
                        }
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "음성 분석 중입니다"
                    color: "#113162"
                    font.pixelSize: 32
                    font.bold: true
                }
            }
        }
    }

    // 음성 분석 및 AI 추론 결과를 받아서 결과 페이지로 이동
    function tryGoToResultPage() {
        // 둘 다 값이 세팅됐을 때만 페이지 이동
        if (anResult !== null && aiResult !== null) {
            mainStackView.push("qrc:/qml/screens/diagnosis/DiagnosisResult.qml", {
                "anResult": anResult,
                "aiResult": aiResult
            });
            // 만약 연속으로 여러 번 진단할 거면 아래처럼 값 초기화도 필요!
            anResult = null;
            aiResult = null;
        }
    }

    Connections {
        target: voiceAnalyzer
        function onAnalysisCompleted(result) {
            anResult = Object.assign({}, result);
            tryGoToResultPage();
        }
    }

    Connections {
        target: aiUtils
        function onInferenceResultReady(result) {
            aiResult = result;
            tryGoToResultPage();
        }
    }
}

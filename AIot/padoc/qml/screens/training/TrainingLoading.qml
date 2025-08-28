import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts
import QtQuick.Effects

import "../../components"

// 컴포넌트를 import
Page {
    id: trainingLoadingPage
    width: 1024
    height: 600

    // 사이드바 인덱스 설정
    property int pageIndex: -1

    // 한 번만 시작하도록 가드 (기존 aiStarted 대체)
    property bool startGuard: false

    // 결과를 둘로 분리
    property var result1: null
    property var result2: null

    // 현재 진행 스텝(0:대기, 1:첫 분석 중, 2:둘째 분석 중, 3:완료)
    property int analysisStep: 0

    Timer {
        id: startTimer
        interval: 100 // 100ms (0.1초) 딜레이
        running: false
        repeat: false
        onTriggered: {
            if (!startGuard) {
                startGuard = true
                // 1단계 시작: 첫 번째 리스트 분석
                analysisStep = 1
                //console.log("Praat 음성분석(1) 경로: ",
                            // mainWindow.basicTraining1Paths)
                voiceAnalyzer.analyze(mainWindow.basicTraining1Paths)
            }
        }
    }

    Component.onCompleted: {
        startTimer.start()
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
            menuModel: ["메인", "기초연습", "심화연습", "결과"]
            // 사이드바 제목
            titleText: "음성 트레이닝\n서비스"
            // 현재 페이지의 인덱스 전달
            currentIndex: trainingLoadingPage.pageIndex

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
                    height: 400
                    width: 700

                    border.width: 4
                    radius: 12

                    ColumnLayout {
                        anchors.centerIn: parent
                        spacing: 15

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            text: qsTr("발성 및 호흡 훈련")
                            font.weight: 700
                            font.pixelSize: 25
                        }

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            horizontalAlignment: Text.AlignHCenter
                            text: "파킨슨병 환자는 발성 근유의 약화와 호흡 조절의 어려움으로 인해<br>음성이 작아지거나 발음이 부정확해지는 경우가 많습니다."
                            font.weight: 700
                            font.pixelSize: 18
                            lineHeightMode: Text.ProportionalHeight
                            lineHeight: 1.5
                        }

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            horizontalAlignment: Text.AlignHCenter
                            text: "발성 및 호흡 근육을 강화하고 호흡 조절 능력을 향상시키는 훈련이 필요합니다."
                            font.weight: 700
                            font.pixelSize: 18
                        }

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            text: qsTr("집중 음성치료 프로그램")
                            font.weight: 700
                            font.pixelSize: 25
                        }

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            horizontalAlignment: Text.AlignHCenter
                            text: "집중적인 음성 치료 프로그램은 파킨슨 환자의 언어 장애를<br>개선하는데 효과적인 것으로 알려져 있습니다."
                            font.weight: 700
                            font.pixelSize: 18
                            lineHeightMode: Text.ProportionalHeight
                            lineHeight: 1.5
                        }

                        Text {
                            Layout.alignment: Text.AlignHCenter
                            horizontalAlignment: Text.AlignHCenter
                            text: "꾸준한 트레이닝을 응원합니다."
                            font.weight: 700
                            font.pixelSize: 20
                        }
                    }
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: analysisStep === 1 ? "음성 분석(1/2) 중입니다" : analysisStep
                                               === 2 ? "음성 분석(2/2) 중입니다" : "음성 분석 대기 중"
                    color: "#113162"
                    font.pixelSize: 32
                    font.bold: true
                }
            }
        }
    }

    // 음성 분석 및 AI 추론 결과를 받아서 결과 페이지로 이동
    function tryGoToResultPage() {
        if (result1 !== null && result2 !== null) {
            mainStackView.push("qrc:/qml/screens/training/TrainingResult.qml", {
                                   "result1": result1,
                                   "result2": result2
                               })
            result1 = null
            result2 = null
            analysisStep = 3
        }
    }

    Connections {
        target: voiceAnalyzer

        function onAnalysisCompleted(result) {
            if (analysisStep === 1) {
                result1 = Object.assign({}, result)
                analysisStep = 2
                //console.log("Praat 음성분석(2) 경로: ", mainWindow.basicTraining2Paths)
                voiceAnalyzer.analyze(mainWindow.basicTraining2Paths)
            } else if (analysisStep === 2) {
                result2 = Object.assign({}, result)
                analysisStep = 3
                tryGoToResultPage()
            } else {
                //console.log("Unexpected analysisCompleted at step:", analysisStep)
            }
        }

        function onAnalysisFailed(error) {
            //console.log("분석 실패:", error)
        }
    }
}

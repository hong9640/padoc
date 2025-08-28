import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtCharts

import "../../components"

Page {
    id: advancedTraining32Page

    // 사이드바 인덱스 설정
    property int pageIndex: 2
    property int aT3Score: 0

    // 질문 목록
    property var questions: [
        "가",
        "나",
        "다",
        "라",
        "마",
        "바",
        "사",
        "아",
        "자",
        "차"
    ]

    property var loud: [
        "작게",
        "크게"
    ]

    width: 1024
    height: 600

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
            currentIndex: advancedTraining32Page.pageIndex

            onHomeConfirmed: {
                audioController.stop()
                mainStackView.popToIndex(0)
            }
        }
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true

            color: "white"

            Rectangle {
                y: 49
                width: 750
                height: 250
                border.color: "#113162"
                border.width: 4
                anchors.horizontalCenterOffset: 0
                radius: 20
                anchors.horizontalCenter: parent.horizontalCenter

                Text {
                    id: text2
                    x: 0
                    y: 15
                    width: 750
                    height: 52
                    color: "#000000"
                    text: qsTr("크고 작게 말하기 (" + (mainWindow.advancedcount3 + 1) + " / 10)")
                    font.pixelSize: 40
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.bold: true
                }

                Text {
                    id: text3
                    x: 145
                    y: 101
                    width: 239
                    height: 95
                    text: qsTr(loud[mainWindow.advancedcount3%2])
                    font.pixelSize: (mainWindow.advancedcount3%2) * 15 + 25
                    font.bold: (mainWindow.advancedcount3%2)
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }

                Text {
                    id: text4
                    x: 227
                    y: 80
                    width: 418
                    height: 137
                    text: qsTr(questions[mainWindow.advancedcount3])
                    font.pixelSize: 100
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.weight: 1200
                }
            }

            // 리펙토링해서 개선예정
            LineSeries {
                id: dbSeries
            }
            LineSeries {
                id: waveSeries
            }

            // 좌측 버튼: BorderButton 컴포넌트
            BorderButton {
                x: 272
                y: 357
                width: 281
                height: 179
                buttonText: "다음"
                fontSize: 70
                borderColor: "#113162"
                borderWidth: 12
                cornerRadius: 25
                bgColor: "white"
                textColor: "#113162"
                onClicked: {
                    if (mainWindow.advancedcount3 < questions.length-1) {
                        aT3Score += scoreCalculator.calculateScoreMaxdB(dbSeries,mainWindow.advancedcount3%2)
                        mainWindow.advancedcount3++
                        //console.log(questions[mainWindow.advancedcount3-1])
                        //console.log("초기화 전 확인: " + dbSeries.count)
                        dbSeries.clear()
                        waveSeries.clear()
                        //console.log("초기화 후 확인: " + dbSeries.count)
                    } else {
                        audioController.stop()
                        aT3Score += scoreCalculator.calculateScoreMaxdB(dbSeries,mainWindow.advancedcount3%2)
                        //console.log("맞은 갯수: " + aT3Score)
                        mainWindow.totalProgress++
                        mainWindow.totalScore += (aT3Score*10)
                        scoreSend.send(mainWindow.totalScore, mainWindow.totalProgress, mainWindow.appToken)
                        //console.log("결과 페이지 이동"+mainWindow.totalScore+" || "+mainWindow.totalProgress)
                        mainStackView.push("qrc:/qml/screens/training/TrainingLoading.qml")
                    }
                }
            }
        }
    }

    Connections {
        target: scoreSend
        function onSendSuccess(message) {
            //console.log("점수 전송에 성공하였습니다. message:", message)
        }

        function onSendFailed(message) {
            //console.log("점수 전송에 실패하였습니다. message:", message)
        }
    }

    Component.onCompleted: {
        audioController.start(waveSeries, dbSeries)
        //console.log("dB 출력 시작")
    }
}
